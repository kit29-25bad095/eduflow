package com.eduflow.server;

import com.eduflow.dao.EnrollmentDAO;
import com.eduflow.dao.ReviewDAO;
import com.eduflow.model.CourseReview;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;

public class ReviewHandler implements HttpHandler {
    private final ReviewDAO reviewDAO = new ReviewDAO();
    private final EnrollmentDAO enrollmentDAO = new EnrollmentDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            if ("/api/reviews".equals(path) || "/api/reviews/".equals(path)) {
                if ("POST".equals(method)) {
                    String token = ResponseUtil.getAuthToken(exchange);
                    JsonObject claims = JwtUtil.verifyToken(token);
                    if (claims == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }

                    String userId = claims.get("id").getAsString();
                    String body = ResponseUtil.readRequestBody(exchange);
                    JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

                    String courseId = json.has("courseId") ? json.get("courseId").getAsString() : (json.has("course") ? json.get("course").getAsString() : null);
                    int rating = json.has("rating") ? json.get("rating").getAsInt() : 5;
                    String comment = json.has("comment") ? json.get("comment").getAsString() : "";

                    if (courseId == null) {
                        ResponseUtil.sendError(exchange, 400, "courseId is required", "MISSING_FIELDS");
                        return;
                    }

                    if (!enrollmentDAO.isEnrolled(userId, courseId)) {
                        ResponseUtil.sendError(exchange, 403, "You can only review courses you are enrolled in", "REVIEW_NOT_PERMITTED");
                        return;
                    }

                    CourseReview review = reviewDAO.addReview(courseId, userId, rating, comment);
                    ResponseUtil.sendSuccess(exchange, 201, review, "Review submitted successfully");
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if ("/api/reviews/instructor".equals(path) || "/api/reviews/instructor/".equals(path)) {
                if ("GET".equals(method)) {
                    String token = ResponseUtil.getAuthToken(exchange);
                    JsonObject claims = JwtUtil.verifyToken(token);
                    if (claims == null) {
                        ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                        return;
                    }
                    String userId = claims.get("id").getAsString();
                    List<CourseReview> list = reviewDAO.getReviewsForInstructor(userId);
                    ResponseUtil.sendSuccess(exchange, 200, list, null);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if (path.startsWith("/api/reviews/course/")) {
                String courseId = path.substring("/api/reviews/course/".length());
                List<CourseReview> list = reviewDAO.getReviewsForCourse(courseId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
