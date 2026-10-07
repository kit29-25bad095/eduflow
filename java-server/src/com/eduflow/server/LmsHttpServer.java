package com.eduflow.server;

import com.eduflow.util.ResponseUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;

public class LmsHttpServer {
    private HttpServer server;

    public void start(int port) throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // Core API Contexts
        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/auth/google", new AuthHandler());
        server.createContext("/api/courses", new CourseHandler());
        server.createContext("/api/modules", new ModuleHandler());
        server.createContext("/api/lessons", new LessonHandler());
        server.createContext("/api/enrollments", new EnrollmentHandler());
        server.createContext("/api/progress", new ProgressHandler());
        server.createContext("/api/assignments", new AssignmentHandler());
        server.createContext("/api/submissions", new SubmissionHandler());
        server.createContext("/api/notifications", new NotificationHandler());
        server.createContext("/api/reviews", new ReviewHandler());
        server.createContext("/api/payments", new PaymentHandler());
        server.createContext("/api/analytics", new AnalyticsHandler());
        server.createContext("/api/users", new UserHandler());
        server.createContext("/api/profile", new ProfileHandler());
        server.createContext("/api/certificates", new CertificateHandler());
        server.createContext("/api/wishlist", new WishlistHandler());
        server.createContext("/api/quizzes", new QuizHandler());

        // Health Check
        server.createContext("/api/health", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if (ResponseUtil.handleOptions(exchange)) return;
                Map<String, Object> status = new HashMap<>();
                status.put("status", "healthy");
                status.put("backend", "Java 21 + JDBC SQLite REST Server");
                status.put("database", "Relational SQLite via java.sql.*");
                status.put("timestamp", System.currentTimeMillis());
                ResponseUtil.sendSuccess(exchange, 200, status, "EduFlow Java JDBC Backend Operational");
            }
        });

        // Use thread pool for concurrent request handling
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.start();

        System.out.println("=================================================================");
        System.out.println(" 🚀 EduFlow Java JDBC Backend listening on http://localhost:" + port);
        System.out.println(" 📦 Relational Persistence: SQLite via pure java.sql.* (JDBC)");
        System.out.println(" ⚡ Handlers: Auth, Courses, Enrollments, Progress, Submissions, Analytics");
        System.out.println("=================================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(1);
        }
    }
}
