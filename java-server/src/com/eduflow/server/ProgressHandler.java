package com.eduflow.server;

import com.eduflow.dao.NotificationDAO;
import com.eduflow.dao.ProgressDAO;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

import com.eduflow.dao.CertificateDAO;
import com.eduflow.dao.CourseDAO;
import com.eduflow.dao.UserDAO;
import com.eduflow.model.Certificate;
import com.eduflow.model.Course;
import com.eduflow.model.User;

public class ProgressHandler implements HttpHandler {
    private final ProgressDAO progressDAO = new ProgressDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();
    private final CertificateDAO certificateDAO = new CertificateDAO();
    private final CourseDAO courseDAO = new CourseDAO();
    private final UserDAO userDAO = new UserDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            if (claims == null) {
                ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                return;
            }

            String userId = claims.get("id").getAsString();

            // POST /api/progress/lesson/:lessonId/complete
            if (path.startsWith("/api/progress/lesson/") && path.endsWith("/complete") && "POST".equals(method)) {
                String sub = path.substring("/api/progress/lesson/".length());
                String lessonId = sub.substring(0, sub.indexOf("/complete"));

                String body = ResponseUtil.readRequestBody(exchange);
                int timeSpent = 10;
                try {
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
                    if (json != null && json.has("timeSpent")) {
                        timeSpent = json.get("timeSpent").getAsInt();
                    }
                } catch (Exception ignored) {}

                Map<String, Object> progress = progressDAO.completeLesson(userId, lessonId, timeSpent);

                if (Boolean.TRUE.equals(progress.get("isCompleted"))) {
                    String courseId = (String) progress.get("courseId");
                    String courseName = "Course";
                    String studentName = "Student";

                    try {
                        User user = userDAO.findById(userId);
                        if (user != null && user.getName() != null) {
                            studentName = user.getName();
                        }
                        if (courseId != null) {
                            Course course = courseDAO.findByIdOrSlug(courseId);
                            if (course != null && course.getTitle() != null) {
                                courseName = course.getTitle();
                            }
                        }

                        // Auto-generate certificate if not exists
                        Certificate cert = certificateDAO.findByStudentAndCourse(userId, courseId);
                        if (cert == null) {
                            cert = certificateDAO.createCertificate(userId, courseId, courseName, studentName);
                        }
                        progress.put("certificate", cert);

                        // Certificate notification as requested:
                        notificationDAO.createNotification(userId, "COMPLETION", "🎉 Congratulations!",
                                "You have successfully completed " + courseName + ". Your certificate is now available in your profile.");
                    } catch (Exception ex) {
                        System.err.println("Error generating certificate or notification: " + ex.getMessage());
                    }
                }

                ResponseUtil.sendSuccess(exchange, 200, progress, "Lesson marked as complete");
            }
            // GET /api/progress/course/:courseId
            else if (path.startsWith("/api/progress/course/") && "GET".equals(method)) {
                String courseId = path.substring("/api/progress/course/".length());
                Map<String, Object> progress = progressDAO.getCourseProgress(userId, courseId);
                ResponseUtil.sendSuccess(exchange, 200, progress, null);
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
