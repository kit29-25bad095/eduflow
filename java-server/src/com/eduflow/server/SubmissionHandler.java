package com.eduflow.server;

import com.eduflow.dao.AssignmentDAO;
import com.eduflow.dao.NotificationDAO;
import com.eduflow.dao.SubmissionDAO;
import com.eduflow.model.Assignment;
import com.eduflow.model.Submission;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;

public class SubmissionHandler implements HttpHandler {
    private final SubmissionDAO submissionDAO = new SubmissionDAO();
    private final AssignmentDAO assignmentDAO = new AssignmentDAO();
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

            if ("/api/submissions".equals(path) || "/api/submissions/".equals(path)) {
                if ("POST".equals(method)) {
                    String body = ResponseUtil.readRequestBody(exchange);
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                    String assignmentId = json.has("assignmentId") ? json.get("assignmentId").getAsString() : (json.has("assignment") ? json.get("assignment").getAsString() : null);
                    String fileUrl = json.has("fileUrl") ? json.get("fileUrl").getAsString() : "https://example.com/uploads/submission.pdf";
                    String fileName = json.has("fileName") ? json.get("fileName").getAsString() : "submission.pdf";

                    if (assignmentId == null) {
                        ResponseUtil.sendError(exchange, 400, "assignmentId is required", "MISSING_FIELDS");
                        return;
                    }

                    Assignment assign = assignmentDAO.findById(assignmentId);
                    if (assign == null) {
                        ResponseUtil.sendError(exchange, 404, "Assignment not found", "ASSIGNMENT_NOT_FOUND");
                        return;
                    }

                    Submission sub = submissionDAO.submitAssignment(assignmentId, userId, assign.getCourseId(), fileUrl, fileName);

                    // Notify instructor
                    notificationDAO.createNotification(assign.getCreatedBy(), "NEW_SUBMISSION", "New Assignment Submission",
                            "A student has submitted work for " + assign.getTitle());

                    ResponseUtil.sendSuccess(exchange, 201, sub, "Assignment submitted successfully");
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if ("/api/submissions/my-submissions".equals(path) && "GET".equals(method)) {
                List<Submission> list = submissionDAO.getSubmissionsForStudent(userId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            } else if ("/api/submissions/instructor".equals(path) && "GET".equals(method)) {
                List<Submission> list = submissionDAO.getSubmissionsByInstructor(userId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            } else if (path.startsWith("/api/submissions/assignment/") && "GET".equals(method)) {
                String assignmentId = path.substring("/api/submissions/assignment/".length());
                List<Submission> list = submissionDAO.getSubmissionsForAssignment(assignmentId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            } else if (path.startsWith("/api/submissions/") && path.endsWith("/grade") && "PATCH".equals(method)) {
                String sub = path.substring("/api/submissions/".length());
                String submissionId = sub.substring(0, sub.indexOf("/grade"));

                String body = ResponseUtil.readRequestBody(exchange);
                JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                double marks = json.has("marks") ? json.get("marks").getAsDouble() : 0.0;
                String feedback = json.has("feedback") ? json.get("feedback").getAsString() : "";

                Submission graded = submissionDAO.gradeSubmission(submissionId, marks, feedback, userId);
                if (graded != null) {
                    notificationDAO.createNotification(graded.getStudentId(), "submission_graded", "Assignment Graded: " + marks + " marks",
                            "Your instructor has evaluated your deliverable. Feedback: " + feedback);
                }

                ResponseUtil.sendSuccess(exchange, 200, graded, "Submission graded successfully");
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
