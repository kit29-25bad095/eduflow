package com.eduflow.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AddFreeCourses {

    public static void seedFreeCourses() {
        System.out.println("[JDBC Free Courses] Seeding valuable free courses...");

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);

            String checkSql = "SELECT COUNT(*) FROM courses WHERE price = 0.0";
            try (PreparedStatement checkPs = conn.prepareStatement(checkSql);
                 ResultSet rs = checkPs.executeQuery()) {
                if (rs.next() && rs.getInt(1) >= 5) {
                    System.out.println("[JDBC Free Courses] Free courses already present (" + rs.getInt(1) + " found).");
                    return;
                }
            }

            String courseSql = """
                INSERT INTO courses (id, title, slug, description, short_description, thumbnail, category, level, language, price, instructor_id, duration, skills, requirements, status, rating_avg, rating_count, enrolled_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?, ?, ?, 'published', ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET price = 0.0, status = 'published';
            """;
            PreparedStatement coursePs = conn.prepareStatement(courseSql);

            String modSql = "INSERT OR IGNORE INTO modules (id, course_id, title, description, order_num) VALUES (?, ?, ?, ?, ?)";
            PreparedStatement modPs = conn.prepareStatement(modSql);

            String lesSql = "INSERT OR IGNORE INTO lessons (id, module_id, course_id, title, description, video_url, content, duration, order_num, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement lesPs = conn.prepareStatement(lesSql);

            String assignSql = "INSERT OR IGNORE INTO assignments (id, course_id, module_id, title, description, instructions, due_date, max_marks, created_by) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+30 days'), ?, ?)";
            PreparedStatement asPs = conn.prepareStatement(assignSql);

            // ==========================================
            // COURSE 1: Python for Beginners (FREE)
            // ==========================================
            String c1 = "crs-free-python";
            coursePs.setString(1, c1);
            coursePs.setString(2, "Python Programming for Beginners: Zero to Hero");
            coursePs.setString(3, "python-programming-for-beginners-zero-to-hero");
            coursePs.setString(4, "A complete, hands-on introduction to modern Python. Learn syntax, control structures, list comprehensions, object-oriented programming, and file operations while building practical real-world automation scripts.");
            coursePs.setString(5, "Master foundational Python programming from variables to object-oriented automation.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Programming");
            coursePs.setString(8, "Beginner");
            coursePs.setString(9, "English");
            coursePs.setString(10, "usr-inst-2");
            coursePs.setString(11, "8 hours");
            coursePs.setString(12, "Python, Functions, OOP, Automation, Data Structures");
            coursePs.setString(13, "No prior programming experience required");
            coursePs.setDouble(14, 4.9);
            coursePs.setInt(15, 142);
            coursePs.setInt(16, 1850);
            coursePs.executeUpdate();

            // C1 Module 1
            modPs.setString(1, "mod-py-1");
            modPs.setString(2, c1);
            modPs.setString(3, "Module 1: Python Core Foundations");
            modPs.setString(4, "Installation, IDE setup, variables, and flow control.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            lesPs.setString(1, "les-py-1");
            lesPs.setString(2, "mod-py-1");
            lesPs.setString(3, c1);
            lesPs.setString(4, "1.1 Setting Up Python & Writing Your First Script");
            lesPs.setString(5, "Introduction to the Python interpreter, VS Code, and variables.");
            lesPs.setString(6, "https://www.youtube.com/embed/rfscVS0vtbw");
            lesPs.setString(7, "# Welcome to Python\n\nPython is one of the most versatile languages in the world. In this lesson, we cover syntax, data types, and writing clean PEP 8 compliant code.");
            lesPs.setInt(8, 20);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1);
            lesPs.executeUpdate();

            lesPs.setString(1, "les-py-2");
            lesPs.setString(2, "mod-py-1");
            lesPs.setString(3, c1);
            lesPs.setString(4, "1.2 Conditionals, Loops & Functions");
            lesPs.setString(5, "If-else statements, for/while loops, and defining reusable functions.");
            lesPs.setString(6, "https://www.youtube.com/embed/k9TUPpGqYTo");
            lesPs.setString(7, "# Control Flow in Python\n\nMaster conditional branching and iteration patterns.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 2);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            // C1 Module 2
            modPs.setString(1, "mod-py-2");
            modPs.setString(2, c1);
            modPs.setString(3, "Module 2: Data Structures & OOP");
            modPs.setString(4, "Lists, dictionaries, file I/O, and class definitions.");
            modPs.setInt(5, 2);
            modPs.executeUpdate();

            lesPs.setString(1, "les-py-3");
            lesPs.setString(2, "mod-py-2");
            lesPs.setString(3, c1);
            lesPs.setString(4, "2.1 Lists, Dictionaries, and Tuples in Practice");
            lesPs.setString(5, "Explore key-value lookups, indexing, and list comprehensions.");
            lesPs.setString(6, "https://www.youtube.com/embed/W8KRzm-HUcc");
            lesPs.setString(7, "# Python Data Structures\n\nLists and dictionaries are the core workhorses of Python.");
            lesPs.setInt(8, 30);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            asPs.setString(1, "asg-py-1");
            asPs.setString(2, c1);
            asPs.setString(3, "mod-py-2");
            asPs.setString(4, "Project: Command-Line Expense Tracker");
            asPs.setString(5, "Build an interactive CLI tool that allows users to record, categorize, and calculate monthly expenses stored in a CSV file.");
            asPs.setString(6, "Submit your Python script (`tracker.py`) and a sample CSV output.");
            asPs.setInt(7, 100);
            asPs.setString(8, "usr-inst-2");
            asPs.executeUpdate();

            // ==========================================
            // COURSE 2: Machine Learning Foundations (FREE)
            // ==========================================
            String c2 = "crs-free-ml";
            coursePs.setString(1, c2);
            coursePs.setString(2, "Machine Learning Foundations & Scikit-Learn");
            coursePs.setString(3, "machine-learning-foundations-scikit-learn");
            coursePs.setString(4, "A practical, mathematics-grounded introduction to machine learning algorithms. Master regression, classification, clustering, hyperparameter tuning, and model evaluation using Scikit-Learn and Pandas.");
            coursePs.setString(5, "Learn supervised & unsupervised ML, regression, classification, and validation.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Artificial Intelligence");
            coursePs.setString(8, "Beginner");
            coursePs.setString(9, "English");
            coursePs.setString(10, "usr-inst-1");
            coursePs.setString(11, "12 hours");
            coursePs.setString(12, "Machine Learning, Scikit-Learn, Regression, Classification, Pandas");
            coursePs.setString(13, "Basic Python knowledge");
            coursePs.setDouble(14, 4.8);
            coursePs.setInt(15, 118);
            coursePs.setInt(16, 1420);
            coursePs.executeUpdate();

            modPs.setString(1, "mod-ml-1");
            modPs.setString(2, c2);
            modPs.setString(3, "Module 1: The Machine Learning Workflow");
            modPs.setString(4, "Data preparation, exploratory data analysis, and train/test splitting.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            lesPs.setString(1, "les-ml-1");
            lesPs.setString(2, "mod-ml-1");
            lesPs.setString(3, c2);
            lesPs.setString(4, "1.1 Supervised vs. Unsupervised Learning Paradigms");
            lesPs.setString(5, "Understanding the landscape of machine learning and problem formulation.");
            lesPs.setString(6, "https://www.youtube.com/embed/Gv9_4yMHFhI");
            lesPs.setString(7, "# Machine Learning Concepts\n\nLearn how models learn patterns from labeled data and generalize to unseen test observations.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1);
            lesPs.executeUpdate();

            lesPs.setString(1, "les-ml-2");
            lesPs.setString(2, "mod-ml-1");
            lesPs.setString(3, c2);
            lesPs.setString(4, "1.2 Linear & Ridge Regression with Scikit-Learn");
            lesPs.setString(5, "Training your first linear model, cost functions, and gradient descent.");
            lesPs.setString(6, "https://www.youtube.com/embed/0LT9w-BxKFQ");
            lesPs.setString(7, "# Regression Modeling\n\nImplement least-squares regression with regularizers.");
            lesPs.setInt(8, 30);
            lesPs.setInt(9, 2);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            asPs.setString(1, "asg-ml-1");
            asPs.setString(2, c2);
            asPs.setString(3, "mod-ml-1");
            asPs.setString(4, "Lab: Predicting Housing Prices with Ridge Regression");
            asPs.setString(5, "Train and evaluate a regression pipeline to predict real estate valuation based on tabular features.");
            asPs.setString(6, "Submit a Jupyter notebook or Python script achieving an R² score > 0.75.");
            asPs.setInt(7, 100);
            asPs.setString(8, "usr-inst-1");
            asPs.executeUpdate();

            // ==========================================
            // COURSE 3: Cloud & AWS Architecture (FREE)
            // ==========================================
            String c3 = "crs-free-aws";
            coursePs.setString(1, c3);
            coursePs.setString(2, "Cloud Computing & AWS Architecture Essentials");
            coursePs.setString(3, "cloud-computing-aws-architecture-essentials");
            coursePs.setString(4, "Demystify cloud infrastructure and enterprise architecture on Amazon Web Services. Learn EC2 virtual machines, S3 object storage, Virtual Private Clouds (VPC), IAM security policies, and serverless compute with AWS Lambda.");
            coursePs.setString(5, "Hands-on cloud fundamentals covering EC2, S3, IAM, VPCs, and serverless architectures.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Cloud Computing");
            coursePs.setString(8, "Beginner");
            coursePs.setString(9, "English");
            coursePs.setString(10, "usr-inst-2");
            coursePs.setString(11, "9 hours");
            coursePs.setString(12, "AWS, Cloud Architecture, EC2, S3, IAM, Networking");
            coursePs.setString(13, "Basic computer literacy and networking concepts");
            coursePs.setDouble(14, 4.9);
            coursePs.setInt(15, 95);
            coursePs.setInt(16, 1280);
            coursePs.executeUpdate();

            modPs.setString(1, "mod-aws-1");
            modPs.setString(2, c3);
            modPs.setString(3, "Module 1: AWS Global Infrastructure & Compute");
            modPs.setString(4, "Regions, availability zones, and EC2 compute deployment.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            lesPs.setString(1, "les-aws-1");
            lesPs.setString(2, "mod-aws-1");
            lesPs.setString(3, c3);
            lesPs.setString(4, "1.1 AWS Regions, Availability Zones & Core Topology");
            lesPs.setString(5, "Understanding global cloud resilience and low-latency distribution.");
            lesPs.setString(6, "https://www.youtube.com/embed/3hLmDS179YE");
            lesPs.setString(7, "# AWS Cloud Principles\n\nDiscover how cloud providers maintain 99.999% uptime across worldwide edge networks.");
            lesPs.setInt(8, 20);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1);
            lesPs.executeUpdate();

            lesPs.setString(1, "les-aws-2");
            lesPs.setString(2, "mod-aws-1");
            lesPs.setString(3, c3);
            lesPs.setString(4, "1.2 S3 Bucket Policies & Static Web Hosting");
            lesPs.setString(5, "Creating S3 buckets, setting CORS, and deploying cloud-hosted assets.");
            lesPs.setString(6, "https://www.youtube.com/embed/e6w9UPSDQV0");
            lesPs.setString(7, "# S3 Object Storage\n\nLearn immutable storage, bucket policies, and CloudFront integration.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 2);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            asPs.setString(1, "asg-aws-1");
            asPs.setString(2, c3);
            asPs.setString(3, "mod-aws-1");
            asPs.setString(4, "Architecture Project: Scalable Cloud Architecture Diagram");
            asPs.setString(5, "Design a multi-tier AWS architecture incorporating a public subnet, private subnet, and S3 backup storage.");
            asPs.setString(6, "Submit a PDF diagram detailing your networking design and security group boundaries.");
            asPs.setInt(7, 100);
            asPs.setString(8, "usr-inst-2");
            asPs.executeUpdate();

            // ==========================================
            // COURSE 4: Web Security & OWASP Top 10 (FREE)
            // ==========================================
            String c4 = "crs-free-security";
            coursePs.setString(1, c4);
            coursePs.setString(2, "Web Security Defense & OWASP Top 10");
            coursePs.setString(3, "web-security-defense-owasp-top-10");
            coursePs.setString(4, "Learn how to defend modern web applications against real-world cyber attacks. Deep dive into SQL injection, Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), authentication bypasses, and secure coding practices.");
            coursePs.setString(5, "Understand and patch the most critical web application security risks defined by OWASP.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Cybersecurity");
            coursePs.setString(8, "Intermediate");
            coursePs.setString(9, "English");
            coursePs.setString(10, "usr-inst-3");
            coursePs.setString(11, "10 hours");
            coursePs.setString(12, "Web Security, OWASP, SQL Injection, XSS, CSRF, Secure Coding");
            coursePs.setString(13, "Basic understanding of web technologies (HTML, JavaScript, SQL)");
            coursePs.setDouble(14, 4.9);
            coursePs.setInt(15, 84);
            coursePs.setInt(16, 1140);
            coursePs.executeUpdate();

            modPs.setString(1, "mod-sec-1");
            modPs.setString(2, c4);
            modPs.setString(3, "Module 1: Injection Attacks & Defense");
            modPs.setString(4, "Understanding SQLi and command injection mechanisms and remediation.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            lesPs.setString(1, "les-sec-1");
            lesPs.setString(2, "mod-sec-1");
            lesPs.setString(3, c4);
            lesPs.setString(4, "1.1 SQL Injection: Exploitation & Prepared Statement Defense");
            lesPs.setString(5, "How SQL injection occurs and why JDBC PreparedStatements prevent it.");
            lesPs.setString(6, "https://www.youtube.com/embed/ciNHn38EyRc");
            lesPs.setString(7, "# SQL Injection Prevention\n\nNever concatenate user input into SQL strings. Always use parameterized queries.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1);
            lesPs.executeUpdate();

            lesPs.setString(1, "les-sec-2");
            lesPs.setString(2, "mod-sec-1");
            lesPs.setString(3, c4);
            lesPs.setString(4, "1.2 Cross-Site Scripting (XSS) & Content Sanitization");
            lesPs.setString(5, "Stored vs Reflected XSS and Content Security Policy (CSP) implementation.");
            lesPs.setString(6, "https://www.youtube.com/embed/EoaDgUgS6QA");
            lesPs.setString(7, "# Cross-Site Scripting\n\nPrevent malicious JavaScript execution through strict input escaping and CSP headers.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 2);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            asPs.setString(1, "asg-sec-1");
            asPs.setString(2, c4);
            asPs.setString(3, "mod-sec-1");
            asPs.setString(4, "Security Lab: Code Audit & Remediation");
            asPs.setString(5, "Audit a provided backend code sample, identify 3 critical OWASP vulnerabilities, and write patches.");
            asPs.setString(6, "Submit a vulnerability report with before-and-after code diffs.");
            asPs.setInt(7, 100);
            asPs.setString(8, "usr-inst-3");
            asPs.executeUpdate();

            // ==========================================
            // COURSE 5: UI/UX Design Systems (FREE)
            // ==========================================
            String c5 = "crs-free-design";
            coursePs.setString(1, c5);
            coursePs.setString(2, "UI/UX Design Systems: Figma to Production Code");
            coursePs.setString(3, "ui-ux-design-systems-figma-to-production-code");
            coursePs.setString(4, "Bridge the gap between product design and engineering. Learn how to architect scalable design systems in Figma using auto-layout, component variants, and design tokens, and translate them directly into accessible Tailwind CSS code.");
            coursePs.setString(5, "Design reusable design systems in Figma and implement them with Tailwind CSS.");
            coursePs.setString(6, "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80");
            coursePs.setString(7, "Design");
            coursePs.setString(8, "All Levels");
            coursePs.setString(9, "English");
            coursePs.setString(10, "usr-inst-1");
            coursePs.setString(11, "7 hours");
            coursePs.setString(12, "Figma, UI/UX Design, Design Systems, Tailwind CSS, Accessibility");
            coursePs.setString(13, "Interest in design and modern web UI");
            coursePs.setDouble(14, 4.9);
            coursePs.setInt(15, 78);
            coursePs.setInt(16, 920);
            coursePs.executeUpdate();

            modPs.setString(1, "mod-des-1");
            modPs.setString(2, c5);
            modPs.setString(3, "Module 1: Design Tokens & Component Hierarchy");
            modPs.setString(4, "Color palettes, typography hierarchies, and spacing grids.");
            modPs.setInt(5, 1);
            modPs.executeUpdate();

            lesPs.setString(1, "les-des-1");
            lesPs.setString(2, "mod-des-1");
            lesPs.setString(3, c5);
            lesPs.setString(4, "1.1 Color Palettes, Contrast, and Accessibility (a11y)");
            lesPs.setString(5, "Designing with WCAG 2.1 AA accessibility standards in mind.");
            lesPs.setString(6, "https://www.youtube.com/embed/c9Wg6Cb_YlU");
            lesPs.setString(7, "# Accessible Color & Typography\n\nEnsure contrast ratios are readable for all learners across devices.");
            lesPs.setInt(8, 20);
            lesPs.setInt(9, 1);
            lesPs.setInt(10, 1);
            lesPs.executeUpdate();

            lesPs.setString(1, "les-des-2");
            lesPs.setString(2, "mod-des-1");
            lesPs.setString(3, c5);
            lesPs.setString(4, "1.2 Translating Tokens into Tailwind CSS Configuration");
            lesPs.setString(5, "Mapping design variables to Tailwind utility classes and theme extensions.");
            lesPs.setString(6, "https://www.youtube.com/embed/ft30zcMlFao");
            lesPs.setString(7, "# Design Token Export\n\nStreamline handoff between design and engineering teams.");
            lesPs.setInt(8, 25);
            lesPs.setInt(9, 2);
            lesPs.setInt(10, 0);
            lesPs.executeUpdate();

            asPs.setString(1, "asg-des-1");
            asPs.setString(2, c5);
            asPs.setString(3, "mod-des-1");
            asPs.setString(4, "Design System Challenge: Button & Card Component Spec");
            asPs.setString(5, "Design a modular card component in Figma with hover, active, and disabled states, and implement it in React with Tailwind.");
            asPs.setString(6, "Submit a Figma link or code repository.");
            asPs.setInt(7, 100);
            asPs.setString(8, "usr-inst-1");
            asPs.executeUpdate();

            conn.commit();
            System.out.println("[JDBC Free Courses] Successfully seeded 5 valuable free courses with modules, lessons, and assignments!");
        } catch (SQLException e) {
            System.err.println("[JDBC Free Courses] Error seeding free courses: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
