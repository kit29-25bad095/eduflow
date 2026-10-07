package com.eduflow.server;

import com.eduflow.dao.ModuleDAO;
import com.eduflow.model.Module;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

public class ModuleHandler implements HttpHandler {
    private final ModuleDAO moduleDAO = new ModuleDAO();

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

            if ("/api/modules".equals(path) || "/api/modules/".equals(path)) {
                if ("POST".equals(method)) {
                    String body = ResponseUtil.readRequestBody(exchange);
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                    String courseId = json.has("courseId") ? json.get("courseId").getAsString() : (json.has("course") ? json.get("course").getAsString() : null);
                    String title = json.has("title") ? json.get("title").getAsString() : null;
                    String desc = json.has("description") ? json.get("description").getAsString() : "";
                    int order = json.has("order") ? json.get("order").getAsInt() : 1;

                    if (courseId == null || title == null) {
                        ResponseUtil.sendError(exchange, 400, "courseId and title are required", "MISSING_FIELDS");
                        return;
                    }

                    Module created = moduleDAO.createModule(courseId, title, desc, order);
                    ResponseUtil.sendSuccess(exchange, 201, created, "Module created successfully");
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if (path.startsWith("/api/modules/")) {
                String id = path.substring("/api/modules/".length());
                if ("PUT".equals(method)) {
                    String body = ResponseUtil.readRequestBody(exchange);
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                    String title = json.has("title") ? json.get("title").getAsString() : null;
                    String desc = json.has("description") ? json.get("description").getAsString() : "";
                    int order = json.has("order") ? json.get("order").getAsInt() : 1;

                    moduleDAO.updateModule(id, title, desc, order);
                    Module updated = moduleDAO.findById(id);
                    ResponseUtil.sendSuccess(exchange, 200, updated, "Module updated successfully");
                } else if ("DELETE".equals(method)) {
                    moduleDAO.deleteModule(id);
                    ResponseUtil.sendSuccess(exchange, 200, null, "Module deleted successfully");
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
