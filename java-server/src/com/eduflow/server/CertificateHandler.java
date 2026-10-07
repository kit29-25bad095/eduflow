package com.eduflow.server;

import com.eduflow.dao.CertificateDAO;
import com.eduflow.dao.CourseDAO;
import com.eduflow.dao.EnrollmentDAO;
import com.eduflow.dao.UserDAO;
import com.eduflow.model.Certificate;
import com.eduflow.model.Course;
import com.eduflow.model.Enrollment;
import com.eduflow.model.User;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CertificateHandler implements HttpHandler {
    private final CertificateDAO certificateDAO = new CertificateDAO();
    private final EnrollmentDAO enrollmentDAO = new EnrollmentDAO();
    private final CourseDAO courseDAO = new CourseDAO();
    private final UserDAO userDAO = new UserDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            // Public endpoint: GET /api/certificates/verify/:code
            if (path.startsWith("/api/certificates/verify") && "GET".equals(method)) {
                String code = "";
                if (path.startsWith("/api/certificates/verify/")) {
                    code = path.substring("/api/certificates/verify/".length()).trim();
                } else {
                    // check query param ?code=...
                    String query = exchange.getRequestURI().getQuery();
                    if (query != null && query.contains("code=")) {
                        for (String p : query.split("&")) {
                            if (p.startsWith("code=")) {
                                code = p.substring("code=".length());
                                break;
                            }
                        }
                    }
                }

                if (code.isEmpty()) {
                    ResponseUtil.sendError(exchange, 400, "Verification code is required", "BAD_REQUEST");
                    return;
                }

                Certificate cert = certificateDAO.findByVerificationCode(code);
                if (cert == null) {
                    ResponseUtil.sendError(exchange, 404, "Invalid or unrecognized certificate verification code", "CERTIFICATE_NOT_FOUND");
                    return;
                }

                Map<String, Object> verifyData = new HashMap<>();
                verifyData.put("certificateId", cert.getCertificateId());
                verifyData.put("studentName", cert.getStudentName());
                verifyData.put("courseName", cert.getCourseName());
                verifyData.put("issuedDate", cert.getIssuedDate());
                verifyData.put("verificationCode", cert.getVerificationCode());
                verifyData.put("status", "AUTHENTIC_VERIFIED");
                verifyData.put("issuer", "EduFlow Learning Management System");

                ResponseUtil.sendSuccess(exchange, 200, verifyData, "Certificate successfully verified");
                return;
            }

            // Authenticated endpoints
            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            if (claims == null) {
                ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
                return;
            }

            String userId = claims.get("id").getAsString();

            // GET /api/certificates/my-certificates or GET /api/certificates
            if (("GET".equals(method) && ("/api/certificates/my-certificates".equals(path) || "/api/certificates".equals(path)))) {
                List<Certificate> certs = certificateDAO.getCertificatesByStudent(userId);
                ResponseUtil.sendSuccess(exchange, 200, certs, null);
            }
            // POST /api/certificates/claim/:courseId
            else if ("POST".equals(method) && path.startsWith("/api/certificates/claim/")) {
                String courseId = path.substring("/api/certificates/claim/".length());
                // Verify student enrollment & completion
                List<Enrollment> enrollments = enrollmentDAO.getMyEnrolledCourses(userId);
                Enrollment match = null;
                for (Enrollment enr : enrollments) {
                    if (enr.getCourseId().equals(courseId) || (enr.getCourse() != null && courseId.equals(enr.getCourse().getId()))) {
                        match = enr;
                        break;
                    }
                }

                if (match == null) {
                    ResponseUtil.sendError(exchange, 400, "You are not enrolled in this course", "NOT_ENROLLED");
                    return;
                }

                if (match.getProgress() < 100 && !"completed".equalsIgnoreCase(match.getStatus())) {
                    ResponseUtil.sendError(exchange, 400, "Course is not yet completed (current progress: " + match.getProgress() + "%)", "NOT_COMPLETED");
                    return;
                }

                User user = userDAO.findById(userId);
                Course course = courseDAO.findByIdOrSlug(courseId);
                String courseName = course != null ? course.getTitle() : "Course";
                String studentName = user != null ? user.getName() : "Student";

                Certificate cert = certificateDAO.createCertificate(userId, courseId, courseName, studentName);
                ResponseUtil.sendSuccess(exchange, 200, cert, "Certificate generated successfully");
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
