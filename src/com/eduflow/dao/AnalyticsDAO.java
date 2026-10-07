package com.eduflow.dao;

import com.eduflow.database.DatabaseManager;

import java.sql.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class AnalyticsDAO {

    public Map<String, Object> getStudentAnalytics(String studentId) throws SQLException {
        Map<String, Object> data = new HashMap<>();

        try (Connection conn = DatabaseManager.getConnection()) {
            // 1. Enrollments
            String enrSql = """
                SELECT e.status, c.id as course_id, c.title, c.category
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.student_id = ?
            """;
            int totalEnrolled = 0;
            int completedCourses = 0;
            List<Map<String, Object>> courseProgressList = new ArrayList<>();
            int totalProgSum = 0;

            try (PreparedStatement ps = conn.prepareStatement(enrSql)) {
                ps.setString(1, studentId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        totalEnrolled++;
                        String status = rs.getString("status");
                        if ("completed".equalsIgnoreCase(status)) {
                            completedCourses++;
                        }
                        String courseId = rs.getString("course_id");
                        String title = rs.getString("title");
                        String cat = rs.getString("category");

                        // Count total lessons
                        int totalLessons = 0;
                        try (PreparedStatement lps = conn.prepareStatement("SELECT COUNT(*) FROM lessons WHERE course_id = ?")) {
                            lps.setString(1, courseId);
                            try (ResultSet lrs = lps.executeQuery()) {
                                if (lrs.next()) totalLessons = lrs.getInt(1);
                            }
                        }

                        // Count completed lessons
                        int completedLessons = 0;
                        try (PreparedStatement cps = conn.prepareStatement("SELECT COUNT(*) FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1")) {
                            cps.setString(1, studentId);
                            cps.setString(2, courseId);
                            try (ResultSet crs = cps.executeQuery()) {
                                if (crs.next()) completedLessons = crs.getInt(1);
                            }
                        }

                        int prog = totalLessons > 0 ? (int) Math.round((double) completedLessons / totalLessons * 100) : 0;
                        totalProgSum += prog;

                        Map<String, Object> cp = new HashMap<>();
                        cp.put("courseId", courseId);
                        cp.put("title", title);
                        cp.put("category", cat);
                        cp.put("progress", prog);
                        cp.put("completedLessons", completedLessons);
                        cp.put("totalLessons", totalLessons);
                        courseProgressList.add(cp);
                    }
                }
            }

            int activeCourses = Math.max(0, totalEnrolled - completedCourses);
            int avgProgress = totalEnrolled > 0 ? (int) Math.round((double) totalProgSum / totalEnrolled) : 0;

            // 2. Submissions & Grades
            String subSql = """
                SELECT s.status, s.marks, a.max_marks
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                WHERE s.student_id = ?
            """;
            int submittedCount = 0;
            double totalMarks = 0;
            double totalMax = 0;
            try (PreparedStatement ps = conn.prepareStatement(subSql)) {
                ps.setString(1, studentId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        submittedCount++;
                        String st = rs.getString("status");
                        if ("graded".equalsIgnoreCase(st)) {
                            double m = rs.getDouble("marks");
                            int maxM = rs.getInt("max_marks");
                            if (maxM > 0) {
                                totalMarks += m;
                                totalMax += maxM;
                            }
                        }
                    }
                }
            }

            int avgGrade = totalMax > 0 ? (int) Math.round((totalMarks / totalMax) * 100) : 0;

            // Enrolled assignments count
            int totalEnrolledAssignments = 0;
            String enrAssignSql = """
                SELECT COUNT(*) FROM assignments
                WHERE course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
            """;
            try (PreparedStatement ps = conn.prepareStatement(enrAssignSql)) {
                ps.setString(1, studentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) totalEnrolledAssignments = rs.getInt(1);
                }
            }
            int pendingAssignments = Math.max(0, totalEnrolledAssignments - submittedCount);

            // 3. Learning hours from progress
            double learningHours = 0.0;
            String timeSql = "SELECT SUM(time_spent) FROM lesson_progress WHERE student_id = ? AND completed = 1";
            try (PreparedStatement ps = conn.prepareStatement(timeSql)) {
                ps.setString(1, studentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int minutes = rs.getInt(1);
                        if (minutes == 0) minutes = courseProgressList.stream().mapToInt(c -> (int) c.get("completedLessons") * 15).sum();
                        learningHours = Math.round((minutes / 60.0) * 10.0) / 10.0;
                    }
                }
            }

            // 4. Weekly Activity (last 7 days)
            List<Map<String, Object>> weeklyActivity = new ArrayList<>();
            String[] dayNames = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
            LocalDate today = LocalDate.now();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                String dateStr = date.format(fmt);
                String dayName = dayNames[date.getDayOfWeek().getValue() % 7];

                int count = 0;
                String wSql = "SELECT COUNT(*) FROM lesson_progress WHERE student_id = ? AND completed = 1 AND DATE(completed_at) = ?";
                try (PreparedStatement ps = conn.prepareStatement(wSql)) {
                    ps.setString(1, studentId);
                    ps.setString(2, dateStr);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) count = rs.getInt(1);
                    }
                }

                Map<String, Object> dayMap = new HashMap<>();
                dayMap.put("day", dayName);
                dayMap.put("date", dateStr);
                dayMap.put("lessonsCompleted", count);
                weeklyActivity.add(dayMap);
            }

            data.put("totalEnrolled", totalEnrolled);
            data.put("completedCourses", completedCourses);
            data.put("activeCourses", activeCourses);
            data.put("averageProgress", avgProgress);
            data.put("assignmentsPending", pendingAssignments);
            data.put("assignmentsSubmitted", submittedCount);
            data.put("averageGrade", avgGrade);
            data.put("learningHours", learningHours);
            data.put("courseProgress", courseProgressList);
            data.put("weeklyActivity", weeklyActivity);
        }

        return data;
    }

    public Map<String, Object> getInstructorAnalytics(String instructorId) throws SQLException {
        Map<String, Object> data = new HashMap<>();

        try (Connection conn = DatabaseManager.getConnection()) {
            int totalCourses = 0;
            int publishedCourses = 0;
            List<String> courseIds = new ArrayList<>();
            List<Map<String, Object>> coursePerformance = new ArrayList<>();
            double totalRatingSum = 0;
            int ratedCoursesCount = 0;

            String cSql = "SELECT * FROM courses WHERE instructor_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(cSql)) {
                ps.setString(1, instructorId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        totalCourses++;
                        String id = rs.getString("id");
                        courseIds.add(id);
                        String status = rs.getString("status");
                        if ("published".equalsIgnoreCase(status)) publishedCourses++;

                        String title = rs.getString("title");
                        if (title.length() > 22) title = title.substring(0, 20) + "...";
                        int enrolled = rs.getInt("enrolled_count");
                        double rating = rs.getDouble("rating_avg");
                        double price = rs.getDouble("price");

                        if (rating > 0) {
                            totalRatingSum += rating;
                            ratedCoursesCount++;
                        }

                        Map<String, Object> cp = new HashMap<>();
                        cp.put("id", id);
                        cp.put("title", title);
                        cp.put("enrolled", enrolled);
                        cp.put("rating", rating);
                        cp.put("price", price);
                        coursePerformance.add(cp);
                    }
                }
            }

            // Total Students & Total Enrollments
            int totalEnrollments = 0;
            int totalStudents = 0;
            if (!courseIds.isEmpty()) {
                String inClause = String.join(",", Collections.nCopies(courseIds.size(), "?"));
                String enrSql = "SELECT COUNT(*), COUNT(DISTINCT student_id) FROM enrollments WHERE course_id IN (" + inClause + ")";
                try (PreparedStatement ps = conn.prepareStatement(enrSql)) {
                    for (int i = 0; i < courseIds.size(); i++) ps.setString(i + 1, courseIds.get(i));
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            totalEnrollments = rs.getInt(1);
                            totalStudents = rs.getInt(2);
                        }
                    }
                }
            }

            // Submissions & Grading
            int totalSubmissions = 0;
            int pendingGrading = 0;
            int gradedSubmissions = 0;
            if (!courseIds.isEmpty()) {
                String inClause = String.join(",", Collections.nCopies(courseIds.size(), "?"));
                String subSql = "SELECT status, COUNT(*) FROM submissions WHERE course_id IN (" + inClause + ") GROUP BY status";
                try (PreparedStatement ps = conn.prepareStatement(subSql)) {
                    for (int i = 0; i < courseIds.size(); i++) ps.setString(i + 1, courseIds.get(i));
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            String st = rs.getString(1);
                            int cnt = rs.getInt(2);
                            totalSubmissions += cnt;
                            if ("graded".equalsIgnoreCase(st)) gradedSubmissions += cnt;
                            else pendingGrading += cnt;
                        }
                    }
                }
            }

            double avgRating = ratedCoursesCount > 0 ? Math.round((totalRatingSum / ratedCoursesCount) * 10.0) / 10.0 : 0.0;

            // Enrollment trends (last 7 days)
            List<Map<String, Object>> trends = new ArrayList<>();
            String[] dayNames = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
            LocalDate today = LocalDate.now();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                String dateStr = date.format(fmt);
                String dayName = dayNames[date.getDayOfWeek().getValue() % 7];
                int cnt = 0;

                if (!courseIds.isEmpty()) {
                    String inClause = String.join(",", Collections.nCopies(courseIds.size(), "?"));
                    String tSql = "SELECT COUNT(*) FROM enrollments WHERE course_id IN (" + inClause + ") AND DATE(enrolled_at) = ?";
                    try (PreparedStatement ps = conn.prepareStatement(tSql)) {
                        for (int j = 0; j < courseIds.size(); j++) ps.setString(j + 1, courseIds.get(j));
                        ps.setString(courseIds.size() + 1, dateStr);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) cnt = rs.getInt(1);
                        }
                    }
                }

                Map<String, Object> item = new HashMap<>();
                item.put("day", dayName);
                item.put("date", dateStr);
                item.put("enrollments", cnt);
                trends.add(item);
            }

            data.put("totalCourses", totalCourses);
            data.put("publishedCourses", publishedCourses);
            data.put("totalStudents", totalStudents);
            data.put("totalEnrollments", totalEnrollments);
            data.put("totalSubmissions", totalSubmissions);
            data.put("pendingGrading", pendingGrading);
            data.put("gradedSubmissions", gradedSubmissions);
            data.put("averageCourseRating", avgRating);
            data.put("coursePerformance", coursePerformance);
            data.put("enrollmentTrends", trends);
        }

        return data;
    }

    public Map<String, Object> getAdminAnalytics() throws SQLException {
        Map<String, Object> data = new HashMap<>();

        try (Connection conn = DatabaseManager.getConnection()) {
            int totalUsers = 0, studentsCount = 0, instructorsCount = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT role, COUNT(*) FROM users GROUP BY role")) {
                while (rs.next()) {
                    String role = rs.getString(1);
                    int c = rs.getInt(2);
                    totalUsers += c;
                    if ("student".equalsIgnoreCase(role)) studentsCount = c;
                    else if ("instructor".equalsIgnoreCase(role)) instructorsCount = c;
                }
            }

            int totalCourses = 0, publishedCourses = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT status, COUNT(*) FROM courses GROUP BY status")) {
                while (rs.next()) {
                    String stVal = rs.getString(1);
                    int c = rs.getInt(2);
                    totalCourses += c;
                    if ("published".equalsIgnoreCase(stVal)) publishedCourses = c;
                }
            }

            int totalEnrollments = 0, completedCourses = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT status, COUNT(*) FROM enrollments GROUP BY status")) {
                while (rs.next()) {
                    String stVal = rs.getString(1);
                    int c = rs.getInt(2);
                    totalEnrollments += c;
                    if ("completed".equalsIgnoreCase(stVal)) completedCourses = c;
                }
            }

            int totalSubmissions = 0, gradedSubmissions = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT status, COUNT(*) FROM submissions GROUP BY status")) {
                while (rs.next()) {
                    String stVal = rs.getString(1);
                    int c = rs.getInt(2);
                    totalSubmissions += c;
                    if ("graded".equalsIgnoreCase(stVal)) gradedSubmissions = c;
                }
            }

            // Category distribution
            List<Map<String, Object>> catDist = new ArrayList<>();
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT category, COUNT(*) FROM courses GROUP BY category ORDER BY COUNT(*) DESC LIMIT 8")) {
                while (rs.next()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", rs.getString(1));
                    item.put("value", rs.getInt(2));
                    catDist.add(item);
                }
            }

            // Recent stats (last 30 days)
            int newUsers = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM users WHERE created_at >= date('now', '-30 days')")) {
                if (rs.next()) newUsers = rs.getInt(1);
            }
            int newEnr = 0;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM enrollments WHERE enrolled_at >= date('now', '-30 days')")) {
                if (rs.next()) newEnr = rs.getInt(1);
            }

            Map<String, Object> recent = new HashMap<>();
            recent.put("newUsersLast30Days", newUsers);
            recent.put("newEnrollmentsLast30Days", newEnr);

            data.put("totalUsers", totalUsers);
            data.put("studentsCount", studentsCount);
            data.put("instructorsCount", instructorsCount);
            data.put("totalCourses", totalCourses);
            data.put("publishedCourses", publishedCourses);
            data.put("totalEnrollments", totalEnrollments);
            data.put("completedCourses", completedCourses);
            data.put("totalSubmissions", totalSubmissions);
            data.put("gradedSubmissions", gradedSubmissions);
            data.put("categoryDistribution", catDist);
            data.put("recentStats", recent);
        }

        return data;
    }
}
