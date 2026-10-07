package com.eduflow.server;

import com.eduflow.dao.CourseDAO;
import com.eduflow.dao.EnrollmentDAO;
import com.eduflow.dao.NotificationDAO;
import com.eduflow.model.Course;
import com.eduflow.model.Enrollment;
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

public class EnrollmentHandler implements HttpHandler {
    private final EnrollmentDAO enrollmentDAO = new EnrollmentDAO();
    private final CourseDAO courseDAO = new CourseDAO();
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

            if ("/api/enrollments".equals(path) || "/api/enrollments/".equals(path)) {
                if ("POST".equals(method)) {
                    handleEnroll(exchange, userId);
                } else if ("GET".equals(method)) {
                    // Admin get all enrollments
                    List<Enrollment> list = enrollmentDAO.listAllEnrollments(1, 50);
                    ResponseUtil.sendSuccess(exchange, 200, list, null);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if ("/api/enrollments/my-courses".equals(path) && "GET".equals(method)) {
                List<Enrollment> list = enrollmentDAO.getMyEnrolledCourses(userId);
                ResponseUtil.sendSuccess(exchange, 200, list, null);
            } else if (path.startsWith("/api/enrollments/check/")) {
                String courseId = path.substring("/api/enrollments/check/".length());
                boolean isEnrolled = enrollmentDAO.isEnrolled(userId, courseId);
                Map<String, Object> data = new HashMap<>();
                data.put("isEnrolled", isEnrolled);
                ResponseUtil.sendSuccess(exchange, 200, data, null);
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }

    private void handleEnroll(HttpExchange exchange, String userId) throws IOException, SQLException {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

        String courseId = json != null && json.has("courseId") ? json.get("courseId").getAsString() : (json != null && json.has("course") ? json.get("course").getAsString() : null);

        if (courseId == null) {
            ResponseUtil.sendError(exchange, 400, "courseId is required", "MISSING_COURSE_ID");
            return;
        }

        Course course = courseDAO.findByIdOrSlug(courseId);
        if (course == null) {
            ResponseUtil.sendError(exchange, 404, "Course not found", "COURSE_NOT_FOUND");
            return;
        }

        if (enrollmentDAO.isEnrolled(userId, course.getId())) {
            ResponseUtil.sendError(exchange, 400, "You are already enrolled in this course", "ALREADY_ENROLLED");
            return;
        }

        if (course.getPrice() > 0) {
            ResponseUtil.sendError(exchange, 402, "This is a premium course ($" + course.getPrice() + "). Please complete checkout to enroll.", "PAYMENT_REQUIRED");
            return;
        }

        Enrollment enr = enrollmentDAO.enroll(userId, course.getId());

        // Notify user
        notificationDAO.createNotification(userId, "course_enrollment", "Course Enrollment Successful",
                "You have enrolled in " + course.getTitle() + ". Happy learning!");

        ResponseUtil.sendSuccess(exchange, 201, enr, "Enrolled successfully");
    }
}
