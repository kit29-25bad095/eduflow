package com.eduflow.server;

import com.eduflow.dao.UserDAO;
import com.eduflow.model.User;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UserHandler implements HttpHandler {
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

            String currentUserId = claims.get("id").getAsString();
            String role = claims.get("role").getAsString();

            if (!"admin".equalsIgnoreCase(role)) {
                ResponseUtil.sendError(exchange, 403, "Admin authorization required", "FORBIDDEN");
                return;
            }

            if ("/api/users".equals(path) || "/api/users/".equals(path)) {
                if ("GET".equals(method)) {
                    handleListUsers(exchange);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if (path.startsWith("/api/users/")) {
                String sub = path.substring("/api/users/".length());
                if (sub.endsWith("/status") && "PATCH".equals(method)) {
                    String targetId = sub.substring(0, sub.indexOf("/status"));
                    handleToggleStatus(exchange, targetId, currentUserId);
                } else if ("GET".equals(method)) {
                    User u = userDAO.findById(sub);
                    if (u == null) {
                        ResponseUtil.sendError(exchange, 404, "User not found", "USER_NOT_FOUND");
                        return;
                    }
                    ResponseUtil.sendSuccess(exchange, 200, u, null);
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

    private void handleListUsers(HttpExchange exchange) throws IOException, SQLException {
        Map<String, String> query = ResponseUtil.parseQueryParams(exchange);
        String filterRole = query.get("role");
        String search = query.get("search");
        int page = 1;
        int limit = 10;

        try {
            if (query.containsKey("page")) page = Integer.parseInt(query.get("page"));
            if (query.containsKey("limit")) limit = Integer.parseInt(query.get("limit"));
        } catch (NumberFormatException ignored) {}

        List<User> users = userDAO.listUsers(filterRole, search, page, limit);
        int total = userDAO.countUsers(filterRole, search);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", total);
        pagination.put("totalPages", (int) Math.ceil((double) total / limit));

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("data", users);
        resp.put("pagination", pagination);

        ResponseUtil.sendJson(exchange, 200, resp);
    }

    private void handleToggleStatus(HttpExchange exchange, String targetUserId, String currentAdminId) throws IOException, SQLException {
        if (targetUserId.equals(currentAdminId)) {
            ResponseUtil.sendError(exchange, 400, "Admin cannot deactivate their own account", "SELF_DEACTIVATION_PREVENTED");
            return;
        }

        userDAO.toggleActiveStatus(targetUserId);
        User updated = userDAO.findById(targetUserId);
        ResponseUtil.sendSuccess(exchange, 200, updated, "User account status updated");
    }
}
