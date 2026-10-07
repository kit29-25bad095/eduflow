package com.eduflow.server;

import com.eduflow.dao.AnalyticsDAO;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

public class AnalyticsHandler implements HttpHandler {
    private final AnalyticsDAO analyticsDAO = new AnalyticsDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            if (!"GET".equals(method)) {
                ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                return;
            }

            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            if (claims == null) {
                ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                return;
            }

            String userId = claims.get("id").getAsString();
            String role = claims.get("role").getAsString();

            if ("/api/analytics/student".equals(path)) {
                Map<String, Object> data = analyticsDAO.getStudentAnalytics(userId);
                ResponseUtil.sendSuccess(exchange, 200, data, null);
            } else if ("/api/analytics/instructor".equals(path)) {
                if (!"instructor".equalsIgnoreCase(role) && !"admin".equalsIgnoreCase(role)) {
                    ResponseUtil.sendError(exchange, 403, "Forbidden", "FORBIDDEN");
                    return;
                }
                Map<String, Object> data = analyticsDAO.getInstructorAnalytics(userId);
                ResponseUtil.sendSuccess(exchange, 200, data, null);
            } else if ("/api/analytics/admin".equals(path)) {
                if (!"admin".equalsIgnoreCase(role)) {
                    ResponseUtil.sendError(exchange, 403, "Admin authorization required", "FORBIDDEN");
                    return;
                }
                Map<String, Object> data = analyticsDAO.getAdminAnalytics();
                ResponseUtil.sendSuccess(exchange, 200, data, null);
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
