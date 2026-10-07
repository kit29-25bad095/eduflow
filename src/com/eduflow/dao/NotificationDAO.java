package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Notification;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class NotificationDAO {

    public Notification createNotification(String recipientId, String type, String title, String message) throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO notifications (id, recipient_id, type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            RETURNING *;
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, recipientId);
            ps.setString(3, type);
            ps.setString(4, title);
            ps.setString(5, message);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<Notification> getNotificationsForUser(String recipientId) throws SQLException {
        String sql = "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50";
        List<Notification> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, recipientId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public boolean markAsRead(String notificationId, String recipientId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, notificationId);
            ps.setString(2, recipientId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean markAllAsRead(String recipientId) throws SQLException {
        String sql = "UPDATE notifications SET is_read = 1 WHERE recipient_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, recipientId);
            return ps.executeUpdate() >= 0;
        }
    }

    public int getUnreadCount(String recipientId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND is_read = 0";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, recipientId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    private Notification mapRow(ResultSet rs) throws SQLException {
        Notification n = new Notification();
        n.setId(rs.getString("id"));
        n.setRecipientId(rs.getString("recipient_id"));
        n.setType(rs.getString("type"));
        n.setTitle(rs.getString("title"));
        n.setMessage(rs.getString("message"));
        n.setRead(rs.getInt("is_read") == 1);
        n.setCreatedAt(rs.getString("created_at"));
        return n;
    }
}
