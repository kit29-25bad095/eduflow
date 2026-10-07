package com.eduflow.database;

import com.eduflow.util.PasswordUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

public class DatabaseSeeder {

    public static void seedIfEmpty() {
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM users")) {
            if (rs.next() && rs.getInt(1) > 0) {
                System.out.println("[JDBC Seeder] Database already populated (" + rs.getInt(1) + " users found). Skipping seed.");
                return;
            }
        } catch (SQLException e) {
            System.err.println("[JDBC Seeder] Error checking database: " + e.getMessage());
            return;
        }

        System.out.println("[JDBC Seeder] Seeding database via JDBC PreparedStatements...");
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);

            String defaultPassHash = PasswordUtil.hashPassword("Password123!");

            // 1. Seed Users
            String userSql = "INSERT INTO users (id, name, email, password, role, profile_image, bio, skills, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)";
            PreparedStatement userPs = conn.prepareStatement(userSql);

            // Admin
            String adminId = "usr-admin-1";
            userPs.setString(1, adminId);
            userPs.setString(2, "System Administrator");
            userPs.setString(3, "admin@eduflow.com");
            userPs.setString(4, defaultPassHash);
            userPs.setString(5, "admin");
            userPs.setString(6, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80");
            userPs.setString(7, "Head LMS Platform Administrator overseeing platform security and governance.");
            userPs.setString(8, "System Administration, Governance");
            userPs.executeUpdate();

            // Instructors
            String inst1Id = "usr-inst-1";
            userPs.setString(1, inst1Id);
            userPs.setString(2, "Dr. Sarah Lin");
            userPs.setString(3, "sarah.lin@eduflow.com");
            userPs.setString(4, defaultPassHash);
            userPs.setString(5, "instructor");
            userPs.setString(6, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80");
            userPs.setString(7, "Principal AI Scientist and PhD in Machine Learning. Ex-Google Research.");
            userPs.setString(8, "Deep Learning, PyTorch, Transformers, AI");
            userPs.executeUpdate();

            String inst2Id = "usr-inst-2";
            userPs.setString(1, inst2Id);
            userPs.setString(2, "David Miller");
            userPs.setString(3, "david.miller@eduflow.com");
            userPs.setString(4, defaultPassHash);
            userPs.setString(5, "instructor");
            userPs.setString(6, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80");
            userPs.setString(7, "Senior Staff Engineer with 12+ years building distributed cloud backends & React ecosystems.");
            userPs.setString(8, "React, Node.js, TypeScript, Cloud, Docker");
            userPs.executeUpdate();

            String inst3Id = "usr-inst-3";
            userPs.setString(1, inst3Id);
            userPs.setString(2, "Elena Rostova");
            userPs.setString(3, "elena.rostova@eduflow.com");
            userPs.setString(4, defaultPassHash);
            userPs.setString(5, "instructor");
            userPs.setString(6, "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80");
            userPs.setString(7, "Cybersecurity Architect, CISSP, Offensive Security Certified Professional (OSCP).");
            userPs.setString(8, "Penetration Testing, Network Security, Zero Trust");
            userPs.executeUpdate();

            // Students
            String[] studentNames = {"Alex Johnson", "Beatriz Silva", "Carlos Mendez", "Deepak Patel", "Emma Watson"};
            String[] studentIds = new String[studentNames.length];
            for (int i = 0; i < studentNames.length; i++) {
                String sid = "usr-stud-" + (i + 1);
                studentIds[i] = sid;
                userPs.setString(1, sid);
                userPs.setString(2, studentNames[i]);
                userPs.setString(3, "student" + (i + 1) + "@eduflow.com");
                userPs.setString(4, defaultPassHash);
                userPs.setString(5, "student");
                userPs.setString(6, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
                userPs.setString(7, "Passionate learner studying full-stack engineering and computer science.");
                userPs.setString(8, "JavaScript, Python, React");
                userPs.executeUpdate();
            }

            // 2. Seed Courses
            String courseSql = """
                INSERT INTO courses (id, title, slug, description, short_description, thumbnail, category, level, language, price, instructor_id, duration, skills, requirements, status, rating_avg, rating_count, enrolled_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
            """;
            PreparedStatement coursePs = conn.prepareStatement(courseSql);

            // Course 1: Full-Stack React
            String c1Id = "crs-react-pro";
            coursePs.setString(1, c1Id);
            coursePs.setString(2, "Full-Stack Web Development: Modern React & Node.js");
            coursePs.setString(3, "full-stack-web-development-modern-react-nodejs");
            coursePs.setString(4, "Master enterprise full-stack development building scalable microservices, relational databases via JDBC, reactive state management, and production-grade CI/CD pipelines.");
            coursePs.setString(5, "Build production-ready web apps with React, Vite, Node, and SQL databases.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Web Development");
            coursePs.setString(8, "Intermediate");
            coursePs.setString(9, "English");
            coursePs.setDouble(10, 79.99);
            coursePs.setString(11, inst2Id);
            coursePs.setString(12, "14 hours");
            coursePs.setString(13, "React, Node.js, Express, JDBC, SQL, REST APIs");
            coursePs.setString(14, "Basic JavaScript understanding");
            coursePs.setDouble(15, 4.9);
            coursePs.setInt(16, 28);
            coursePs.setInt(17, 34);
            coursePs.executeUpdate();

            // Course 2: Deep Learning
            String c2Id = "crs-ai-deeplearn";
            coursePs.setString(1, c2Id);
            coursePs.setString(2, "Deep Learning & Neural Network Architecture");
            coursePs.setString(3, "deep-learning-neural-network-architecture");
            coursePs.setString(4, "An exhaustive deep dive into state-of-the-art deep learning. Build neural networks from scratch, master PyTorch, implement convolutional networks, and train Transformers.");
            coursePs.setString(5, "Master backpropagation, CNNs, Transformers, and PyTorch.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Artificial Intelligence");
            coursePs.setString(8, "Advanced");
            coursePs.setString(9, "English");
            coursePs.setDouble(10, 89.99);
            coursePs.setString(11, inst1Id);
            coursePs.setString(12, "18 hours");
            coursePs.setString(13, "PyTorch, Neural Networks, Deep Learning, Calculus");
            coursePs.setString(14, "Python proficiency and basic linear algebra");
            coursePs.setDouble(15, 4.8);
            coursePs.setInt(16, 19);
            coursePs.setInt(17, 26);
            coursePs.executeUpdate();

            // Course 3: Ethical Hacking
            String c3Id = "crs-cyber-sec";
            coursePs.setString(1, c3Id);
            coursePs.setString(2, "Practical Ethical Hacking & Penetration Testing");
            coursePs.setString(3, "practical-ethical-hacking-penetration-testing");
            coursePs.setString(4, "Hands-on penetration testing methodologies, network vulnerability scanning, web security exploitation, and threat remediation.");
            coursePs.setString(5, "Learn real-world offensive security, Wireshark, Metasploit, and Linux forensics.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Cybersecurity");
            coursePs.setString(8, "Beginner");
            coursePs.setString(9, "English");
            coursePs.setDouble(10, 69.99);
            coursePs.setString(11, inst3Id);
            coursePs.setString(12, "12 hours");
            coursePs.setString(13, "Linux, Penetration Testing, Network Security, Kali Linux");
            coursePs.setString(14, "Basic computer networking fundamentals");
            coursePs.setDouble(15, 4.7);
            coursePs.setInt(16, 15);
            coursePs.setInt(17, 18);
            coursePs.executeUpdate();

            // 3. Modules and Lessons
            String modSql = "INSERT INTO modules (id, course_id, title, description, order_num) VALUES (?, ?, ?, ?, ?)";
            PreparedStatement modPs = conn.prepareStatement(modSql);

            String lesSql = "INSERT INTO lessons (id, module_id, course_id, title, description, video_url, content, duration, order_num, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement lesPs = conn.prepareStatement(lesSql);

            // C1 Module 1
            String m1Id = "mod-c1-1";
            modPs.setString(1, m1Id);
            modPs.setString(2, c1Id);
            modPs.setString(3, "Module 1: Foundations of Modern Web Architecture");
            modPs.setString(4, "Understand client-server architecture, HTTP lifecycle, and React components.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            // C1 M1 Lessons
            String l1Id = "les-c1-1";
            lesPs.setString(1, l1Id);
            lesPs.setString(2, m1Id);
            lesPs.setString(3, c1Id);
            lesPs.setString(4, "1.1 Introduction to Client-Server Architecture & HTTP/REST");
            lesPs.setString(5, "Overview of HTTP requests, status codes, RESTful conventions, and JSON payloads.");
            lesPs.setString(6, "https://www.youtube.com/embed/UB1O30fR-EE");
            lesPs.setString(7, "# HTTP & REST Conventions\n\nIn this lesson, we explore how frontend clients talk to backend REST APIs using JSON payloads, proper HTTP status codes (200, 201, 400, 401, 403, 500), and CORS handling.");
            lesPs.setInt(8, 15);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1); // preview
            lesPs.executeUpdate();

            String l2Id = "les-c1-2";
            lesPs.setString(1, l2Id);
            lesPs.setString(2, m1Id);
            lesPs.setString(3, c1Id);
            lesPs.setString(4, "1.2 React 18 Core Concepts & Hooks Deep Dive");
            lesPs.setString(5, "Deep dive into useState, useEffect, useCallback, and custom hooks.");
            lesPs.setString(6, "https://www.youtube.com/embed/w7ejDZ8SWv8");
            lesPs.setString(7, "# React 18 Hooks\n\nWe build custom hooks to encapsulate data fetching and manage side effects cleanly.");
            lesPs.setInt(8, 20);
            lesPs.setInt(9, 2);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            // C1 Module 2
            String m2Id = "mod-c1-2";
            modPs.setString(1, m2Id);
            modPs.setString(2, c1Id);
            modPs.setString(3, "Module 2: JDBC, Relational Persistence & Transactions");
            modPs.setString(4, "Connect to databases using JDBC PreparedStatement, manage transactions, and prevent SQL injection.");
            modPs.setInt(5, 2);
            modPs.executeUpdate();

            String l3Id = "les-c1-3";
            lesPs.setString(1, l3Id);
            lesPs.setString(2, m2Id);
            lesPs.setString(3, c1Id);
            lesPs.setString(4, "2.1 Database Drivers & JDBC PreparedStatement Execution");
            lesPs.setString(5, "Connecting to relational databases, Connection pooling, and parameterized queries.");
            lesPs.setString(6, "https://www.youtube.com/embed/2i4t-SL77tI");
            lesPs.setString(7, "# JDBC Fundamentals\n\nLearn how Java Database Connectivity communicates directly with SQL databases using PreparedStatements.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            // C2 Module 1 & Lessons
            String m3Id = "mod-c2-1";
            modPs.setString(1, m3Id);
            modPs.setString(2, c2Id);
            modPs.setString(3, "Module 1: Tensors, Autograd & Computational Graphs");
            modPs.setString(4, "Learn the mechanics of automatic differentiation in PyTorch.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            String l4Id = "les-c2-1";
            lesPs.setString(1, l4Id);
            lesPs.setString(2, m3Id);
            lesPs.setString(3, c2Id);
            lesPs.setString(4, "1.1 Tensor Math and Autograd Mechanics");
            lesPs.setString(5, "Understand forward pass, loss calculation, backward pass, and optimizer steps.");
            lesPs.setString(6, "https://www.youtube.com/embed/aircAruvnKk");
            lesPs.setString(7, "# PyTorch Tensors\n\nUnderstand computation graphs and automatic gradient calculation.");
            lesPs.setInt(8, 30);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1);
            lesPs.executeUpdate();

            // 4. Assignments
            String assignSql = "INSERT INTO assignments (id, course_id, module_id, title, description, instructions, due_date, max_marks, created_by) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+14 days'), ?, ?)";
            PreparedStatement asPs = conn.prepareStatement(assignSql);

            String a1Id = "asg-c1-1";
            asPs.setString(1, a1Id);
            asPs.setString(2, c1Id);
            asPs.setString(3, m1Id);
            asPs.setString(4, "Project 1: Full-Stack Component & API Architecture");
            asPs.setString(5, "Implement a custom hook and REST API integration with error handling.");
            asPs.setString(6, "Submit your GitHub repository link or a PDF report detailing your architecture.");
            asPs.setInt(7, 100);
            asPs.setString(8, inst2Id);
            asPs.executeUpdate();

            // 5. Enrollments for student 1 & student 2
            String enrSql = "INSERT INTO enrollments (id, student_id, course_id, status, enrolled_at, last_accessed_at) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
            PreparedStatement enrPs = conn.prepareStatement(enrSql);

            // Student 1 enrolled in C1 & C2
            enrPs.setString(1, "enr-1");
            enrPs.setString(2, studentIds[0]);
            enrPs.setString(3, c1Id);
            enrPs.executeUpdate();

            enrPs.setString(1, "enr-2");
            enrPs.setString(2, studentIds[0]);
            enrPs.setString(3, c2Id);
            enrPs.executeUpdate();

            // Student 2 enrolled in C1
            enrPs.setString(1, "enr-3");
            enrPs.setString(2, studentIds[1]);
            enrPs.setString(3, c1Id);
            enrPs.executeUpdate();

            // 6. Lesson Progress for Student 1
            String progSql = "INSERT INTO lesson_progress (id, student_id, course_id, lesson_id, completed, completed_at, time_spent) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?)";
            PreparedStatement prPs = conn.prepareStatement(progSql);

            prPs.setString(1, "prg-1");
            prPs.setString(2, studentIds[0]);
            prPs.setString(3, c1Id);
            prPs.setString(4, l1Id);
            prPs.setInt(5, 15);
            prPs.executeUpdate();

            // 7. Submissions
            String subSql = "INSERT INTO submissions (id, assignment_id, student_id, course_id, file_url, file_name, status, marks, feedback, graded_by, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
            PreparedStatement subPs = conn.prepareStatement(subSql);

            subPs.setString(1, "sub-1");
            subPs.setString(2, a1Id);
            subPs.setString(3, studentIds[0]);
            subPs.setString(4, c1Id);
            subPs.setString(5, "https://example.com/submissions/alex_fullstack_arch.pdf");
            subPs.setString(6, "alex_fullstack_arch.pdf");
            subPs.setString(7, "graded");
            subPs.setDouble(8, 95.0);
            subPs.setString(9, "Excellent architectural breakdown! Clean separation between data access and presentation layers.");
            subPs.setString(10, inst2Id);
            subPs.executeUpdate();

            // 8. Notifications
            String notifSql = "INSERT INTO notifications (id, recipient_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?, ?)";
            PreparedStatement notPs = conn.prepareStatement(notifSql);

            notPs.setString(1, "notif-1");
            notPs.setString(2, studentIds[0]);
            notPs.setString(3, "submission_graded");
            notPs.setString(4, "Assignment Graded: 95/100");
            notPs.setString(5, "David Miller has graded your submission for 'Project 1: Full-Stack Component & API Architecture'.");
            notPs.setInt(6, 0);
            notPs.executeUpdate();

            notPs.setString(1, "notif-2");
            notPs.setString(2, studentIds[0]);
            notPs.setString(3, "course_enrollment");
            notPs.setString(4, "Welcome to Full-Stack Web Development");
            notPs.setString(5, "You have successfully enrolled in Full-Stack Web Development: Modern React & Node.js.");
            notPs.setInt(6, 1);
            notPs.executeUpdate();

            // 9. Reviews
            String revSql = "INSERT INTO reviews (id, course_id, student_id, rating, comment) VALUES (?, ?, ?, ?, ?)";
            PreparedStatement revPs = conn.prepareStatement(revSql);

            revPs.setString(1, "rev-1");
            revPs.setString(2, c1Id);
            revPs.setString(3, studentIds[0]);
            revPs.setInt(4, 5);
            revPs.setString(5, "Phenomenal curriculum! The direct JDBC and clean SQL breakdown demystified backend engineering completely.");
            revPs.executeUpdate();

            conn.commit();
            System.out.println("[JDBC Seeder] Successfully seeded database with Admin, Instructors, Students, Courses, Modules, Lessons, Assignments, Submissions, and Reviews!");
        } catch (SQLException e) {
            System.err.println("[JDBC Seeder] Error during database seeding: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
