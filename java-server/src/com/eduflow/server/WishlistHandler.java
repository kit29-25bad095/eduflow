package com.eduflow.server;

import com.eduflow.dao.WishlistDAO;
import com.eduflow.model.Course;
import com.eduflow.util.JwtUtil;
import com.eduflow.util.ResponseUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class WishlistHandler implements HttpHandler {
    private final WishlistDAO wishlistDAO = new WishlistDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            String token = ResponseUtil.getAuthToken(exchange);
            JsonObject claims = JwtUtil.verifyToken(token);
            if (claims == null) {
                ResponseUtil.sendError(exchange, 401, "Unauthorized: Please log in to manage your wishlist", "UNAUTHORIZED");
                return;
            }

            String studentId = claims.get("id").getAsString();

            // GET /api/wishlist
            if ("/api/wishlist".equals(path) && "GET".equals(method)) {
                List<Course> list = wishlistDAO.getWishlistCourses(studentId);
                ResponseUtil.sendSuccess(exchange, 200, list, "Wishlist retrieved");
            }
            // GET /api/wishlist/ids
            else if ("/api/wishlist/ids".equals(path) && "GET".equals(method)) {
                Set<String> ids = wishlistDAO.getWishlistCourseIds(studentId);
                ResponseUtil.sendSuccess(exchange, 200, ids, "Wishlist course IDs");
            }
            // POST /api/wishlist/toggle/:courseId
            else if (path.startsWith("/api/wishlist/toggle/") && "POST".equals(method)) {
                String courseId = path.substring("/api/wishlist/toggle/".length()).trim();
                boolean isWishlisted = wishlistDAO.toggleWishlist(studentId, courseId);
                Map<String, Object> resp = new HashMap<>();
                resp.put("courseId", courseId);
                resp.put("isWishlisted", isWishlisted);
                ResponseUtil.sendSuccess(exchange, 200, resp, isWishlisted ? "Course added to wishlist" : "Course removed from wishlist");
            }
            // POST /api/wishlist/:courseId
            else if (path.startsWith("/api/wishlist/") && "POST".equals(method)) {
                String courseId = path.substring("/api/wishlist/".length()).trim();
                wishlistDAO.addToWishlist(studentId, courseId);
                Map<String, Object> resp = new HashMap<>();
                resp.put("courseId", courseId);
                resp.put("isWishlisted", true);
                ResponseUtil.sendSuccess(exchange, 200, resp, "Added to wishlist");
            }
            // DELETE /api/wishlist/:courseId
            else if (path.startsWith("/api/wishlist/") && "DELETE".equals(method)) {
                String courseId = path.substring("/api/wishlist/".length()).trim();
                wishlistDAO.removeFromWishlist(studentId, courseId);
                Map<String, Object> resp = new HashMap<>();
                resp.put("courseId", courseId);
                resp.put("isWishlisted", false);
                ResponseUtil.sendSuccess(exchange, 200, resp, "Removed from wishlist");
            } else {
                ResponseUtil.sendError(exchange, 404, "Endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }
}
