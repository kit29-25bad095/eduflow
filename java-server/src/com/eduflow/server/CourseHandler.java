package com.eduflow.server;

import com.eduflow.dao.CourseDAO;
import com.eduflow.model.Course;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import com.eduflow.dao.UserDAO;
import com.eduflow.model.User;

import java.io.IOException;
import java.sql.SQLException;
import java.util.*;

public class CourseHandler implements HttpHandler {
    private final CourseDAO courseDAO = new CourseDAO();
    private final UserDAO userDAO = new UserDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            if ("/api/courses".equals(path) || "/api/courses/".equals(path)) {
                if ("GET".equals(method)) {
                    handleListCourses(exchange);
                } else if ("POST".equals(method)) {
                    handleCreateCourse(exchange);
                } else {
                    ResponseUtil.sendError(exchange, 405, "Method not allowed", "METHOD_NOT_ALLOWED");
                }
            } else if ("/api/courses/recommended".equals(path) && "GET".equals(method)) {
                handleRecommendedCourses(exchange);
            } else if ("/api/courses/instructor/my-courses".equals(path) && "GET".equals(method)) {
                handleMyCourses(exchange);
            } else if (path.startsWith("/api/courses/")) {
                String subPath = path.substring("/api/courses/".length());
                if (subPath.contains("/status") && "PATCH".equals(method)) {
                    String id = subPath.replace("/status", "");
                    handleToggleStatus(exchange, id);
                } else if ("GET".equals(method)) {
                    handleGetCourse(exchange, subPath);
                } else if ("PUT".equals(method)) {
                    handleUpdateCourse(exchange, subPath);
                } else if ("DELETE".equals(method)) {
                    handleDeleteCourse(exchange, subPath);
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

    private void handleListCourses(HttpExchange exchange) throws IOException, SQLException {
        Map<String, String> query = ResponseUtil.parseQueryParams(exchange);
        String search = query.get("search");
        String category = query.get("category");
        String level = query.get("level");
        String sort = query.getOrDefault("sort", "newest");
        String status = query.getOrDefault("status", "published");
        int page = 1;
        int limit = 12;

        try {
            if (query.containsKey("page")) page = Integer.parseInt(query.get("page"));
            if (query.containsKey("limit")) limit = Integer.parseInt(query.get("limit"));
        } catch (NumberFormatException ignored) {}

        List<Course> courses = courseDAO.listCourses(search, category, level, sort, page, limit, status);
        int total = courseDAO.countCourses(search, category, level, status);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", total);
        pagination.put("totalPages", (int) Math.ceil((double) total / limit));

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("data", courses);
        resp.put("pagination", pagination);

        ResponseUtil.sendJson(exchange, 200, resp);
    }

    private void handleMyCourses(HttpExchange exchange) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
            return;
        }

        String userId = claims.get("id").getAsString();
        List<Course> courses = courseDAO.listByInstructor(userId);
        ResponseUtil.sendSuccess(exchange, 200, courses, null);
    }

    private void handleGetCourse(HttpExchange exchange, String idOrSlug) throws IOException, SQLException {
        Course course = courseDAO.findByIdOrSlug(idOrSlug);
        if (course == null) {
            ResponseUtil.sendError(exchange, 404, "Course not found", "COURSE_NOT_FOUND");
            return;
        }
        ResponseUtil.sendSuccess(exchange, 200, course, null);
    }

    private void handleCreateCourse(HttpExchange exchange) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
            return;
        }

        String role = claims.get("role").getAsString();
        if (!"instructor".equalsIgnoreCase(role) && !"admin".equalsIgnoreCase(role)) {
            ResponseUtil.sendError(exchange, 403, "Only instructors can create courses", "FORBIDDEN");
            return;
        }

        String instructorId = claims.get("id").getAsString();
        String body = ResponseUtil.readRequestBody(exchange);
        Course course = ResponseUtil.getGson().fromJson(body, Course.class);

        if (course.getTitle() == null || course.getTitle().trim().isEmpty() ||
            course.getDescription() == null || course.getCategory() == null) {
            ResponseUtil.sendError(exchange, 400, "Title, description, and category are required", "MISSING_FIELDS");
            return;
        }

        course.setInstructorId(instructorId);
        if (course.getStatus() == null || course.getStatus().isEmpty()) {
            course.setStatus("published");
        }

        Course created = courseDAO.createCourse(course);
        ResponseUtil.sendSuccess(exchange, 201, created, "Course created successfully");
    }

    private void handleUpdateCourse(HttpExchange exchange, String courseId) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
            return;
        }

        String body = ResponseUtil.readRequestBody(exchange);
        Course course = ResponseUtil.getGson().fromJson(body, Course.class);
        course.setId(courseId);

        courseDAO.updateCourse(course);
        Course updated = courseDAO.findByIdOrSlug(courseId);
        ResponseUtil.sendSuccess(exchange, 200, updated, "Course updated successfully");
    }

    private void handleDeleteCourse(HttpExchange exchange, String courseId) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
            return;
        }

        courseDAO.deleteCourse(courseId);
        ResponseUtil.sendSuccess(exchange, 200, null, "Course deleted successfully");
    }

    private void handleToggleStatus(HttpExchange exchange, String courseId) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized", "UNAUTHORIZED");
            return;
        }

        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
        String newStatus = json != null && json.has("status") ? json.get("status").getAsString() : "published";

        courseDAO.updateStatus(courseId, newStatus);
        ResponseUtil.sendSuccess(exchange, 200, null, "Course status updated to " + newStatus);
    }

    private void handleRecommendedCourses(HttpExchange exchange) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Unauthorized: Please log in to see personalized recommendations", "UNAUTHORIZED");
            return;
        }

        String studentId = claims.get("id").getAsString();
        User user = userDAO.findById(studentId);

        String rawInterests = (user != null && user.getCourseInterests() != null) ? user.getCourseInterests().trim() : "";
        boolean hasInterests = !rawInterests.isEmpty();

        List<String> interestsList = new ArrayList<>();
        if (hasInterests) {
            for (String item : rawInterests.split("[,;]")) {
                String trimmed = item.trim();
                if (!trimmed.isEmpty()) {
                    interestsList.add(trimmed);
                }
            }
        }

        List<Course> recommended = hasInterests
                ? courseDAO.getRecommendedCoursesForStudent(studentId)
                : Collections.emptyList();

        Map<String, Object> data = new HashMap<>();
        data.put("hasInterests", hasInterests);
        data.put("interests", interestsList);
        data.put("courses", recommended);

        ResponseUtil.sendSuccess(exchange, 200, data, "Recommended courses retrieved successfully");
    }
}
