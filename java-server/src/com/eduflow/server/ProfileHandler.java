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
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

public class ProfileHandler implements HttpHandler {
    private final UserDAO userDAO = new UserDAO();
    private final EnrollmentDAO enrollmentDAO = new EnrollmentDAO();
    private final CertificateDAO certificateDAO = new CertificateDAO();
    private final CourseDAO courseDAO = new CourseDAO();
    private final com.eduflow.dao.WishlistDAO wishlistDAO = new com.eduflow.dao.WishlistDAO();
    private final com.eduflow.dao.QuizDAO quizDAO = new com.eduflow.dao.QuizDAO();

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

            // GET /api/profile/me or GET /api/profile
            if (("GET".equals(method) && ("/api/profile/me".equals(path) || "/api/profile".equals(path)))) {
                handleGetProfile(exchange, userId);
            }
            // POST /api/profile/onboarding
            else if ("POST".equals(method) && "/api/profile/onboarding".equals(path)) {
                handleOnboarding(exchange, userId);
            }
            // PUT /api/profile or PUT /api/profile/me
            else if ("PUT".equals(method) && ("/api/profile".equals(path) || "/api/profile/me".equals(path))) {
                handleUpdateProfile(exchange, userId);
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }

    private void handleGetProfile(HttpExchange exchange, String userId) throws Exception {
        User user = userDAO.findById(userId);
        if (user == null) {
            ResponseUtil.sendError(exchange, 404, "User not found", "USER_NOT_FOUND");
            return;
        }

        // 1. Enrolled courses with real progress
        List<Enrollment> enrollments = enrollmentDAO.getMyEnrolledCourses(userId);

        // 2. Real generated certificates
        List<Certificate> certificates = certificateDAO.getCertificatesByStudent(userId);

        // 3. Recommended courses matching user interests & skills
        List<Course> allCourses = courseDAO.listCourses(null, null, null, "popular", 1, 30, "published");
        Set<String> enrolledCourseIds = enrollments.stream().map(Enrollment::getCourseId).collect(Collectors.toSet());

        List<Course> recommended = getRecommendedCourses(user, allCourses, enrolledCourseIds);

        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("enrolledCourses", enrollments);
        data.put("certificates", certificates);
        data.put("recommendedCourses", recommended);
        data.put("wishlist", wishlistDAO.getWishlistCourses(userId));
        data.put("quizAttempts", quizDAO.getAttemptsByStudent(userId));

        ResponseUtil.sendSuccess(exchange, 200, data, "Learner profile loaded successfully");
    }

    private List<Course> getRecommendedCourses(User user, List<Course> allCourses, Set<String> enrolledCourseIds) {
        String interests = user.getCourseInterests() != null ? user.getCourseInterests().toLowerCase() : "";
        String skills = user.getSkills() != null ? user.getSkills().toLowerCase() : "";

        List<String> keywords = new ArrayList<>();
        if (!interests.isEmpty()) {
            for (String kw : interests.split(",")) {
                String t = kw.trim();
                if (!t.isEmpty()) keywords.add(t);
            }
        }
        if (!skills.isEmpty()) {
            for (String kw : skills.split(",")) {
                String t = kw.trim();
                if (!t.isEmpty()) keywords.add(t);
            }
        }

        List<Course> scored = new ArrayList<>();
        for (Course c : allCourses) {
            if (enrolledCourseIds.contains(c.getId())) continue;

            String cText = ((c.getTitle() != null ? c.getTitle() : "") + " "
                    + (c.getCategory() != null ? c.getCategory() : "") + " "
                    + (c.getDescription() != null ? c.getDescription() : "") + " "
                    + (c.getShortDescription() != null ? c.getShortDescription() : "")).toLowerCase();

            boolean matched = false;
            for (String kw : keywords) {
                if (cText.contains(kw)) {
                    matched = true;
                    break;
                }
            }

            if (matched || keywords.isEmpty()) {
                scored.add(c);
            }
        }

        // If no match found or few matched, fallback to popular un-enrolled courses
        if (scored.size() < 4) {
            for (Course c : allCourses) {
                if (!enrolledCourseIds.contains(c.getId()) && !scored.contains(c)) {
                    scored.add(c);
                }
                if (scored.size() >= 6) break;
            }
        }

        return scored.stream().limit(6).collect(Collectors.toList());
    }

    private void handleOnboarding(HttpExchange exchange, String userId) throws Exception {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

        String degree = json.has("degree") ? json.get("degree").getAsString() : "";
        String specialization = json.has("specialization") ? json.get("specialization").getAsString() : "";
        String institution = json.has("institution") ? json.get("institution").getAsString() : "";

        String skills = extractListOrString(json, "skills");
        String courseInterests = extractListOrString(json, "courseInterests");
        String learningGoals = extractListOrString(json, "learningGoals");

        userDAO.updateOnboarding(userId, degree, specialization, institution, skills, courseInterests, learningGoals);

        User updated = userDAO.findById(userId);
        ResponseUtil.sendSuccess(exchange, 200, updated, "Profile completed successfully!");
    }

    private void handleUpdateProfile(HttpExchange exchange, String userId) throws Exception {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

        String name = json.has("name") ? json.get("name").getAsString() : null;
        String degree = json.has("degree") ? json.get("degree").getAsString() : null;
        String specialization = json.has("specialization") ? json.get("specialization").getAsString() : null;
        String institution = json.has("institution") ? json.get("institution").getAsString() : null;
        String profileImage = json.has("profileImage") ? json.get("profileImage").getAsString() : null;

        String skills = json.has("skills") ? extractListOrString(json, "skills") : null;
        String courseInterests = json.has("courseInterests") ? extractListOrString(json, "courseInterests") : null;
        String learningGoals = json.has("learningGoals") ? extractListOrString(json, "learningGoals") : null;

        userDAO.updateLearnerProfile(userId, name, degree, specialization, institution, skills, courseInterests, learningGoals, profileImage);

        User updated = userDAO.findById(userId);
        ResponseUtil.sendSuccess(exchange, 200, updated, "Learner profile updated successfully");
    }

    private String extractListOrString(JsonObject json, String key) {
        if (!json.has(key)) return "";
        JsonElement elem = json.get(key);
        if (elem.isJsonArray()) {
            JsonArray arr = elem.getAsJsonArray();
            List<String> list = new ArrayList<>();
            for (JsonElement item : arr) {
                list.add(item.getAsString().trim());
            }
            return String.join(",", list);
        } else if (elem.isJsonPrimitive()) {
            return elem.getAsString().trim();
        }
        return "";
    }
}
