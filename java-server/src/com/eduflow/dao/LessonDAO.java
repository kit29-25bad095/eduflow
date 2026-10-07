package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Lesson;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class LessonDAO {

    public Lesson createLesson(String moduleId, String courseId, String title, String description, String videoUrl, String content, int duration, int order, boolean isPreview) throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO lessons (id, module_id, course_id, title, description, video_url, content, duration, order_num, is_preview)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.setString(2, moduleId);
            pstmt.setString(3, courseId);
            pstmt.setString(4, title);
            pstmt.setString(5, description != null ? description : "");
            pstmt.setString(6, videoUrl != null ? videoUrl : "https://www.w3schools.com/html/mov_bbb.mp4");
            pstmt.setString(7, content != null ? content : "");
            pstmt.setInt(8, duration > 0 ? duration : 10);
            pstmt.setInt(9, order);
            pstmt.setInt(10, isPreview ? 1 : 0);
            pstmt.executeUpdate();
        }
        return findById(id);
    }

    public Lesson findById(String id) throws SQLException {
        String sql = "SELECT * FROM lessons WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    Lesson l = new Lesson(
                        rs.getString("id"),
                        rs.getString("module_id"),
                        rs.getString("course_id"),
                        rs.getString("title"),
                        rs.getString("video_url"),
                        rs.getInt("duration"),
                        rs.getInt("is_preview") == 1
                    );
                    l.setDescription(rs.getString("description"));
                    l.setContent(rs.getString("content"));
                    l.setOrder(rs.getInt("order_num"));
                    try { l.setResources(rs.getString("resources")); } catch (Exception ignored) {}
                    return l;
                }
            }
        }
        return null;
    }

    public void updateLesson(String id, String title, String description, String videoUrl, String content, int duration, boolean isPreview) throws SQLException {
        String sql = "UPDATE lessons SET title = ?, description = ?, video_url = ?, content = ?, duration = ?, is_preview = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, title);
            pstmt.setString(2, description);
            pstmt.setString(3, videoUrl);
            pstmt.setString(4, content);
            pstmt.setInt(5, duration);
            pstmt.setInt(6, isPreview ? 1 : 0);
            pstmt.setString(7, id);
            pstmt.executeUpdate();
        }
    }

    public void deleteLesson(String id) throws SQLException {
        String sql = "DELETE FROM lessons WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.executeUpdate();
        }
    }
}
