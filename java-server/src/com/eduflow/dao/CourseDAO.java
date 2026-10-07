package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;
import com.eduflow.model.Course;
import com.eduflow.model.Module;
import com.eduflow.model.Lesson;
import com.eduflow.model.User;

import java.sql.*;
import java.util.*;

public class CourseDAO {

    public List<Course> listCourses(String search, String category, String level, String sort, int page, int limit, String status) throws SQLException {
        StringBuilder sql = new StringBuilder("""
            SELECT c.*, u.name as instructor_name, u.profile_image as instructor_image, u.bio as instructor_bio
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (status != null && !status.equalsIgnoreCase("all") && !status.isEmpty()) {
            sql.append(" AND c.status = ?");
            params.add(status);
        } else if (status == null || status.isEmpty()) {
            sql.append(" AND c.status = 'published'");
        }

        if (category != null && !category.equalsIgnoreCase("All") && !category.isEmpty()) {
            sql.append(" AND c.category = ?");
            params.add(category);
        }

        if (level != null && !level.equalsIgnoreCase("All Levels") && !level.isEmpty()) {
            sql.append(" AND c.level = ?");
            params.add(level);
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ? OR c.skills LIKE ?)");
            String wild = "%" + search.trim() + "%";
            params.add(wild);
            params.add(wild);
            params.add(wild);
            params.add(wild);
        }

        // Sorting
        if ("popular".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY c.enrolled_count DESC");
        } else if ("rating".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY c.rating_avg DESC, c.rating_count DESC");
        } else if ("price-asc".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY c.price ASC");
        } else if ("price-desc".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY c.price DESC");
        } else {
            sql.append(" ORDER BY c.created_at DESC");
        }

        sql.append(" LIMIT ? OFFSET ?");
        params.add(limit);
        params.add((page - 1) * limit);

        List<Course> courses = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    courses.add(mapCourseWithInstructor(rs));
                }
            }
        }
        return courses;
    }

    public int countCourses(String search, String category, String level, String status) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM courses WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (status != null && !status.equalsIgnoreCase("all") && !status.isEmpty()) {
            sql.append(" AND status = ?");
            params.add(status);
        } else if (status == null || status.isEmpty()) {
            sql.append(" AND status = 'published'");
        }

        if (category != null && !category.equalsIgnoreCase("All") && !category.isEmpty()) {
            sql.append(" AND category = ?");
            params.add(category);
        }

        if (level != null && !level.equalsIgnoreCase("All Levels") && !level.isEmpty()) {
            sql.append(" AND level = ?");
            params.add(level);
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (title LIKE ? OR description LIKE ? OR category LIKE ? OR skills LIKE ?)");
            String wild = "%" + search.trim() + "%";
            params.add(wild);
            params.add(wild);
            params.add(wild);
            params.add(wild);
        }

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    public Course findByIdOrSlug(String idOrSlug) throws SQLException {
        String sql = """
            SELECT c.*, u.name as instructor_name, u.email as instructor_email, u.profile_image as instructor_image, u.bio as instructor_bio
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            WHERE c.id = ? OR c.slug = ?
        """;
        Course course = null;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, idOrSlug);
            pstmt.setString(2, idOrSlug);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    course = mapCourseWithInstructor(rs);
                }
            }
        }

        if (course != null) {
            course.setModules(fetchModulesForCourse(course.getId()));
        }
        return course;
    }

    public List<Module> fetchModulesForCourse(String courseId) throws SQLException {
        String sqlMod = "SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC";
        String sqlLes = "SELECT * FROM lessons WHERE module_id = ? ORDER BY order_num ASC";

        List<Module> modules = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmtMod = conn.prepareStatement(sqlMod)) {
            pstmtMod.setString(1, courseId);
            try (ResultSet rsMod = pstmtMod.executeQuery()) {
                while (rsMod.next()) {
                    Module m = new Module();
                    m.setId(rsMod.getString("id"));
                    m.setCourseId(rsMod.getString("course_id"));
                    m.setTitle(rsMod.getString("title"));
                    m.setDescription(rsMod.getString("description"));
                    m.setOrder(rsMod.getInt("order_num"));

                    // Fetch lessons for module
                    List<Lesson> lessons = new ArrayList<>();
                    try (PreparedStatement pstmtLes = conn.prepareStatement(sqlLes)) {
                        pstmtLes.setString(1, m.getId());
                        try (ResultSet rsLes = pstmtLes.executeQuery()) {
                            while (rsLes.next()) {
                                Lesson l = new Lesson();
                                l.setId(rsLes.getString("id"));
                                l.setModuleId(rsLes.getString("module_id"));
                                l.setCourseId(rsLes.getString("course_id"));
                                l.setTitle(rsLes.getString("title"));
                                l.setDescription(rsLes.getString("description"));
                                l.setVideoUrl(rsLes.getString("video_url"));
                                l.setContent(rsLes.getString("content"));
                                l.setDuration(rsLes.getInt("duration"));
                                l.setOrder(rsLes.getInt("order_num"));
                                l.setPreview(rsLes.getInt("is_preview") == 1);
                                lessons.add(l);
                            }
                        }
                    }
                    m.setLessons(lessons);
                    modules.add(m);
                }
            }
        }
        return modules;
    }

    public Course createCourse(Course course) throws SQLException {
        if (course.getId() == null || course.getId().isEmpty()) {
            course.setId(UUID.randomUUID().toString());
        }
        if (course.getSlug() == null || course.getSlug().isEmpty()) {
            String base = course.getTitle().toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-");
            course.setSlug(base + "-" + (int)(Math.random() * 9000 + 1000));
        }

        String sql = """
            INSERT INTO courses (id, title, slug, description, short_description, thumbnail, category, level, language, price, instructor_id, duration, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, course.getId());
            pstmt.setString(2, course.getTitle());
            pstmt.setString(3, course.getSlug());
            pstmt.setString(4, course.getDescription());
            pstmt.setString(5, course.getShortDescription() != null ? course.getShortDescription() : "");
            pstmt.setString(6, course.getThumbnail() != null ? course.getThumbnail() : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80");
            pstmt.setString(7, course.getCategory());
            pstmt.setString(8, course.getLevel() != null ? course.getLevel() : "All Levels");
            pstmt.setString(9, course.getLanguage() != null ? course.getLanguage() : "English");
            pstmt.setDouble(10, course.getPrice());
            pstmt.setString(11, course.getInstructorId());
            pstmt.setString(12, course.getDuration() != null ? course.getDuration() : "10 hours");
            pstmt.setString(13, course.getStatus() != null ? course.getStatus() : "draft");
            pstmt.executeUpdate();
        }
        return findByIdOrSlug(course.getId());
    }

    public void updateCourse(Course course) throws SQLException {
        String sql = """
            UPDATE courses SET title = ?, description = ?, short_description = ?, category = ?,
            level = ?, price = ?, duration = ?, status = ? WHERE id = ?
        """;
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, course.getTitle());
            pstmt.setString(2, course.getDescription());
            pstmt.setString(3, course.getShortDescription());
            pstmt.setString(4, course.getCategory());
            pstmt.setString(5, course.getLevel());
            pstmt.setDouble(6, course.getPrice());
            pstmt.setString(7, course.getDuration());
            pstmt.setString(8, course.getStatus());
            pstmt.setString(9, course.getId());
            pstmt.executeUpdate();
        }
    }

    public void deleteCourse(String id) throws SQLException {
        String sql = "DELETE FROM courses WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.executeUpdate();
        }
    }

    public void updateStatus(String id, String status) throws SQLException {
        String sql = "UPDATE courses SET status = ? WHERE id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, status);
            pstmt.setString(2, id);
            pstmt.executeUpdate();
        }
    }

    public List<Course> listByInstructor(String instructorId) throws SQLException {
        String sql = "SELECT c.*, u.name as instructor_name, u.profile_image as instructor_image, u.bio as instructor_bio FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.instructor_id = ? ORDER BY c.created_at DESC";
        List<Course> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, instructorId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapCourseWithInstructor(rs));
                }
            }
        }
        return list;
    }

    public List<Map<String, Object>> getCategories() throws SQLException {
        String sql = "SELECT category, COUNT(*) as count FROM courses WHERE status = 'published' GROUP BY category ORDER BY count DESC";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("name", rs.getString("category"));
                map.put("count", rs.getInt("count"));
                list.add(map);
            }
        }
        return list;
    }

    private Course mapCourseWithInstructor(ResultSet rs) throws SQLException {
        Course c = new Course();
        c.setId(rs.getString("id"));
        c.setTitle(rs.getString("title"));
        c.setSlug(rs.getString("slug"));
        c.setDescription(rs.getString("description"));
        c.setShortDescription(rs.getString("short_description"));
        c.setThumbnail(rs.getString("thumbnail"));
        c.setCategory(rs.getString("category"));
        c.setLevel(rs.getString("level"));
        c.setLanguage(rs.getString("language"));
        c.setPrice(rs.getDouble("price"));
        c.setInstructorId(rs.getString("instructor_id"));
        c.setDuration(rs.getString("duration"));
        c.setStatus(rs.getString("status"));
        c.setRatingAvg(rs.getDouble("rating_avg"));
        c.setRatingCount(rs.getInt("rating_count"));
        c.setEnrolledCount(rs.getInt("enrolled_count"));
        c.setCreatedAt(rs.getString("created_at"));

        User inst = new User();
        inst.setId(rs.getString("instructor_id"));
        inst.setName(rs.getString("instructor_name"));
        inst.setProfileImage(rs.getString("instructor_image"));
        inst.setBio(rs.getString("instructor_bio"));
        c.setInstructor(inst);

        return c;
    }
}
