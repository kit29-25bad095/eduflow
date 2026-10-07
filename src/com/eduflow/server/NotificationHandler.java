package com.eduflow.server;

import com.eduflow.dao.NotificationDAO;
import com.eduflow.model.Notification;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;

public class NotificationHandler implements HttpHandler {
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

            if ("/api/notifications".equals(path) || "/api/notifications/".equals(path)) {
                if ("GET".equals(method)) {
                    List<Notification> list = notificationDAO.getNotificationsForUser(userId);
                    int unreadCount = notificationDAO.getUnreadCount(userId);
                    JsonObject result = new JsonObject();
                    result.add("notifications", ResponseUtil.getGson().toJsonTree(list));
                    result.addProperty("unreadCount", unreadCount);
                    ResponseUtil.sendSuccess(exchange, 200, result, null);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if ("/api/notifications/read-all".equals(path) && ("PATCH".equals(method) || "POST".equals(method))) {
                notificationDAO.markAllAsRead(userId);
                ResponseUtil.sendSuccess(exchange, 200, null, "All notifications marked as read");
            } else if (path.startsWith("/api/notifications/") && path.endsWith("/read") && ("PATCH".equals(method) || "POST".equals(method))) {
                String sub = path.substring("/api/notifications/".length());
                String notifId = sub.substring(0, sub.indexOf("/read"));
                notificationDAO.markAsRead(notifId, userId);
                ResponseUtil.sendSuccess(exchange, 200, null, "Notification marked as read");
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
