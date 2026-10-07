package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Assignment;
import com.eduflow.model.Submission;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AssignmentDAO {

    public Assignment createAssignment(Assignment assign) throws SQLException {
        if (assign.getId() == null || assign.getId().isEmpty()) {
            assign.setId(UUID.randomUUID().toString());
        }
        String sql = """
            INSERT INTO assignments (id, course_id, module_id, title, description, instructions, due_date, max_marks, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, assign.getId());
            pstmt.setString(2, assign.getCourseId());
            pstmt.setString(3, assign.getModuleId());
            pstmt.setString(4, assign.getTitle());
            pstmt.setString(5, assign.getDescription());
            pstmt.setString(6, assign.getInstructions() != null ? assign.getInstructions() : "");
            pstmt.setString(7, assign.getDueDate() != null ? assign.getDueDate() : "2026-12-31 23:59:59");
            pstmt.setInt(8, assign.getMaxMarks() > 0 ? assign.getMaxMarks() : 100);
            pstmt.setString(9, assign.getCreatedBy());
            pstmt.executeUpdate();
        }
        return findById(assign.getId());
    }

    public Assignment findById(String id) throws SQLException {
        String sql = "SELECT * FROM assignments WHERE id = ?";
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

    public List<Assignment> listByCourse(String courseId, String studentId) throws SQLException {
        String sql = "SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date ASC";
        String subSql = "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?";

        List<Assignment> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Assignment a = mapRow(rs);

                    if (studentId != null && !studentId.isEmpty()) {
                        try (PreparedStatement pstmtSub = conn.prepareStatement(subSql)) {
                            pstmtSub.setString(1, a.getId());
                            pstmtSub.setString(2, studentId);
                            try (ResultSet rsSub = pstmtSub.executeQuery()) {
                                if (rsSub.next()) {
                                    Submission sub = new Submission();
                                    sub.setId(rsSub.getString("id"));
                                    sub.setAssignmentId(rsSub.getString("assignment_id"));
                                    sub.setStudentId(rsSub.getString("student_id"));
                                    sub.setFileUrl(rsSub.getString("file_url"));
                                    sub.setFileName(rsSub.getString("file_name"));
                                    sub.setSubmittedAt(rsSub.getString("submitted_at"));
                                    sub.setStatus(rsSub.getString("status"));
                                    sub.setMarks(rsSub.getObject("marks") != null ? rsSub.getDouble("marks") : null);
                                    sub.setFeedback(rsSub.getString("feedback"));
                                    a.setMySubmission(sub);
                                }
                            }
                        }
                    }
                    list.add(a);
                }
            }
        }
        return list;
    }

    public void updateAssignment(Assignment a) throws SQLException {
        String sql = "UPDATE assignments SET title = ?, description = ?, instructions = ?, due_date = ?, max_marks = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, a.getTitle());
            pstmt.setString(2, a.getDescription());
            pstmt.setString(3, a.getInstructions());
            pstmt.setString(4, a.getDueDate());
            pstmt.setInt(5, a.getMaxMarks());
            pstmt.setString(6, a.getId());
            pstmt.executeUpdate();
        }
    }

    public void deleteAssignment(String id) throws SQLException {
        String sql = "DELETE FROM assignments WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.executeUpdate();
        }
    }

    private Assignment mapRow(ResultSet rs) throws SQLException {
        Assignment a = new Assignment();
        a.setId(rs.getString("id"));
        a.setCourseId(rs.getString("course_id"));
        a.setModuleId(rs.getString("module_id"));
        a.setTitle(rs.getString("title"));
        a.setDescription(rs.getString("description"));
        a.setInstructions(rs.getString("instructions"));
        a.setDueDate(rs.getString("due_date"));
        a.setMaxMarks(rs.getInt("max_marks"));
        a.setCreatedBy(rs.getString("created_by"));
        return a;
    }
}
