package com.eduflow.server;

import com.eduflow.dao.AbuseReportDAO;
import com.eduflow.model.AbuseReport;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;

public class ReportHandler implements HttpHandler {
    private final AbuseReportDAO reportDAO = new AbuseReportDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            // Verify Admin Authentication
            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            if (claims == null) {
                ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                return;
            }

            String role = claims.has("role") ? claims.get("role").getAsString() : "";
            if (!"admin".equalsIgnoreCase(role)) {
                ResponseUtil.sendError(exchange, 403, "Administrator access required", "FORBIDDEN");
                return;
            }

            if ("/api/admin/reports".equals(path) || "/api/admin/reports/".equals(path)) {
                if ("GET".equals(method)) {
                    List<AbuseReport> reports = reportDAO.getAllReports();
                    ResponseUtil.sendSuccess(exchange, 200, reports, null);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if (path.matches("^/api/admin/reports/[^/]+/deactivate$") && "POST".equals(method)) {
                // POST /api/admin/reports/:id/deactivate
                String[] parts = path.split("/");
                String reportId = parts[4];

                String body = ResponseUtil.readRequestBody(exchange);
                String adminNotes = "Account suspended due to confirmed abusive comments / guideline violation.";
                if (body != null && !body.trim().isEmpty()) {
                    try {
                        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
                        if (json != null && json.has("adminNotes")) {
                            adminNotes = json.get("adminNotes").getAsString();
                        }
                    } catch (Exception ignored) {}
                }

                boolean success = reportDAO.deactivateStudentByReport(reportId, adminNotes);
                if (success) {
                    ResponseUtil.sendSuccess(exchange, 200, null, "Reported user account deactivated and report marked as resolved");
                } else {
                    ResponseUtil.sendError(exchange, 404, "Report not found or action failed", "NOT_FOUND");
                }
            } else if (path.matches("^/api/admin/reports/[^/]+/dismiss$") && "POST".equals(method)) {
                // POST /api/admin/reports/:id/dismiss
                String[] parts = path.split("/");
                String reportId = parts[4];

                String body = ResponseUtil.readRequestBody(exchange);
                String adminNotes = "Report reviewed and dismissed.";
                if (body != null && !body.trim().isEmpty()) {
                    try {
                        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
                        if (json != null && json.has("adminNotes")) {
                            adminNotes = json.get("adminNotes").getAsString();
                        }
                    } catch (Exception ignored) {}
                }

                boolean success = reportDAO.resolveReport(reportId, "dismissed", adminNotes);
                if (success) {
                    ResponseUtil.sendSuccess(exchange, 200, null, "Report marked as dismissed");
                } else {
                    ResponseUtil.sendError(exchange, 404, "Report not found", "NOT_FOUND");
                }
            } else if (path.matches("^/api/admin/reports/[^/]+/resolve$") && "POST".equals(method)) {
                // POST /api/admin/reports/:id/resolve
                String[] parts = path.split("/");
                String reportId = parts[4];

                boolean success = reportDAO.resolveReport(reportId, "resolved", "Resolved by administrator");
                if (success) {
                    ResponseUtil.sendSuccess(exchange, 200, null, "Report marked as resolved");
                } else {
                    ResponseUtil.sendError(exchange, 404, "Report not found", "NOT_FOUND");
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
