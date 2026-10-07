package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Assignment;
import com.eduflow.model.Course;
import com.eduflow.model.Submission;
import com.eduflow.model.User;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SubmissionDAO {

    public Submission submitAssignment(String assignmentId, String studentId, String courseId, String fileUrl, String fileName) throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO submissions (id, assignment_id, student_id, course_id, file_url, file_name, status, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP)
            ON CONFLICT(assignment_id, student_id) DO UPDATE SET
                file_url = excluded.file_url,
                file_name = excluded.file_name,
                status = 'submitted',
                submitted_at = CURRENT_TIMESTAMP
            RETURNING id, assignment_id, student_id, course_id, file_url, file_name, submitted_at, status, marks, feedback, graded_by, graded_at;
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, assignmentId);
            ps.setString(3, studentId);
            ps.setString(4, courseId);
            ps.setString(5, fileUrl != null ? fileUrl : "");
            ps.setString(6, fileName != null ? fileName : "submission.pdf");

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public Submission getSubmission(String assignmentId, String studentId) throws SQLException {
        String sql = "SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, assignmentId);
            ps.setString(2, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<Submission> getSubmissionsForAssignment(String assignmentId) throws SQLException {
        String sql = """
            SELECT s.*, u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            WHERE s.assignment_id = ?
            ORDER BY s.submitted_at DESC
        """;
        List<Submission> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, assignmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Submission s = mapRow(rs);
                    User student = new User();
                    student.setId(s.getStudentId());
                    student.setName(rs.getString("student_name"));
                    student.setEmail(rs.getString("student_email"));
                    s.setStudent(student);
                    list.add(s);
                }
            }
        }
        return list;
    }

    public List<Submission> getSubmissionsByInstructor(String instructorId) throws SQLException {
        String sql = """
            SELECT s.*, u.name as student_name, u.email as student_email,
                   a.title as assignment_title, a.max_marks,
                   c.title as course_title
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN courses c ON s.course_id = c.id
            JOIN users u ON s.student_id = u.id
            WHERE c.instructor_id = ?
            ORDER BY s.submitted_at DESC
        """;
        List<Submission> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, instructorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Submission s = mapRow(rs);

                    User student = new User();
                    student.setId(s.getStudentId());
                    student.setName(rs.getString("student_name"));
                    student.setEmail(rs.getString("student_email"));
                    s.setStudent(student);

                    Assignment a = new Assignment();
                    a.setId(s.getAssignmentId());
                    a.setTitle(rs.getString("assignment_title"));
                    a.setMaxMarks(rs.getInt("max_marks"));
                    s.setAssignment(a);

                    Course c = new Course();
                    c.setId(s.getCourseId());
                    c.setTitle(rs.getString("course_title"));
                    s.setCourse(c);

                    list.add(s);
                }
            }
        }
        return list;
    }

    public Submission gradeSubmission(String submissionId, double marks, String feedback, String graderId) throws SQLException {
        String sql = """
            UPDATE submissions
            SET marks = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP, status = 'graded'
            WHERE id = ?
            RETURNING *;
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, marks);
            ps.setString(2, feedback != null ? feedback : "");
            ps.setString(3, graderId);
            ps.setString(4, submissionId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<Submission> getSubmissionsForStudent(String studentId) throws SQLException {
        String sql = """
            SELECT s.*, a.title as assignment_title, a.max_marks, c.title as course_title
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN courses c ON s.course_id = c.id
            WHERE s.student_id = ?
            ORDER BY s.submitted_at DESC
        """;
        List<Submission> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Submission s = mapRow(rs);
                    Assignment a = new Assignment();
                    a.setId(s.getAssignmentId());
                    a.setTitle(rs.getString("assignment_title"));
                    a.setMaxMarks(rs.getInt("max_marks"));
                    s.setAssignment(a);

                    Course c = new Course();
                    c.setId(s.getCourseId());
                    c.setTitle(rs.getString("course_title"));
                    s.setCourse(c);

                    list.add(s);
                }
            }
        }
        return list;
    }

    private Submission mapRow(ResultSet rs) throws SQLException {
        Submission s = new Submission();
        s.setId(rs.getString("id"));
        s.setAssignmentId(rs.getString("assignment_id"));
        s.setStudentId(rs.getString("student_id"));
        s.setCourseId(rs.getString("course_id"));
        s.setFileUrl(rs.getString("file_url"));
        s.setFileName(rs.getString("file_name"));
        s.setSubmittedAt(rs.getString("submitted_at"));
        s.setStatus(rs.getString("status"));
        double m = rs.getDouble("marks");
        if (!rs.wasNull()) {
            s.setMarks(m);
        }
        s.setFeedback(rs.getString("feedback"));
        s.setGradedBy(rs.getString("graded_by"));
        s.setGradedAt(rs.getString("graded_at"));
        return s;
    }
}
