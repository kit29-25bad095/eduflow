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

        String totalLessonsSql = "SELECT COUNT(*) FROM lessons WHERE course_id = ?";
        String completedLessonsSql = "SELECT COUNT(*) FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1";
        String updateAccessSql = "UPDATE enrollments SET last_accessed_at = CURRENT_TIMESTAMP WHERE student_id = ? AND course_id = ?";
        String updateCompleteSql = "UPDATE enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE student_id = ? AND course_id = ? AND status != 'completed'";

        int totalLessons = 0;
        int completedLessons = 0;
        int progress = 0;
        boolean isCompleted = false;

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Record progress
                try (PreparedStatement pstmt = conn.prepareStatement(upsertProgressSql)) {
                    pstmt.setString(1, UUID.randomUUID().toString());
                    pstmt.setString(2, studentId);
                    pstmt.setString(3, courseId);
                    pstmt.setString(4, lessonId);
                    pstmt.setInt(5, timeSpent > 0 ? timeSpent : 10);
                    pstmt.executeUpdate();
                }

                // 2. Count totals
                try (PreparedStatement pstmt = conn.prepareStatement(totalLessonsSql)) {
                    pstmt.setString(1, courseId);
                    try (ResultSet rs = pstmt.executeQuery()) {
                        if (rs.next()) totalLessons = rs.getInt(1);
                    }
                }

                try (PreparedStatement pstmt = conn.prepareStatement(completedLessonsSql)) {
                    pstmt.setString(1, studentId);
                    pstmt.setString(2, courseId);
                    try (ResultSet rs = pstmt.executeQuery()) {
                        if (rs.next()) completedLessons = rs.getInt(1);
                    }
                }

                progress = totalLessons > 0 ? (int) Math.round((double) completedLessons / totalLessons * 100.0) : 0;
                isCompleted = progress == 100;

                // 3. Update enrollment last accessed
                try (PreparedStatement pstmt = conn.prepareStatement(updateAccessSql)) {
                    pstmt.setString(1, studentId);
                    pstmt.setString(2, courseId);
                    pstmt.executeUpdate();
                }

                // 4. If 100%, mark enrollment completed
                if (isCompleted) {
                    try (PreparedStatement pstmt = conn.prepareStatement(updateCompleteSql)) {
                        pstmt.setString(1, studentId);
                        pstmt.setString(2, courseId);
                        pstmt.executeUpdate();
                    }
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("progress", progress);
        result.put("completedLessons", completedLessons);
        result.put("totalLessons", totalLessons);
        result.put("isCompleted", isCompleted);
        result.put("courseId", courseId);
        return result;
    }

    public Map<String, Object> getCourseProgress(String studentId, String courseId) throws SQLException {
        String totalSql = "SELECT COUNT(*) FROM lessons WHERE course_id = ?";
        String recordsSql = "SELECT lesson_id FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1";
        String statusSql = "SELECT status, completed_at FROM enrollments WHERE student_id = ? AND course_id = ?";

        int total = 0;
        List<String> completedIds = new ArrayList<>();
        String status = "not_enrolled";
        String completedAt = null;

        try (Connection conn = DatabaseManager.getConnection()) {
            try (PreparedStatement pstmt = conn.prepareStatement(totalSql)) {
                pstmt.setString(1, courseId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) total = rs.getInt(1);
                }
            }

            try (PreparedStatement pstmt = conn.prepareStatement(recordsSql)) {
                pstmt.setString(1, studentId);
                pstmt.setString(2, courseId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        completedIds.add(rs.getString("lesson_id"));
                    }
                }
            }

            try (PreparedStatement pstmt = conn.prepareStatement(statusSql)) {
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

        int progress = total > 0 ? (int) Math.round((double) completedIds.size() / total * 100.0) : 0;

        Map<String, Object> map = new HashMap<>();
        map.put("progress", progress);
        map.put("completedLessons", completedIds.size());
        map.put("totalLessons", total);
        map.put("completedLessonIds", completedIds);
        map.put("enrollmentStatus", status);
        map.put("completedAt", completedAt);
        return map;
    }
}
