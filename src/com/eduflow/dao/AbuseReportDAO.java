package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.AbuseReport;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AbuseReportDAO {

    public AbuseReport createReport(String reviewId, String courseId, String studentId, String instructorId, String reason, String commentSnippet) throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO abuse_reports (id, review_id, course_id, student_id, instructor_id, reason, comment_snippet, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, reviewId != null ? reviewId : "");
            ps.setString(3, courseId);
            ps.setString(4, studentId);
            ps.setString(5, instructorId);
            ps.setString(6, reason != null ? reason : "Abusive Comments / Guideline Violation");
            ps.setString(7, commentSnippet != null ? commentSnippet : "");
            ps.executeUpdate();
        }

        return getReportById(id);
    }

    public AbuseReport getReportById(String id) throws SQLException {
        String sql = """
            SELECT ar.*,
                   s.name as student_name, s.email as student_email, s.profile_image as student_image, s.is_active as student_active,
                   i.name as instructor_name, i.email as instructor_email,
                   c.title as course_title
            FROM abuse_reports ar
            JOIN users s ON ar.student_id = s.id
            JOIN users i ON ar.instructor_id = i.id
            JOIN courses c ON ar.course_id = c.id
            WHERE ar.id = ?
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<AbuseReport> getAllReports() throws SQLException {
        String sql = """
            SELECT ar.*,
                   s.name as student_name, s.email as student_email, s.profile_image as student_image, s.is_active as student_active,
                   i.name as instructor_name, i.email as instructor_email,
                   c.title as course_title
            FROM abuse_reports ar
            JOIN users s ON ar.student_id = s.id
            JOIN users i ON ar.instructor_id = i.id
            JOIN courses c ON ar.course_id = c.id
            ORDER BY ar.created_at DESC
        """;

        List<AbuseReport> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        }
        return list;
    }

    public boolean resolveReport(String reportId, String status, String adminNotes) throws SQLException {
        String sql = "UPDATE abuse_reports SET status = ?, admin_notes = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, adminNotes != null ? adminNotes : "");
            ps.setString(3, reportId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deactivateStudentByReport(String reportId, String adminNotes) throws SQLException {
        AbuseReport report = getReportById(reportId);
        if (report == null) return false;

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Deactivate student
                try (PreparedStatement psUser = conn.prepareStatement("UPDATE users SET is_active = 0 WHERE id = ?")) {
                    psUser.setString(1, report.getStudentId());
                    psUser.executeUpdate();
                }

                // 2. Mark report resolved
                try (PreparedStatement psRep = conn.prepareStatement("UPDATE abuse_reports SET status = 'resolved', admin_notes = ? WHERE id = ?")) {
                    psRep.setString(1, (adminNotes != null && !adminNotes.isEmpty()) ? adminNotes : "Student account deactivated by administrator due to abusive comments.");
                    psRep.setString(2, reportId);
                    psRep.executeUpdate();
                }

                conn.commit();
                return true;
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private AbuseReport mapRow(ResultSet rs) throws SQLException {
        AbuseReport ar = new AbuseReport();
        ar.setId(rs.getString("id"));
        ar.setReviewId(rs.getString("review_id"));
        ar.setCourseId(rs.getString("course_id"));
        ar.setCourseTitle(rs.getString("course_title"));
        ar.setStudentId(rs.getString("student_id"));
        ar.setStudentName(rs.getString("student_name"));
        ar.setStudentEmail(rs.getString("student_email"));
        ar.setStudentImage(rs.getString("student_image"));
        ar.setStudentActive(rs.getInt("student_active") == 1);
        ar.setInstructorId(rs.getString("instructor_id"));
        ar.setInstructorName(rs.getString("instructor_name"));
        ar.setInstructorEmail(rs.getString("instructor_email"));
        ar.setReason(rs.getString("reason"));
        ar.setCommentSnippet(rs.getString("comment_snippet"));
        ar.setStatus(rs.getString("status"));
        ar.setAdminNotes(rs.getString("admin_notes"));
        ar.setCreatedAt(rs.getString("created_at"));
        return ar;
    }
}
