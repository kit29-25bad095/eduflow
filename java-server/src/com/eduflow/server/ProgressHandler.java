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

public class ProgressHandler implements HttpHandler {
    private final ProgressDAO progressDAO = new ProgressDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();

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
                    notificationDAO.createNotification(userId, "COMPLETION", "🎉 Course Completed!",
                            "Congratulations! You have completed all lessons in this course.");
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
