package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.User;
import com.eduflow.util.PasswordUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserDAO {

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, email.trim());
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public User findById(String id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public User findByGoogleId(String googleId) throws SQLException {
        if (googleId == null || googleId.trim().isEmpty()) return null;
        String sql = "SELECT * FROM users WHERE google_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, googleId.trim());
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public User createUser(User user) throws SQLException {
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId(UUID.randomUUID().toString());
        }
        String sql = """
            INSERT INTO users (id, name, email, password, google_id, profile_image, auth_provider, bio, skills, role, is_active, created_at, updated_at)
            VALUES (?, ?, LOWER(?), ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user.getId());
            pstmt.setString(2, user.getName());
            pstmt.setString(3, user.getEmail().trim());

            // Google users do not require a local password
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                pstmt.setString(4, PasswordUtil.hashPassword(user.getPassword()));
            } else {
                pstmt.setString(4, "");
            }

            pstmt.setString(5, user.getGoogleId() != null ? user.getGoogleId() : "");
            pstmt.setString(6, user.getProfileImage() != null ? user.getProfileImage() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
            pstmt.setString(7, user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL");
            pstmt.setString(8, user.getBio() != null ? user.getBio() : "");
            pstmt.setString(9, user.getSkills() != null ? user.getSkills() : "");
            pstmt.setString(10, user.getRole() != null ? user.getRole() : "student");
            pstmt.executeUpdate();
        }
        return findById(user.getId());
    }

    public void linkGoogleAccount(String userId, String googleId, String profileImage) throws SQLException {
        String sql = """
            UPDATE users SET
                google_id = ?,
                auth_provider = CASE WHEN auth_provider = 'LOCAL' THEN 'GOOGLE' ELSE auth_provider END,
                profile_image = CASE WHEN (profile_image IS NULL OR profile_image = '') THEN ? ELSE profile_image END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, googleId);
            pstmt.setString(2, profileImage != null ? profileImage : "");
            pstmt.setString(3, userId);
            pstmt.executeUpdate();
        }
    }

    public void updateProfile(String id, String name, String bio, String skills, String profileImage) throws SQLException {
        String sql = """
            UPDATE users SET
                name = COALESCE(?, name),
                bio = COALESCE(?, bio),
                skills = COALESCE(?, skills),
                profile_image = COALESCE(?, profile_image),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, name);
            pstmt.setString(2, bio);
            pstmt.setString(3, skills);
            pstmt.setString(4, profileImage);
            pstmt.setString(5, id);
            pstmt.executeUpdate();
        }
    }

    public void updatePassword(String id, String newPassword) throws SQLException {
        String sql = "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, PasswordUtil.hashPassword(newPassword));
            pstmt.setString(2, id);
            pstmt.executeUpdate();
        }
    }

    public void toggleActiveStatus(String id) throws SQLException {
        String sql = "UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.executeUpdate();
        }
    }

    public List<User> listUsers(String role, String search, int page, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM users WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (role != null && !role.equalsIgnoreCase("all") && !role.isEmpty()) {
            sql.append("AND role = ? ");
            params.add(role);
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (name LIKE ? OR email LIKE ?) ");
            String wild = "%" + search.trim() + "%";
            params.add(wild);
            params.add(wild);
        }
        sql.append("ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add((page - 1) * limit);

        List<User> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public int countUsers(String role, String search) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM users WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (role != null && !role.equalsIgnoreCase("all") && !role.isEmpty()) {
            sql.append("AND role = ? ");
            params.add(role);
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (name LIKE ? OR email LIKE ?) ");
            String wild = "%" + search.trim() + "%";
            params.add(wild);
            params.add(wild);
        }

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getString("id"));
        u.setName(rs.getString("name"));
        u.setEmail(rs.getString("email"));
        u.setPassword(rs.getString("password"));
        u.setRole(rs.getString("role"));
        u.setProfileImage(rs.getString("profile_image"));
        u.setBio(rs.getString("bio"));
        u.setSkills(rs.getString("skills"));
        u.setActive(rs.getInt("is_active") == 1);

        try {
            u.setGoogleId(rs.getString("google_id"));
            u.setAuthProvider(rs.getString("auth_provider"));
            u.setUpdatedAt(rs.getString("updated_at"));
        } catch (SQLException ignored) {}

        u.setCreatedAt(rs.getString("created_at"));
        return u;
    }
}
