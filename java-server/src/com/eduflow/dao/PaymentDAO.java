package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Payment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PaymentDAO {

    public Payment recordPayment(String studentId, String courseId, double amount, String paymentMethod, String transactionId) throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO payments (id, student_id, course_id, amount, currency, payment_method, transaction_id, status, created_at)
            VALUES (?, ?, ?, ?, 'USD', ?, ?, 'completed', CURRENT_TIMESTAMP)
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, studentId);
            ps.setString(3, courseId);
            ps.setDouble(4, amount);
            ps.setString(5, paymentMethod != null ? paymentMethod : "credit_card");
            ps.setString(6, transactionId != null ? transactionId : "TXN-" + System.currentTimeMillis());
            ps.executeUpdate();
        }

        Payment payment = new Payment(id, studentId, courseId, amount, "USD", paymentMethod, transactionId, "completed");
        return payment;
    }

    public List<Payment> getPaymentsByStudent(String studentId) throws SQLException {
        String sql = """
            SELECT p.*, c.title as course_title, c.thumbnail as course_thumbnail
            FROM payments p
            JOIN courses c ON p.course_id = c.id
            WHERE p.student_id = ?
            ORDER BY p.created_at DESC
        """;

        List<Payment> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Payment p = new Payment();
                    p.setId(rs.getString("id"));
                    p.setStudentId(rs.getString("student_id"));
                    p.setCourseId(rs.getString("course_id"));
                    p.setAmount(rs.getDouble("amount"));
                    p.setCurrency(rs.getString("currency"));
                    p.setPaymentMethod(rs.getString("payment_method"));
                    p.setTransactionId(rs.getString("transaction_id"));
                    p.setStatus(rs.getString("status"));
                    p.setCreatedAt(rs.getString("created_at"));
                    p.setCourseTitle(rs.getString("course_title"));
                    p.setCourseThumbnail(rs.getString("course_thumbnail"));
                    list.add(p);
                }
            }
        }
        return list;
    }

    public boolean hasPaidForCourse(String studentId, String courseId) throws SQLException {
        String sql = "SELECT 1 FROM payments WHERE student_id = ? AND course_id = ? AND status = 'completed'";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentId);
            ps.setString(2, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }
}
