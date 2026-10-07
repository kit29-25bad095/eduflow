package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.CourseReview;
import com.eduflow.model.User;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ReviewDAO {

    public CourseReview addReview(String courseId, String studentId, int rating, String comment) throws SQLException {
        // Resolve actual course ID if slug is passed
        String resolvedCourseId = courseId;
        String findSql = "SELECT id FROM courses WHERE id = ? OR slug = ? LIMIT 1";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(findSql)) {
            ps.setString(1, courseId);
            ps.setString(2, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    resolvedCourseId = rs.getString(1);
                }
            }
        }

        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO reviews (id, course_id, student_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(course_id, student_id) DO UPDATE SET
                rating = excluded.rating,
                comment = excluded.comment,
                created_at = CURRENT_TIMESTAMP
            RETURNING *;
        """;

        CourseReview review = null;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, resolvedCourseId);
            ps.setString(3, studentId);
            ps.setInt(4, rating);
            ps.setString(5, comment != null ? comment : "");
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    review = mapRow(rs);
                }
            }
        }

        // Recalculate average rating on course
        recalculateCourseRating(resolvedCourseId);

        return review;
    }

    public List<CourseReview> getReviewsForCourse(String courseId) throws SQLException {
        String sql = """
            SELECT r.*, u.name as student_name, u.profile_image
            FROM reviews r
            JOIN users u ON r.student_id = u.id
            WHERE r.course_id = ? OR r.course_id IN (SELECT id FROM courses WHERE slug = ?)
            ORDER BY r.created_at DESC
        """;
        List<CourseReview> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, courseId);
            ps.setString(2, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    CourseReview cr = mapRow(rs);
                    User student = new User();
                    student.setId(cr.getStudentId());
                    student.setName(rs.getString("student_name"));
                    student.setProfileImage(rs.getString("profile_image"));
                    cr.setStudent(student);
                    list.add(cr);
                }
            }
        }
        return list;
    }

    public CourseReview getReviewById(String reviewId) throws SQLException {
        String sql = """
            SELECT r.*, u.name as student_name, u.email as student_email, u.profile_image, c.title as course_title, c.instructor_id
            FROM reviews r
            JOIN users u ON r.student_id = u.id
            JOIN courses c ON r.course_id = c.id
            WHERE r.id = ?
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, reviewId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    CourseReview cr = mapRow(rs);
                    User student = new User();
                    student.setId(cr.getStudentId());
                    student.setName(rs.getString("student_name"));
                    student.setEmail(rs.getString("student_email"));
                    student.setProfileImage(rs.getString("profile_image"));
                    cr.setStudent(student);
                    cr.setCourseTitle(rs.getString("course_title"));
                    return cr;
                }
            }
        }
        return null;
    }

    public List<CourseReview> getReviewsForInstructor(String instructorId, boolean isAdmin) throws SQLException {
        String sql = """
            SELECT r.*, u.name as student_name, u.email as student_email, u.profile_image, c.title as course_title,
                   (SELECT COUNT(*) FROM abuse_reports ar WHERE ar.review_id = r.id) as report_count,
                   (SELECT status FROM abuse_reports ar WHERE ar.review_id = r.id LIMIT 1) as report_status
            FROM reviews r
            JOIN users u ON r.student_id = u.id
            JOIN courses c ON r.course_id = c.id
            WHERE ? = 1 OR c.instructor_id = ?
            ORDER BY r.created_at DESC
        """;
        List<CourseReview> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, isAdmin ? 1 : 0);
            ps.setString(2, instructorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    CourseReview cr = mapRow(rs);
                    User student = new User();
                    student.setId(cr.getStudentId());
                    student.setName(rs.getString("student_name"));
                    student.setEmail(rs.getString("student_email"));
                    student.setProfileImage(rs.getString("profile_image"));
                    cr.setStudent(student);
                    cr.setCourseTitle(rs.getString("course_title"));
                    cr.setReported(rs.getInt("report_count") > 0);
                    cr.setReportStatus(rs.getString("report_status") != null ? rs.getString("report_status") : "");
                    list.add(cr);
                }
            }
        }
        return list;
    }

    public boolean deleteReview(String reviewId, String userId, boolean isAdmin) throws SQLException {
        String findSql = "SELECT course_id, student_id FROM reviews WHERE id = ?";
        String courseId = null;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(findSql)) {
            ps.setString(1, reviewId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    courseId = rs.getString("course_id");
                }
            }
        }
        if (courseId == null) return false;

        // Verify authorization: admin, or instructor of the course
        if (!isAdmin) {
            String checkInstructor = "SELECT 1 FROM courses WHERE id = ? AND instructor_id = ?";
            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement(checkInstructor)) {
                ps.setString(1, courseId);
                ps.setString(2, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        return false; // Not authorized
                    }
                }
            }
        }

        String deleteSql = "DELETE FROM reviews WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(deleteSql)) {
            ps.setString(1, reviewId);
            int rows = ps.executeUpdate();
            if (rows > 0) {
                recalculateCourseRating(courseId);
                return true;
            }
        }
        return false;
    }

    private void recalculateCourseRating(String courseId) throws SQLException {
        String avgSql = "SELECT COUNT(*), AVG(rating) FROM reviews WHERE course_id = ?";
        int count = 0;
        double avg = 0.0;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(avgSql)) {
            ps.setString(1, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    count = rs.getInt(1);
                    avg = rs.getDouble(2);
                }
            }
        }

        String updateCourse = "UPDATE courses SET rating_count = ?, rating_avg = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(updateCourse)) {
            ps.setInt(1, count);
            ps.setDouble(2, Math.round(avg * 10.0) / 10.0);
            ps.setString(3, courseId);
            ps.executeUpdate();
        }
    }

    private CourseReview mapRow(ResultSet rs) throws SQLException {
        CourseReview r = new CourseReview();
        r.setId(rs.getString("id"));
        r.setCourseId(rs.getString("course_id"));
        r.setStudentId(rs.getString("student_id"));
        r.setRating(rs.getInt("rating"));
        r.setComment(rs.getString("comment"));
        r.setCreatedAt(rs.getString("created_at"));
        return r;
    }
}
