package com.eduflow.server;

import com.eduflow.dao.AssignmentDAO;
import com.eduflow.model.Assignment;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;

public class AssignmentHandler implements HttpHandler {
    private final AssignmentDAO assignmentDAO = new AssignmentDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            String userId = claims != null ? claims.get("id").getAsString() : null;

            if ("/api/assignments".equals(path) || "/api/assignments/".equals(path)) {
                if ("POST".equals(method)) {
                    if (claims == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }

                    String body = ResponseUtil.readRequestBody(exchange);
                    Assignment a = ResponseUtil.getGson().fromJson(body, Assignment.class);
                    a.setCreatedBy(userId);

                    if (a.getCourseId() == null || a.getTitle() == null) {
                        ResponseUtil.sendError(exchange, 400, "courseId and title are required", "MISSING_FIELDS");
                        return;
                    }

                    Assignment created = assignmentDAO.createAssignment(a);
                    ResponseUtil.sendSuccess(exchange, 201, created, "Assignment created successfully");
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if (path.startsWith("/api/assignments/course/")) {
                String courseId = path.substring("/api/assignments/course/".length());
                List<Assignment> list = assignmentDAO.listByCourse(courseId, userId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            } else if (path.startsWith("/api/assignments/")) {
                String id = path.substring("/api/assignments/".length());
                if ("GET".equals(method)) {
                    Assignment a = assignmentDAO.findById(id);
                    if (a == null) {
                        ResponseUtil.sendError(exchange, 404, "Assignment not found", "ASSIGNMENT_NOT_FOUND");
                        return;
                    }
                    ResponseUtil.sendSuccess(exchange, 200, a, null);
                } else if ("PUT".equals(method)) {
                    if (claims == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }
                    String body = ResponseUtil.readRequestBody(exchange);
                    Assignment a = ResponseUtil.getGson().fromJson(body, Assignment.class);
                    a.setId(id);
                    assignmentDAO.updateAssignment(a);
                    Assignment updated = assignmentDAO.findById(id);
                    ResponseUtil.sendSuccess(exchange, 200, updated, "Assignment updated successfully");
                } else if ("DELETE".equals(method)) {
                    if (claims == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }
                    assignmentDAO.deleteAssignment(id);
                    ResponseUtil.sendSuccess(exchange, 200, null, "Assignment deleted successfully");
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
