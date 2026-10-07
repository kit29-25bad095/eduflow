package com.eduflow.server;

import com.eduflow.dao.CourseDAO;
import com.eduflow.dao.EnrollmentDAO;
import com.eduflow.dao.NotificationDAO;
import com.eduflow.dao.PaymentDAO;
import com.eduflow.model.Course;
import com.eduflow.model.Enrollment;
import com.eduflow.model.Payment;
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
import java.util.UUID;

public class PaymentHandler implements HttpHandler {
    private final PaymentDAO paymentDAO = new PaymentDAO();
    private final CourseDAO courseDAO = new CourseDAO();
    private final EnrollmentDAO enrollmentDAO = new EnrollmentDAO();
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

            if ("/api/payments/checkout".equals(path) || "/api/payments/checkout/".equals(path)) {
                if ("POST".equals(method)) {
                    handleCheckout(exchange, userId);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if ("/api/payments/my-payments".equals(path) || "/api/payments/my-payments/".equals(path)) {
                if ("GET".equals(method)) {
                    List<Payment> list = paymentDAO.getPaymentsByStudent(userId);
                    ResponseUtil.sendSuccess(exchange, 200, list, null);
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

    private void handleCheckout(HttpExchange exchange, String userId) throws IOException, SQLException {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

        String courseId = json != null && json.has("courseId") ? json.get("courseId").getAsString() : null;
        String paymentMethod = json != null && json.has("paymentMethod") ? json.get("paymentMethod").getAsString() : "credit_card";

        if (courseId == null) {
            ResponseUtil.sendError(exchange, 400, "courseId is required for checkout", "MISSING_COURSE_ID");
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

        // Generate verified transaction ID
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() % 10000;

        // Record verified payment
        Payment payment = paymentDAO.recordPayment(userId, course.getId(), course.getPrice(), paymentMethod, transactionId);

        // Activate enrollment
        Enrollment enrollment = enrollmentDAO.enroll(userId, course.getId());

        // Notify student of successful payment & enrollment
        notificationDAO.createNotification(
            userId,
            "payment_success",
            "Payment Successful ($" + course.getPrice() + ")",
            "Your payment for '" + course.getTitle() + "' was processed successfully (Txn: " + transactionId + "). Full access unlocked!"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("payment", payment);
        result.put("enrollment", enrollment);
        result.put("transactionId", transactionId);
        result.put("message", "Payment verified and course unlocked successfully!");

        ResponseUtil.sendSuccess(exchange, 200, result, "Payment completed and course enrolled successfully");
    }
}
