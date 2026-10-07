package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Course;
import com.eduflow.model.User;

import java.sql.*;
import java.util.*;

public class WishlistDAO {

    public boolean isWishlisted(String studentId, String courseId) throws SQLException {
        String sql = "SELECT 1 FROM wishlist WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean toggleWishlist(String studentId, String courseId) throws SQLException {
        if (isWishlisted(studentId, courseId)) {
            removeFromWishlist(studentId, courseId);
            return false;
        } else {
            addToWishlist(studentId, courseId);
            return true;
        }
    }

    public void addToWishlist(String studentId, String courseId) throws SQLException {
        String sql = "INSERT OR IGNORE INTO wishlist (id, student_id, course_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, UUID.randomUUID().toString());
            pstmt.setString(2, studentId);
            pstmt.setString(3, courseId);
            pstmt.executeUpdate();
        }
    }

    public void removeFromWishlist(String studentId, String courseId) throws SQLException {
        String sql = "DELETE FROM wishlist WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            pstmt.executeUpdate();
        }
    }

    public Set<String> getWishlistCourseIds(String studentId) throws SQLException {
        String sql = "SELECT course_id FROM wishlist WHERE student_id = ?";
        Set<String> set = new HashSet<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    set.add(rs.getString("course_id"));
                }
            }
        }
        return set;
    }

    public List<Course> getWishlistCourses(String studentId) throws SQLException {
        String sql = """
            SELECT c.*, u.name as instructor_name, u.profile_image as instructor_image, u.bio as instructor_bio
            FROM wishlist w
            JOIN courses c ON w.course_id = c.id
            JOIN users u ON c.instructor_id = u.id
            WHERE w.student_id = ?
            ORDER BY w.created_at DESC
        """;
        List<Course> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Course c = new Course();
                    c.setId(rs.getString("id"));
                    c.setTitle(rs.getString("title"));
                    c.setSlug(rs.getString("slug"));
                    c.setDescription(rs.getString("description"));
                    c.setShortDescription(rs.getString("short_description"));
                    c.setThumbnail(rs.getString("thumbnail"));
                    c.setCategory(rs.getString("category"));
                    c.setLevel(rs.getString("level"));
                    c.setLanguage(rs.getString("language"));
                    c.setPrice(rs.getDouble("price"));
                    c.setInstructorId(rs.getString("instructor_id"));
                    c.setDuration(rs.getString("duration"));
                    c.setStatus(rs.getString("status"));
                    c.setRatingAvg(rs.getDouble("rating_avg"));
                    c.setRatingCount(rs.getInt("rating_count"));
                    c.setEnrolledCount(rs.getInt("enrolled_count"));
                    c.setCreatedAt(rs.getString("created_at"));
                    try { c.setSkills(rs.getString("skills")); } catch (Exception ignored) {}
                    try { c.setTags(rs.getString("tags")); } catch (Exception ignored) {}

                    User inst = new User();
                    inst.setId(rs.getString("instructor_id"));
                    inst.setName(rs.getString("instructor_name"));
                    inst.setProfileImage(rs.getString("instructor_image"));
                    c.setInstructor(inst);

                    list.add(c);
                }
            }
        }
        return list;
    }
}
