package com.eduflow.server;

import com.eduflow.dao.CertificateDAO;
import com.eduflow.dao.CourseDAO;
import com.eduflow.dao.NotificationDAO;
import com.eduflow.dao.ProgressDAO;
import com.eduflow.dao.QuizDAO;
import com.eduflow.dao.UserDAO;
import com.eduflow.model.Certificate;
import com.eduflow.model.Course;
import com.eduflow.model.Quiz;
import com.eduflow.model.User;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class QuizHandler implements HttpHandler {
    private final QuizDAO quizDAO = new QuizDAO();
    private final ProgressDAO progressDAO = new ProgressDAO();
    private final CertificateDAO certificateDAO = new CertificateDAO();
    private final CourseDAO courseDAO = new CourseDAO();
    private final UserDAO userDAO = new UserDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            String userId = claims != null ? claims.get("id").getAsString() : null;

            // GET /api/quizzes/course/:courseId
            if (path.startsWith("/api/quizzes/course/") && "GET".equals(method)) {
                String courseId = path.substring("/api/quizzes/course/".length()).trim();
                List<Quiz> list = quizDAO.getQuizzesByCourse(courseId, userId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            }
            // POST /api/quizzes/:id/submit
            else if (path.startsWith("/api/quizzes/") && path.endsWith("/submit") && "POST".equals(method)) {
                if (userId == null) {
                    ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                    return;
                }

                String sub = path.substring("/api/quizzes/".length());
                String quizId = sub.substring(0, sub.indexOf("/submit"));

                String body = ResponseUtil.readRequestBody(exchange);
                JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                String courseId = json != null && json.has("courseId") ? json.get("courseId").getAsString() : null;
                Map<String, String> answers = new HashMap<>();

                if (json != null && json.has("answers")) {
                    JsonObject ansObj = json.getAsJsonObject("answers");
                    for (Map.Entry<String, JsonElement> entry : ansObj.entrySet()) {
                        answers.put(entry.getKey(), entry.getValue().getAsString());
                    }
                }

                Map<String, Object> quizResult = quizDAO.submitQuizAttempt(userId, courseId, quizId, answers);

                // Update course composite progress
                if (courseId != null) {
                    Map<String, Object> prog = progressDAO.calculateAndUpdateCourseProgress(userId, courseId);
                    quizResult.put("courseProgress", prog.get("progress"));
                    quizResult.put("courseCompleted", prog.get("isCompleted"));

                    // Check if course completed and trigger certificate
                    if (Boolean.TRUE.equals(prog.get("isCompleted"))) {
                        try {
                            Certificate cert = certificateDAO.findByStudentAndCourse(userId, courseId);
                            if (cert == null) {
                                User u = userDAO.findById(userId);
                                Course c = courseDAO.findByIdOrSlug(courseId);
                                String sName = u != null ? u.getName() : "Student";
                                String cTitle = c != null ? c.getTitle() : "Course";
                                cert = certificateDAO.createCertificate(userId, courseId, cTitle, sName);
                                notificationDAO.createNotification(userId, "COMPLETION", "🎉 Course Completed!",
                                        "Congratulations! You have completed all lessons, assignments, and quizzes for " + cTitle + ". Your certificate is now available in your profile.");
                            }
                            quizResult.put("certificate", cert);
                        } catch (Exception ex) {
                            System.err.println("Cert error on quiz complete: " + ex.getMessage());
                        }
                    }
                }

                // Send quiz notification
                notificationDAO.createNotification(userId, "ASSESSMENT", "Quiz Results: " + quizResult.get("quizTitle"),
                        "You scored " + quizResult.get("score") + "/" + quizResult.get("totalQuestions") + " (" + quizResult.get("percentage") + "%). Status: " + quizResult.get("status"));

                ResponseUtil.sendSuccess(exchange, 200, quizResult, "Quiz attempt processed successfully");
            }
            // GET /api/quizzes/:id
            else if (path.startsWith("/api/quizzes/") && "GET".equals(method)) {
                String quizId = path.substring("/api/quizzes/".length()).trim();
                Quiz quiz = quizDAO.getQuizById(quizId, false);
                if (quiz == null) {
                    ResponseUtil.sendError(exchange, 404, "Quiz not found", "NOT_FOUND");
                    return;
                }
                ResponseUtil.sendSuccess(exchange, 200, quiz, null);
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
