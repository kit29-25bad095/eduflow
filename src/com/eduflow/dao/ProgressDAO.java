package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;

import java.sql.*;
import java.util.*;

public class ProgressDAO {

    public Map<String, Object> completeLesson(String studentId, String lessonId, int timeSpent) throws SQLException {
        String fetchCourseSql = "SELECT course_id FROM lessons WHERE id = ?";
        String courseId = null;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(fetchCourseSql)) {
            pstmt.setString(1, lessonId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    courseId = rs.getString("course_id");
                }
            }
        }

        if (courseId == null) {
            throw new SQLException("LESSON_NOT_FOUND");
        }

        String upsertProgressSql = """
            INSERT INTO lesson_progress (id, student_id, course_id, lesson_id, completed, completed_at, time_spent)
            VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?)
            ON CONFLICT(student_id, lesson_id) DO UPDATE SET
                completed = 1,
                completed_at = CURRENT_TIMESTAMP,
                time_spent = time_spent + excluded.time_spent
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(upsertProgressSql)) {
            pstmt.setString(1, UUID.randomUUID().toString());
            pstmt.setString(2, studentId);
            pstmt.setString(3, courseId);
            pstmt.setString(4, lessonId);
            pstmt.setInt(5, timeSpent > 0 ? timeSpent : 10);
            pstmt.executeUpdate();
        }

        // Update enrollment last accessed
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement("UPDATE enrollments SET last_accessed_at = CURRENT_TIMESTAMP WHERE student_id = ? AND course_id = ?")) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            pstmt.executeUpdate();
        }

        // Recalculate composite progress
        return calculateAndUpdateCourseProgress(studentId, courseId);
    }

    public Map<String, Object> calculateAndUpdateCourseProgress(String studentId, String courseId) throws SQLException {
        int totalLessons = 0;
        int completedLessons = 0;
        int totalAssignments = 0;
        int completedAssignments = 0;
        int totalQuizzes = 0;
        int passedQuizzes = 0;

        try (Connection conn = DatabaseManager.getConnection()) {
            // 1. Lessons
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM lessons WHERE course_id = ?")) {
                ps.setString(1, courseId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) totalLessons = rs.getInt(1);
                }
            }
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1")) {
                ps.setString(1, studentId);
                ps.setString(2, courseId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) completedLessons = rs.getInt(1);
                }
            }

            // 2. Assignments
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM assignments WHERE course_id = ?")) {
                ps.setString(1, courseId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) totalAssignments = rs.getInt(1);
                }
            }
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(DISTINCT assignment_id) FROM submissions WHERE student_id = ? AND assignment_id IN (SELECT id FROM assignments WHERE course_id = ?)")) {
                ps.setString(1, studentId);
                ps.setString(2, courseId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) completedAssignments = rs.getInt(1);
                }
            }

            // 3. Quizzes
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM quizzes WHERE course_id = ?")) {
                ps.setString(1, courseId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) totalQuizzes = rs.getInt(1);
                }
            }
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(DISTINCT quiz_id) FROM quiz_attempts WHERE student_id = ? AND course_id = ? AND passed = 1")) {
                ps.setString(1, studentId);
                ps.setString(2, courseId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) passedQuizzes = rs.getInt(1);
                }
            }
        }

        int totalItems = totalLessons + totalAssignments + totalQuizzes;
        int completedItems = completedLessons + completedAssignments + passedQuizzes;
        int progress = totalItems > 0 ? (int) Math.round((double) completedItems / totalItems * 100.0) : 0;

        // Completion criteria: All lessons completed, all assignments submitted (if any), all quizzes passed (if any)
        boolean isCompleted = (totalLessons > 0 && completedLessons >= totalLessons)
                && (totalAssignments == 0 || completedAssignments >= totalAssignments)
                && (totalQuizzes == 0 || passedQuizzes >= totalQuizzes);

        if (isCompleted) {
            progress = 100;
            try (Connection conn = DatabaseManager.getConnection();
                 PreparedStatement ps = conn.prepareStatement("UPDATE enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE student_id = ? AND course_id = ? AND status != 'completed'")) {
                ps.setString(1, studentId);
                ps.setString(2, courseId);
                ps.executeUpdate();
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("courseId", courseId);
        result.put("progress", progress);
        result.put("completedLessons", completedLessons);
        result.put("totalLessons", totalLessons);
        result.put("completedAssignments", completedAssignments);
        result.put("totalAssignments", totalAssignments);
        result.put("passedQuizzes", passedQuizzes);
        result.put("totalQuizzes", totalQuizzes);
        result.put("isCompleted", isCompleted);
        return result;
    }

    public Map<String, Object> getCourseProgress(String studentId, String courseId) throws SQLException {
        Map<String, Object> stats = calculateAndUpdateCourseProgress(studentId, courseId);

        List<String> completedIds = new ArrayList<>();
        String status = "not_enrolled";
        String completedAt = null;

        try (Connection conn = DatabaseManager.getConnection()) {
            try (PreparedStatement pstmt = conn.prepareStatement("SELECT lesson_id FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1")) {
                pstmt.setString(1, studentId);
                pstmt.setString(2, courseId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        completedIds.add(rs.getString("lesson_id"));
                    }
                }
            }

            try (PreparedStatement pstmt = conn.prepareStatement("SELECT status, completed_at FROM enrollments WHERE student_id = ? AND course_id = ?")) {
                pstmt.setString(1, studentId);
                pstmt.setString(2, courseId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        status = rs.getString("status");
                        completedAt = rs.getString("completed_at");
                    }
                }
            }
        }

        stats.put("completedLessonIds", completedIds);
        stats.put("enrollmentStatus", status);
        stats.put("completedAt", completedAt);
        return stats;
    }
}
