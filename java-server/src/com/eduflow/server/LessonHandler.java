package com.eduflow.server;

import com.eduflow.dao.LessonDAO;
import com.eduflow.model.Lesson;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

public class LessonHandler implements HttpHandler {
    private final LessonDAO lessonDAO = new LessonDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            if ("/api/lessons".equals(path) || "/api/lessons/".equals(path)) {
                if ("POST".equals(method)) {
                    String token = ResponseUtil.getAuthToken(exchange);
                    if (JwtUtil.verifyToken(token) == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }

                    String body = ResponseUtil.readRequestBody(exchange);
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                    String moduleId = json.has("moduleId") ? json.get("moduleId").getAsString() : (json.has("module") ? json.get("module").getAsString() : null);
                    String courseId = json.has("courseId") ? json.get("courseId").getAsString() : (json.has("course") ? json.get("course").getAsString() : null);
                    String title = json.has("title") ? json.get("title").getAsString() : null;
                    String desc = json.has("description") ? json.get("description").getAsString() : "";
                    String videoUrl = json.has("videoUrl") ? json.get("videoUrl").getAsString() : "";
                    String content = json.has("content") ? json.get("content").getAsString() : "";
                    int duration = json.has("duration") ? json.get("duration").getAsInt() : 10;
                    int order = json.has("order") ? json.get("order").getAsInt() : 1;
                    boolean isPreview = json.has("isPreview") && json.get("isPreview").getAsBoolean();

                    if (moduleId == null || title == null) {
                        ResponseUtil.sendError(exchange, 400, "moduleId and title are required", "MISSING_FIELDS");
                        return;
                    }

                    Lesson created = lessonDAO.createLesson(moduleId, courseId, title, desc, videoUrl, content, duration, order, isPreview);
                    ResponseUtil.sendSuccess(exchange, 201, created, "Lesson created successfully");
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if (path.startsWith("/api/lessons/")) {
                String id = path.substring("/api/lessons/".length());
                if ("GET".equals(method)) {
                    Lesson l = lessonDAO.findById(id);
                    if (l == null) {
                        ResponseUtil.sendError(exchange, 404, "Lesson not found", "LESSON_NOT_FOUND");
                        return;
                    }
                    ResponseUtil.sendSuccess(exchange, 200, l, null);
                } else if ("PUT".equals(method)) {
                    String token = ResponseUtil.getAuthToken(exchange);
                    if (JwtUtil.verifyToken(token) == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }

                    String body = ResponseUtil.readRequestBody(exchange);
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                    String title = json.has("title") ? json.get("title").getAsString() : null;
                    String desc = json.has("description") ? json.get("description").getAsString() : "";
                    String videoUrl = json.has("videoUrl") ? json.get("videoUrl").getAsString() : "";
                    String content = json.has("content") ? json.get("content").getAsString() : "";
                    int duration = json.has("duration") ? json.get("duration").getAsInt() : 10;
                    boolean isPreview = json.has("isPreview") && json.get("isPreview").getAsBoolean();

                    lessonDAO.updateLesson(id, title, desc, videoUrl, content, duration, isPreview);
                    Lesson updated = lessonDAO.findById(id);
                    ResponseUtil.sendSuccess(exchange, 200, updated, "Lesson updated successfully");
                } else if ("DELETE".equals(method)) {
                    String token = ResponseUtil.getAuthToken(exchange);
                    if (JwtUtil.verifyToken(token) == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }

                    lessonDAO.deleteLesson(id);
                    ResponseUtil.sendSuccess(exchange, 200, null, "Lesson deleted successfully");
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
