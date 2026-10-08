package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Course;
import com.eduflow.model.Enrollment;
import com.eduflow.model.User;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class EnrollmentDAO {

    public boolean isEnrolled(String studentId, String courseId) throws SQLException {
        String sql = """
            SELECT 1 FROM enrollments 
            WHERE student_id = ? 
              AND (course_id = ? OR course_id IN (SELECT id FROM courses WHERE slug = ?))
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            pstmt.setString(3, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public java.util.Set<String> getEnrolledCourseIds(String studentId) throws SQLException {
        String sql = "SELECT course_id FROM enrollments WHERE student_id = ?";
        java.util.Set<String> set = new java.util.HashSet<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    set.add(rs.getString(1));
                }
            }
        }
        return set;
    }

    public Enrollment enroll(String studentId, String courseId) throws SQLException {
        if (isEnrolled(studentId, courseId)) {
            throw new SQLException("ALREADY_ENROLLED");
        }

        String id = UUID.randomUUID().toString();
        String sqlEnr = "INSERT INTO enrollments (id, student_id, course_id, status) VALUES (?, ?, ?, 'active')";
        String sqlCount = "UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?";

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement pstmt = conn.prepareStatement(sqlEnr)) {
                    pstmt.setString(1, id);
                    pstmt.setString(2, studentId);
                    pstmt.setString(3, courseId);
                    pstmt.executeUpdate();
                }
                try (PreparedStatement pstmt = conn.prepareStatement(sqlCount)) {
                    pstmt.setString(1, courseId);
                    pstmt.executeUpdate();
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }

        Enrollment enr = new Enrollment();
        enr.setId(id);
        enr.setStudentId(studentId);
        enr.setCourseId(courseId);
        enr.setStatus("active");
        return enr;
    }

    public List<Enrollment> getMyEnrolledCourses(String studentId) throws SQLException {
        String sql = """
            SELECT e.*, c.title as course_title, c.thumbnail as course_thumb, c.category as course_category,
                   c.price as course_price, c.duration as course_duration,
                   u.name as instructor_name, u.profile_image as instructor_image
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON c.instructor_id = u.id
            WHERE e.student_id = ?
            ORDER BY e.last_accessed_at DESC
        """;

        List<Enrollment> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Enrollment e = new Enrollment();
                    e.setId(rs.getString("id"));
                    e.setStudentId(rs.getString("student_id"));
                    e.setCourseId(rs.getString("course_id"));
                    e.setStatus(rs.getString("status"));
                    e.setEnrolledAt(rs.getString("enrolled_at"));
                    e.setCompletedAt(rs.getString("completed_at"));
                    e.setLastAccessedAt(rs.getString("last_accessed_at"));

                    Course c = new Course();
                    c.setId(rs.getString("course_id"));
                    c.setTitle(rs.getString("course_title"));
                    c.setThumbnail(rs.getString("course_thumb"));
                    c.setCategory(rs.getString("course_category"));
                    c.setPrice(rs.getDouble("course_price"));
                    c.setDuration(rs.getString("course_duration"));

                    User inst = new User();
                    inst.setName(rs.getString("instructor_name"));
                    inst.setProfileImage(rs.getString("instructor_image"));
                    c.setInstructor(inst);
                    e.setCourse(c);

                    // Dynamically calculate progress %
                    int totalLessons = countTotalLessons(conn, c.getId());
                    int completedLessons = countCompletedLessons(conn, studentId, c.getId());
                    int prog = totalLessons > 0 ? (int) Math.round((double) completedLessons / totalLessons * 100.0) : 0;

                    e.setTotalLessons(totalLessons);
                    e.setCompletedLessons(completedLessons);
                    e.setProgress(prog);

                    list.add(e);
                }
            }
        }
        return list;
    }

    public List<Enrollment> listAllEnrollments(int page, int limit) throws SQLException {
        String sql = """
            SELECT e.*, c.title as course_title, c.category as course_category, c.thumbnail as course_thumb,
                   u.name as student_name, u.email as student_email, u.profile_image as student_image
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON e.student_id = u.id
            ORDER BY e.enrolled_at DESC
            LIMIT ? OFFSET ?
        """;

        List<Enrollment> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, limit);
            pstmt.setInt(2, (page - 1) * limit);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Enrollment e = new Enrollment();
                    e.setId(rs.getString("id"));
                    e.setStudentId(rs.getString("student_id"));
                    e.setCourseId(rs.getString("course_id"));
                    e.setStatus(rs.getString("status"));
                    e.setEnrolledAt(rs.getString("enrolled_at"));
                    e.setCompletedAt(rs.getString("completed_at"));

                    Course c = new Course();
                    c.setId(rs.getString("course_id"));
                    c.setTitle(rs.getString("course_title"));
                    c.setCategory(rs.getString("course_category"));
                    c.setThumbnail(rs.getString("course_thumb"));
                    e.setCourse(c);

                    User student = new User();
                    student.setId(rs.getString("student_id"));
                    student.setName(rs.getString("student_name"));
                    student.setEmail(rs.getString("student_email"));
                    student.setProfileImage(rs.getString("student_image"));
                    // Store student in enrollment if needed
                    list.add(e);
                }
            }
        }
        return list;
    }

    private int countTotalLessons(Connection conn, String courseId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM lessons WHERE course_id = ?";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private int countCompletedLessons(Connection conn, String studentId, String courseId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }
}
