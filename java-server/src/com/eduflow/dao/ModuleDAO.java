package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Module;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class ModuleDAO {

    public Module createModule(String courseId, String title, String description, int order) throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = "INSERT INTO modules (id, course_id, title, description, order_num) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.setString(2, courseId);
            pstmt.setString(3, title);
            pstmt.setString(4, description != null ? description : "");
            pstmt.setInt(5, order);
            pstmt.executeUpdate();
        }
        return findById(id);
    }

    public Module findById(String id) throws SQLException {
        String sql = "SELECT * FROM modules WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new Module(
                        rs.getString("id"),
                        rs.getString("course_id"),
                        rs.getString("title"),
                        rs.getString("description"),
                        rs.getInt("order_num")
                    );
                }
            }
        }
        return null;
    }

    public void updateModule(String id, String title, String description, int order) throws SQLException {
        String sql = "UPDATE modules SET title = ?, description = ?, order_num = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, title);
            pstmt.setString(2, description);
            pstmt.setInt(3, order);
            pstmt.setString(4, id);
            pstmt.executeUpdate();
        }
    }

    public void deleteModule(String id) throws SQLException {
        String sql = "DELETE FROM modules WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.executeUpdate();
        }
    }
}
