package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Certificate;

import java.security.SecureRandom;
import java.sql.*;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CertificateDAO {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public Certificate findByStudentAndCourse(String studentId, String courseId) throws SQLException {
        String sql = "SELECT * FROM certificates WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public Certificate findByVerificationCode(String verificationCode) throws SQLException {
        String sql = "SELECT * FROM certificates WHERE LOWER(verification_code) = LOWER(?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, verificationCode.trim());
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<Certificate> getCertificatesByStudent(String studentId) throws SQLException {
        String sql = "SELECT * FROM certificates WHERE student_id = ? ORDER BY issued_date DESC";
        List<Certificate> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public Certificate createCertificate(String studentId, String courseId, String courseName, String studentName) throws SQLException {
        // Idempotency check: if already exists, return existing
        Certificate existing = findByStudentAndCourse(studentId, courseId);
        if (existing != null) {
            return existing;
        }

        String id = UUID.randomUUID().toString();
        int year = Year.now().getValue();
        int randSeq = 1000 + RANDOM.nextInt(9000);
        String certId = String.format("LMS-%d-CERT-%04d", year, randSeq);

        // Verification code generation e.g. LMS-2026-MAYA-8F42A
        String cleanInitials = studentName != null && !studentName.trim().isEmpty()
                ? studentName.trim().replaceAll("[^a-zA-Z]", "").toUpperCase()
                : "STU";
        if (cleanInitials.length() > 4) {
            cleanInitials = cleanInitials.substring(0, 4);
        }
        StringBuilder randCode = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            randCode.append(ALPHANUM.charAt(RANDOM.nextInt(ALPHANUM.length())));
        }
        String verificationCode = String.format("LMS-%d-%s-%s", year, cleanInitials, randCode);

        String sql = """
            INSERT INTO certificates (id, certificate_id, student_id, course_id, course_name, student_name, issued_date, certificate_url, verification_code, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.setString(2, certId);
            pstmt.setString(3, studentId);
            pstmt.setString(4, courseId);
            pstmt.setString(5, courseName != null ? courseName : "Accredited Course");
            pstmt.setString(6, studentName != null ? studentName : "Verified Learner");
            pstmt.setString(7, "/certificates/verify/" + verificationCode);
            pstmt.setString(8, verificationCode);
            pstmt.executeUpdate();
        }

        return findByStudentAndCourse(studentId, courseId);
    }

    private Certificate mapRow(ResultSet rs) throws SQLException {
        Certificate c = new Certificate();
        c.setId(rs.getString("id"));
        c.setCertificateId(rs.getString("certificate_id"));
        c.setStudentId(rs.getString("student_id"));
        c.setCourseId(rs.getString("course_id"));
        c.setCourseName(rs.getString("course_name"));
        c.setStudentName(rs.getString("student_name"));
        c.setIssuedDate(rs.getString("issued_date"));
        c.setCertificateUrl(rs.getString("certificate_url"));
        c.setVerificationCode(rs.getString("verification_code"));
        c.setCreatedAt(rs.getString("created_at"));
        return c;
    }
}
