package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Quiz;
import com.eduflow.model.QuizAttempt;
import com.eduflow.model.QuizQuestion;
import com.google.gson.Gson;

import java.sql.*;
import java.util.*;

public class QuizDAO {
    private static final Gson GSON = new Gson();

    public List<Quiz> getQuizzesByCourse(String courseId, String studentId) throws SQLException {
        String sql = "SELECT * FROM quizzes WHERE course_id = ? ORDER BY order_num ASC";
        List<Quiz> quizzes = new ArrayList<>();

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Quiz q = mapQuiz(rs);
                    q.setQuestions(getQuestionsForQuiz(q.getId(), false));
                    if (studentId != null) {
                        q.setUserAttempt(getLatestAttempt(studentId, q.getId()));
                    }
                    quizzes.add(q);
                }
            }
        }
        return quizzes;
    }

    public Quiz getQuizById(String quizId, boolean includeAnswers) throws SQLException {
        String sql = "SELECT * FROM quizzes WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, quizId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    Quiz q = mapQuiz(rs);
                    q.setQuestions(getQuestionsForQuiz(quizId, includeAnswers));
                    return q;
                }
            }
        }
        return null;
    }

    public List<QuizQuestion> getQuestionsForQuiz(String quizId, boolean includeAnswers) throws SQLException {
        String sql = "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC";
        List<QuizQuestion> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, quizId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    QuizQuestion qq = new QuizQuestion();
                    qq.setId(rs.getString("id"));
                    qq.setQuizId(rs.getString("quiz_id"));
                    qq.setQuestionText(rs.getString("question_text"));
                    qq.setOptionA(rs.getString("option_a"));
                    qq.setOptionB(rs.getString("option_b"));
                    qq.setOptionC(rs.getString("option_c"));
                    qq.setOptionD(rs.getString("option_d"));
                    qq.setOrderNum(rs.getInt("order_num"));
                    qq.setCreatedAt(rs.getString("created_at"));
                    if (includeAnswers) {
                        qq.setCorrectOption(rs.getString("correct_option"));
                        qq.setExplanation(rs.getString("explanation"));
                    }
                    list.add(qq);
                }
            }
        }
        return list;
    }

    public Map<String, Object> submitQuizAttempt(String studentId, String courseId, String quizId, Map<String, String> submittedAnswers) throws SQLException {
        Quiz quiz = getQuizById(quizId, true);
        if (quiz == null) {
            throw new SQLException("QUIZ_NOT_FOUND");
        }

        List<QuizQuestion> questions = quiz.getQuestions();
        int totalQuestions = questions.size();
        int score = 0;
        List<Map<String, Object>> questionFeedback = new ArrayList<>();

        for (QuizQuestion q : questions) {
            String studentChoice = submittedAnswers.getOrDefault(q.getId(), "").trim().toUpperCase();
            String correct = q.getCorrectOption() != null ? q.getCorrectOption().trim().toUpperCase() : "";
            boolean isCorrect = !studentChoice.isEmpty() && studentChoice.equals(correct);

            if (isCorrect) {
                score++;
            }

            Map<String, Object> fb = new HashMap<>();
            fb.put("questionId", q.getId());
            fb.put("questionText", q.getQuestionText());
            fb.put("studentChoice", studentChoice);
            fb.put("correctOption", correct);
            fb.put("isCorrect", isCorrect);
            fb.put("explanation", q.getExplanation());
            questionFeedback.add(fb);
        }

        int percentage = totalQuestions > 0 ? (int) Math.round(((double) score / totalQuestions) * 100.0) : 0;
        boolean passed = percentage >= quiz.getPassingScore();

        String attemptId = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO quiz_attempts (id, quiz_id, student_id, course_id, score, total_questions, percentage, passed, answers_json, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """;

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, attemptId);
            pstmt.setString(2, quizId);
            pstmt.setString(3, studentId);
            pstmt.setString(4, courseId != null ? courseId : quiz.getCourseId());
            pstmt.setInt(5, score);
            pstmt.setInt(6, totalQuestions);
            pstmt.setInt(7, percentage);
            pstmt.setInt(8, passed ? 1 : 0);
            pstmt.setString(9, GSON.toJson(submittedAnswers));
            pstmt.executeUpdate();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("attemptId", attemptId);
        result.put("quizId", quizId);
        result.put("quizTitle", quiz.getTitle());
        result.put("score", score);
        result.put("totalQuestions", totalQuestions);
        result.put("percentage", percentage);
        result.put("passingScore", quiz.getPassingScore());
        result.put("passed", passed);
        result.put("status", passed ? "Passed" : "Failed");
        result.put("feedback", questionFeedback);

        return result;
    }

    public QuizAttempt getLatestAttempt(String studentId, String quizId) throws SQLException {
        String sql = "SELECT * FROM quiz_attempts WHERE student_id = ? AND quiz_id = ? ORDER BY completed_at DESC LIMIT 1";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, quizId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    QuizAttempt a = new QuizAttempt();
                    a.setId(rs.getString("id"));
                    a.setQuizId(rs.getString("quiz_id"));
                    a.setStudentId(rs.getString("student_id"));
                    a.setCourseId(rs.getString("course_id"));
                    a.setScore(rs.getInt("score"));
                    a.setTotalQuestions(rs.getInt("total_questions"));
                    a.setPercentage(rs.getInt("percentage"));
                    a.setPassed(rs.getInt("passed") == 1);
                    a.setCompletedAt(rs.getString("completed_at"));
                    return a;
                }
            }
        }
        return null;
    }

    public int countPassedQuizzes(String studentId, String courseId) throws SQLException {
        String sql = "SELECT COUNT(DISTINCT quiz_id) FROM quiz_attempts WHERE student_id = ? AND course_id = ? AND passed = 1";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            pstmt.setString(2, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    public int countTotalQuizzes(String courseId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM quizzes WHERE course_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, courseId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    public List<Map<String, Object>> getAttemptsByStudent(String studentId) throws SQLException {
        String sql = """
            SELECT qa.*, q.title as quiz_title, c.title as course_title
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN courses c ON qa.course_id = c.id
            WHERE qa.student_id = ?
            ORDER BY qa.completed_at DESC
        """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, studentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getString("id"));
                    map.put("quizId", rs.getString("quiz_id"));
                    map.put("quizTitle", rs.getString("quiz_title"));
                    map.put("courseId", rs.getString("course_id"));
                    map.put("courseTitle", rs.getString("course_title"));
                    map.put("score", rs.getInt("score"));
                    map.put("totalQuestions", rs.getInt("total_questions"));
                    map.put("percentage", rs.getInt("percentage"));
                    map.put("passed", rs.getInt("passed") == 1);
                    map.put("completedAt", rs.getString("completed_at"));
                    list.add(map);
                }
            }
        }
        return list;
    }

    private Quiz mapQuiz(ResultSet rs) throws SQLException {
        Quiz q = new Quiz();
        q.setId(rs.getString("id"));
        q.setCourseId(rs.getString("course_id"));
        q.setModuleId(rs.getString("module_id"));
        q.setTitle(rs.getString("title"));
        q.setDescription(rs.getString("description"));
        q.setPassingScore(rs.getInt("passing_score"));
        q.setOrderNum(rs.getInt("order_num"));
        q.setCreatedAt(rs.getString("created_at"));
        return q;
    }
}
