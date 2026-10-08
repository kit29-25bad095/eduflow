package com.eduflow.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

/**
 * Ensures EVERY course on the EduFlow LMS platform is fully populated with:
 * - Modules (at least 2 per course)
 * - Lessons with real video embeds, comprehensive markdown notes, and preview status
 * - Assignments with real instructions, rubric, and due dates
 * - Quizzes with realistic multiple-choice questions, options, and passing scores
 */
public class SeedAllCoursesContent {

    public static void seedMissingContent() {
        System.out.println("[CourseSeeder] Checking all courses for complete syllabus content...");
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);

            // 1. Relational Database Systems & SQL Mastery (crs-database-sql)
            seedDatabaseSqlCourse(conn);

            // 2. Generative AI Fundamentals & LLM Applications (crs-genai-llm)
            seedGenAiCourse(conn);

            // 3. Data Science & Practical Analytics with Python (crs-datascience-python)
            seedDataScienceCourse(conn);

            // 4. Enterprise Java & Spring Boot Microservices (crs-java-enterprise)
            seedJavaEnterpriseCourse(conn);

            // 5. Practical Ethical Hacking & Penetration Testing (crs-cyber-sec)
            seedCyberSecurityCourse(conn);

            // 6. Deep Learning & Neural Network Architecture (crs-ai-deeplearn)
            seedDeepLearningCourse(conn);

            // 7. Ensure Quizzes on AWS, Design, and Web Security courses
            seedAuxiliaryCourseQuizzes(conn);

            conn.commit();
            System.out.println("[CourseSeeder] All courses successfully populated with complete syllabus, lessons, assignments & quizzes!");
        } catch (Exception e) {
            System.err.println("[CourseSeeder] Error seeding course content: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static boolean hasModules(Connection conn, String courseId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM modules WHERE course_id = ?")) {
            ps.setString(1, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private static boolean hasAssignments(Connection conn, String courseId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM assignments WHERE course_id = ?")) {
            ps.setString(1, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private static boolean hasQuizzes(Connection conn, String courseId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM quizzes WHERE course_id = ?")) {
            ps.setString(1, courseId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private static void insertModule(Connection conn, String id, String courseId, String title, String desc, int order) throws SQLException {
        String sql = "INSERT OR IGNORE INTO modules (id, course_id, title, description, order_num) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, courseId);
            ps.setString(3, title);
            ps.setString(4, desc);
            ps.setInt(5, order);
            ps.executeUpdate();
        }
    }

    private static void insertLesson(Connection conn, String id, String moduleId, String courseId, String title, String desc, String video, String content, int dur, int order, int isPreview) throws SQLException {
        String sql = "INSERT OR IGNORE INTO lessons (id, module_id, course_id, title, description, video_url, content, duration, order_num, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, moduleId);
            ps.setString(3, courseId);
            ps.setString(4, title);
            ps.setString(5, desc);
            ps.setString(6, video);
            ps.setString(7, content);
            ps.setInt(8, dur);
            ps.setInt(9, order);
            ps.setInt(10, isPreview);
            ps.executeUpdate();
        }
    }

    private static void insertAssignment(Connection conn, String id, String courseId, String moduleId, String title, String desc, String instructions, int maxMarks, String createdBy) throws SQLException {
        String sql = "INSERT OR IGNORE INTO assignments (id, course_id, module_id, title, description, instructions, due_date, max_marks, created_by) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+30 days'), ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, courseId);
            ps.setString(3, moduleId);
            ps.setString(4, title);
            ps.setString(5, desc);
            ps.setString(6, instructions);
            ps.setInt(7, maxMarks);
            ps.setString(8, createdBy);
            ps.executeUpdate();
        }
    }

    private static void insertQuiz(Connection conn, String id, String courseId, String moduleId, String title, String desc, int passing) throws SQLException {
        String sql = "INSERT OR IGNORE INTO quizzes (id, course_id, module_id, title, description, passing_score, order_num) VALUES (?, ?, ?, ?, ?, ?, 1)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, courseId);
            ps.setString(3, moduleId);
            ps.setString(4, title);
            ps.setString(5, desc);
            ps.setInt(6, passing);
            ps.executeUpdate();
        }
    }

    private static void insertQuestion(Connection conn, String id, String quizId, String qText, String optA, String optB, String optC, String optD, String correct, String exp, int order) throws SQLException {
        String sql = "INSERT OR IGNORE INTO quiz_questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, quizId);
            ps.setString(3, qText);
            ps.setString(4, optA);
            ps.setString(5, optB);
            ps.setString(6, optC);
            ps.setString(7, optD);
            ps.setString(8, correct);
            ps.setString(9, exp);
            ps.setInt(10, order);
            ps.executeUpdate();
        }
    }

    // ==============================================================
    // 1. Relational Database Systems & SQL Mastery (crs-database-sql)
    // ==============================================================
    private static void seedDatabaseSqlCourse(Connection conn) throws SQLException {
        String cId = "crs-database-sql";
        if (hasModules(conn, cId)) return;

        // Module 1
        String m1 = "mod-sql-1";
        insertModule(conn, m1, cId, "Module 1: Relational Modeling & Complex SQL Queries", "Entity-relationship diagrams, normalization (1NF-BCNF), aggregations, and subqueries.", 1);
        insertLesson(conn, "les-sql-1", m1, cId, "1.1 Relational Architecture & ACID Transactions", "Core principles of relational storage engines, transaction isolation levels, and WAL logging.", "https://www.youtube.com/embed/HXV3zeRR3h4", "# Relational Foundations\n\nRelational engines guarantee Atomicity, Consistency, Isolation, and Durability (ACID). In this lesson, we study database locks, concurrency control, and MVCC.", 25, 1, 1);
        insertLesson(conn, "les-sql-2", m1, cId, "1.2 Advanced Joins, Aggregations & Window Functions", "Writing optimized multi-table JOINs, GROUP BY HAVING, and analytic window functions (ROW_NUMBER, RANK, DENSE_RANK).", "https://www.youtube.com/embed/7S_tz1z_5bA", "# Advanced SQL Analytics\n\nWindow functions allow computation across rows related to the current query row without collapsing the result set.", 30, 2, 0);

        // Module 2
        String m2 = "mod-sql-2";
        insertModule(conn, m2, cId, "Module 2: Query Optimization, Indexing & Database Tuning", "B-Tree and Hash indexes, EXPLAIN ANALYZE query execution plans, and schema partitioning.", 2);
        insertLesson(conn, "les-sql-3", m2, cId, "2.1 B-Tree Index Mechanics & Execution Plan Analysis", "How relational indexes store sorted pointers, index selectivity, and evaluating EXPLAIN query plans.", "https://www.youtube.com/embed/clhyw_076sI", "# Index Mechanics\n\nUnderstanding how B-Trees organize clustered vs non-clustered indexes to avoid full table scans.", 35, 1, 0);
        insertLesson(conn, "les-sql-4", m2, cId, "2.2 Designing Scalable Normalized Schemas", "Practical 3NF and BCNF normalization, foreign key constraints, and managing database migrations safely.", "https://www.youtube.com/embed/UrYLYV7WSHM", "# Schema Normalization\n\nEliminating data redundancy and update anomalies while balancing read performance.", 25, 2, 0);

        // Assignment
        insertAssignment(conn, "as-sql-1", cId, m2, "Project: E-Commerce Relational Schema Design & Query Optimization", "Design a production-ready relational schema in SQL for an enterprise store handling orders, inventory, and refunds. Write 5 high-performance analytical queries with EXPLAIN plans.", "Submit your complete schema.sql file and query performance analysis document.", 100, "usr-inst-2");

        // Quiz
        String qId = "qz-sql-1";
        insertQuiz(conn, qId, cId, m1, "Relational Databases & SQL Certification Assessment", "Test your knowledge of ACID properties, SQL JOINs, indexes, and transaction isolation.", 70);
        insertQuestion(conn, "q-sql-1", qId, "What does the 'I' in ACID transaction guarantees stand for?", "Integrity", "Isolation", "Iteration", "Indexing", "B", "Isolation ensures transactions execute independently without concurrency side-effects.", 1);
        insertQuestion(conn, "q-sql-2", qId, "Which SQL clause filters records AFTER aggregation has taken place?", "WHERE", "ORDER BY", "HAVING", "LIMIT", "C", "HAVING filters groups created by GROUP BY, whereas WHERE filters rows before aggregation.", 2);
        insertQuestion(conn, "q-sql-3", qId, "Which index data structure is most commonly used for range-based queries in relational databases?", "Hash Table", "B-Tree", "Linked List", "Bloom Filter", "B", "B-Trees keep data sorted and allow logarithmic time for searches, sequential access, and range queries.", 3);
    }

    // ==============================================================
    // 2. Generative AI Fundamentals & LLM Applications (crs-genai-llm)
    // ==============================================================
    private static void seedGenAiCourse(Connection conn) throws SQLException {
        String cId = "crs-genai-llm";
        if (hasModules(conn, cId)) return;

        String m1 = "mod-genai-1";
        insertModule(conn, m1, cId, "Module 1: Large Language Model Architectures & Prompt Engineering", "Transformer self-attention mechanism, tokenization, prompt patterns, and zero-shot/few-shot learning.", 1);
        insertLesson(conn, "les-genai-1", m1, cId, "1.1 The Transformer Architecture & Self-Attention", "How Transformers revolutionized NLP. Understanding encoders, decoders, embeddings, and context windows.", "https://www.youtube.com/embed/zjkBMFhNj_g", "# The Transformer Revolution\n\nAttention Is All You Need introduced self-attention mechanisms that replaced recurrent architectures with parallelizable token processing.", 25, 1, 1);
        insertLesson(conn, "les-genai-2", m1, cId, "1.2 Advanced Prompt Engineering & Few-Shot Learning", "Chain-of-thought, ReAct framework, structured JSON outputs, and system prompt framing.", "https://www.youtube.com/embed/jC4v5AS4RIM", "# Systematic Prompting\n\nPrompt engineering is the software interface of generative models. Learn deterministic output techniques.", 20, 2, 0);

        String m2 = "mod-genai-2";
        insertModule(conn, m2, cId, "Module 2: Retrieval Augmented Generation (RAG) & Vector Databases", "Embedding models, chunking strategies, vector similarity search, and LangChain orchestration.", 2);
        insertLesson(conn, "les-genai-3", m2, cId, "2.1 Vector Embeddings & Similarity Search", "Converting documents to high-dimensional vectors and querying cosine similarity via vector databases.", "https://www.youtube.com/embed/ySus5ZS0b94", "# Embeddings & Retrieval\n\nVector databases enable semantic search by matching concept vectors rather than exact keyword strings.", 30, 1, 0);
        insertLesson(conn, "les-genai-4", m2, cId, "2.2 Building Production RAG Pipelines with LangChain", "Connecting vector retrievers with LLMs, managing conversation history, and hallucination guardrails.", "https://www.youtube.com/embed/LhnCs76uh18", "# Production RAG\n\nImplement dynamic retrieval, query re-writing, and prompt augmentation for ground-truth responses.", 35, 2, 0);

        insertAssignment(conn, "as-genai-1", cId, m2, "Capstone: Build an Intelligent Enterprise Document QA Assistant with RAG", "Create a Python LangChain application that ingests PDF documentation, indexes it into a vector database, and answers user questions with citations.", "Upload your GitHub repository link and architecture diagram document.", 100, "usr-inst-1");

        String qId = "qz-genai-1";
        insertQuiz(conn, qId, cId, m2, "Generative AI & LLM Applications Certification Exam", "Assess your understanding of Transformers, embeddings, vector indexing, and RAG architectures.", 70);
        insertQuestion(conn, "q-genai-1", qId, "What is the primary role of a vector database in a Retrieval-Augmented Generation (RAG) system?", "Compiling Python source code", "Storing semantic embeddings for contextual similarity retrieval", "Fine-tuning base neural network weights", "Compressing audio files", "B", "Vector databases index embeddings so relevant document chunks can be passed into the LLM context prompt.", 1);
        insertQuestion(conn, "q-genai-2", qId, "Which mechanism in the Transformer architecture allows tokens to weigh their relevance against all other tokens?", "Backpropagation through time", "Self-Attention", "Drop-out layer", "Max Pooling", "B", "Self-attention computes dynamic weights between token pairs across the sequence.", 2);
        insertQuestion(conn, "q-genai-3", qId, "What does 'temperature' control in an LLM text generation API call?", "Speed of GPU computation", "Randomness and creativity of token selection", "Maximum context length in tokens", "Network timeout threshold", "B", "Lower temperature (e.g. 0.1) produces deterministic output, while higher temperature (e.g. 0.8) yields more diverse responses.", 3);
    }

    // ==============================================================
    // 3. Data Science & Practical Analytics with Python (crs-datascience-python)
    // ==============================================================
    private static void seedDataScienceCourse(Connection conn) throws SQLException {
        String cId = "crs-datascience-python";
        if (hasModules(conn, cId)) return;

        String m1 = "mod-ds-1";
        insertModule(conn, m1, cId, "Module 1: Exploratory Data Analysis with NumPy & Pandas", "Data wrangling, cleaning missing values, DataFrame filtering, and vectorized numerical computing.", 1);
        insertLesson(conn, "les-ds-1", m1, cId, "1.1 NumPy Vectorized Computation & Array Broadcasting", "Multidimensional arrays, vectorized mathematical operations, and high-performance slicing.", "https://www.youtube.com/embed/QUT1VHiLmmI", "# NumPy Arrays\n\nNumPy accelerates numerical processing in Python by executing contiguous memory C loops.", 25, 1, 1);
        insertLesson(conn, "les-ds-2", m1, cId, "1.2 Pandas Data Wrangling & Feature Transformation", "Handling missing values, grouping, merging, pivot tables, and time-series date indexing.", "https://www.youtube.com/embed/vmEHCJofslg", "# Pandas Data Wrangling\n\nPandas provides high-performance data structures for tabular data transformation.", 30, 2, 0);

        String m2 = "mod-ds-2";
        insertModule(conn, m2, cId, "Module 2: Statistical Modeling & Data Storytelling", "Seaborn visual storytelling, hypothesis testing, correlation analysis, and regression modeling.", 2);
        insertLesson(conn, "les-ds-3", m2, cId, "2.1 Statistical Data Visualization with Matplotlib & Seaborn", "Distribution plots, heatmaps, pairplots, and publishing executive dashboards.", "https://www.youtube.com/embed/a9UrKTVEeZA", "# Data Visualization\n\nVisual communication is crucial for uncovering data anomalies and conveying business insights.", 25, 1, 0);
        insertLesson(conn, "les-ds-4", m2, cId, "2.2 Hypothesis Testing & Feature Selection", "P-values, confidence intervals, A/B testing analysis, and multicollinearity diagnostics.", "https://www.youtube.com/embed/0Pd3dc1GcHc", "# Applied Statistics\n\nMaster parametric and non-parametric tests to make statistically sound business conclusions.", 30, 2, 0);

        insertAssignment(conn, "as-ds-1", cId, m2, "Project: Real-World Customer Churn Predictive Analysis", "Perform an end-to-end exploratory data analysis on a 50,000-record dataset. Identify key attrition drivers and build visual charts.", "Submit your clean Jupyter Notebook (.ipynb) or PDF analysis report.", 100, "usr-inst-1");

        String qId = "qz-ds-1";
        insertQuiz(conn, qId, cId, m1, "Data Science Foundations Assessment", "Test your core knowledge of NumPy arrays, Pandas DataFrames, and statistical distributions.", 70);
        insertQuestion(conn, "q-ds-1", qId, "In Pandas, which method returns summary statistics (mean, std, min, max, quartiles) for numeric columns?", "df.head()", "df.describe()", "df.info()", "df.corr()", "B", "df.describe() generates comprehensive descriptive statistics for numeric Series/DataFrames.", 1);
        insertQuestion(conn, "q-ds-2", qId, "What is the primary difference between a NumPy array and a standard Python list?", "Python lists cannot contain strings", "NumPy arrays enforce homogeneous data types enabling vectorized C-level execution", "NumPy arrays are always slower than Python lists", "There is no difference", "B", "NumPy arrays hold contiguous blocks of memory of a single data type, making operations orders of magnitude faster.", 2);
        insertQuestion(conn, "q-ds-3", qId, "What does a Pearson correlation coefficient of -0.9 between two variables indicate?", "No linear relationship", "A weak negative relationship", "A strong inverse linear relationship", "Calculation error", "C", "Values near -1 indicate that as one variable increases, the other decreases in a strong linear fashion.", 3);
    }

    // ==============================================================
    // 4. Enterprise Java & Spring Boot Microservices (crs-java-enterprise)
    // ==============================================================
    private static void seedJavaEnterpriseCourse(Connection conn) throws SQLException {
        String cId = "crs-java-enterprise";
        if (hasModules(conn, cId)) return;

        String m1 = "mod-java-1";
        insertModule(conn, m1, cId, "Module 1: Modern Java 21 & Object-Oriented Design Patterns", "Records, pattern matching, Virtual Threads (Project Loom), and clean SOLID architecture.", 1);
        insertLesson(conn, "les-java-1", m1, cId, "1.1 Java 21 LTS Features & Virtual Threads", "High-throughput concurrency with Virtual Threads, structured concurrency, and sealed classes.", "https://www.youtube.com/embed/5d_48fP7VpQ", "# Java 21 LTS Innovations\n\nVirtual threads decoupled Java threads from OS threads, allowing millions of concurrent lightweight tasks.", 30, 1, 1);
        insertLesson(conn, "les-java-2", m1, cId, "1.2 Clean Architecture, Dependency Injection & JDBC", "Writing enterprise code with interfaces, DAOs, Connection pooling, and transaction safety.", "https://www.youtube.com/embed/40XH_V6zWjA", "# Enterprise Architecture\n\nClean separation of presentation, business services, and database persistence layers.", 35, 2, 0);

        String m2 = "mod-java-2";
        insertModule(conn, m2, cId, "Module 2: Building Scalable REST APIs & Microservices", "Spring Boot 3 / embedded HTTP servers, JWT security filters, Docker containerization, and unit testing.", 2);
        insertLesson(conn, "les-java-3", m2, cId, "2.1 RESTful API Controllers & Validation", "Building HTTP endpoints, parsing JSON payloads, handling exceptions, and status code standards.", "https://www.youtube.com/embed/9SGDpanrc8U", "# RESTful API Design\n\nHandling incoming requests, validating input boundaries, and serializing typed Java domain responses.", 30, 1, 0);
        insertLesson(conn, "les-java-4", m2, cId, "2.2 Microservices Security: JWT Auth & Interceptors", "Stateless authentication, signing claims with HMAC-SHA256, and interceptor authorization.", "https://www.youtube.com/embed/bv4N_V2Wv_8", "# API Security\n\nSecuring distributed microservice endpoints using JSON Web Tokens and role-based access control.", 35, 2, 0);

        insertAssignment(conn, "as-java-1", cId, m2, "Capstone: Build a Scalable Microservices API with Relational Persistence", "Implement a complete Java service featuring authentication, CRUD operations, database connection pooling, and JUnit 5 test coverage.", "Upload your source code zip or GitHub repository URL.", 100, "usr-inst-2");

        String qId = "qz-java-1";
        insertQuiz(conn, qId, cId, m1, "Enterprise Java Architecture Certification Exam", "Verify your grasp of Java 21 concurrency, SOLID design, JDBC transactions, and microservices patterns.", 70);
        insertQuestion(conn, "q-java-1", qId, "What major benefit do Virtual Threads in Java 21 provide?", "They replace CPU caches", "They allow massive concurrent I/O throughput without exhausting operating system thread pools", "They eliminate the need for garbage collection", "They make Java code compile directly to JavaScript", "B", "Virtual Threads are lightweight threads managed by the JVM rather than the OS kernel.", 1);
        insertQuestion(conn, "q-java-2", qId, "In JDBC, which method must be called to ensure multiple statements execute as a single atomic unit?", "conn.setAutoCommit(false); followed by conn.commit();", "conn.close();", "stmt.executeBatch(); only", "conn.rollback(); before every query", "A", "Disabling auto-commit allows grouping multiple SQL statements into a single transactional boundary.", 2);
        insertQuestion(conn, "q-java-3", qId, "Which principle of SOLID design states that software entities should be open for extension, but closed for modification?", "Single Responsibility Principle", "Open/Closed Principle", "Liskov Substitution Principle", "Interface Segregation Principle", "B", "The Open/Closed Principle encourages extending behavior through interfaces and polymorphism without rewriting existing tested code.", 3);
    }

    // ==============================================================
    // 5. Practical Ethical Hacking & Penetration Testing (crs-cyber-sec)
    // ==============================================================
    private static void seedCyberSecurityCourse(Connection conn) throws SQLException {
        String cId = "crs-cyber-sec";
        if (hasModules(conn, cId)) return;

        String m1 = "mod-cyber-1";
        insertModule(conn, m1, cId, "Module 1: Network Reconnaissance & Vulnerability Scanning", "OSINT, port scanning with Nmap, Wireshark packet inspection, and service fingerprinting.", 1);
        insertLesson(conn, "les-cyber-1", m1, cId, "1.1 Reconnaissance Methodologies & Network Mapping with Nmap", "Discovering live hosts, SYN stealth scanning, service detection, and OS fingerprinting.", "https://www.youtube.com/embed/4t4kBkMsDbQ", "# Network Reconnaissance\n\nReconnaissance is the initial phase of security assessment. Learn how TCP handshakes work during port scanning.", 30, 1, 1);
        insertLesson(conn, "les-cyber-2", m1, cId, "1.2 Packet Analysis with Wireshark", "Capturing traffic, analyzing TCP streams, identifying plaintext protocol credentials, and TLS handshakes.", "https://www.youtube.com/embed/lb1Dw0elVQ0", "# Wireshark Packet Inspection\n\nDeep-dive into network frames to detect data exfiltration and analyze suspicious payloads.", 25, 2, 0);

        String m2 = "mod-cyber-2";
        insertModule(conn, m2, cId, "Module 2: Web Application Security & Exploit Remediation", "Cross-Site Scripting (XSS), SQL Injection (SQLi), CSRF defenses, and secure code audits.", 2);
        insertLesson(conn, "les-cyber-3", m2, cId, "2.1 Exploiting & Defending Against SQL Injection", "In-band, blind, and error-based SQLi mechanics, and implementing PreparedStatements with parameter binding.", "https://www.youtube.com/embed/2nXOXpknq3E", "# SQL Injection Defense\n\nUnderstand why string concatenation causes SQL injection and how parameterized queries completely mitigate it.", 30, 1, 0);
        insertLesson(conn, "les-cyber-4", m2, cId, "2.2 Cross-Site Scripting (XSS) & Content Security Policy (CSP)", "Stored, Reflected, and DOM-based XSS attacks, output encoding, and configuring strict HTTP CSP headers.", "https://www.youtube.com/embed/g_rPnu5mQeE", "# Modern XSS Mitigations\n\nSecure client-side rendering by validating user inputs and configuring robust HTTP response headers.", 25, 2, 0);

        insertAssignment(conn, "as-cyber-1", cId, m2, "Security Audit: Vulnerability Assessment & Hardening Report", "Perform a simulated security audit on a vulnerable web application lab. Document found vulnerabilities, risk severity ratings (CVSS), and concrete remediation steps.", "Upload your professional Executive Penetration Testing Report (PDF).", 100, "usr-inst-3");

        String qId = "qz-cyber-1";
        insertQuiz(conn, qId, cId, m1, "Offensive Security & Network Defense Certification Exam", "Test your knowledge of TCP/IP handshakes, Nmap flags, injection vulnerabilities, and defense-in-depth.", 70);
        insertQuestion(conn, "q-cyber-1", qId, "What is the most effective and reliable defense against SQL Injection vulnerabilities?", "Blacklisting SQL keywords like SELECT and UNION", "Using Parameterized Queries (PreparedStatements)", "Limiting query string length to 50 characters", "Encrypting database passwords with MD5", "B", "PreparedStatements treat user input strictly as data parameters, preventing malicious code execution.", 1);
        insertQuestion(conn, "q-cyber-2", qId, "What does the -sS flag represent in an Nmap command?", "TCP SYN Stealth scan", "Slow scan", "Skip ping", "Subnet broadcast scan", "A", "The -sS flag initiates a SYN scan, sending a SYN packet and analyzing the response without establishing a full TCP connection.", 2);
        insertQuestion(conn, "q-cyber-3", qId, "Which HTTP header instructs browsers to restrict where scripts, stylesheets, and fonts can be loaded from?", "X-Frame-Options", "Content-Security-Policy", "Access-Control-Allow-Origin", "Strict-Transport-Security", "B", "Content-Security-Policy (CSP) prevents unauthorized scripts from executing, mitigating Cross-Site Scripting (XSS).", 3);
    }

    // ==============================================================
    // 6. Deep Learning & Neural Network Architecture (crs-ai-deeplearn)
    // ==============================================================
    private static void seedDeepLearningCourse(Connection conn) throws SQLException {
        String cId = "crs-ai-deeplearn";
        if (hasAssignments(conn, cId) && hasQuizzes(conn, cId)) return;

        // Ensure module exists
        String mId = "mod-ai-1";
        insertModule(conn, mId, cId, "Module 1: Deep Neural Networks & PyTorch Fundamentals", "Tensors, autograd, backpropagation, and loss optimization with gradient descent.", 1);
        insertLesson(conn, "les-ai-2", mId, cId, "1.2 Backpropagation Mechanics & Gradient Descent", "Deriving partial derivatives, learning rate scheduling, and Adam optimizer dynamics.", "https://www.youtube.com/embed/Ilg3gGewQ5U", "# Backpropagation Mathematical Foundations\n\nGradient descent navigates high-dimensional loss surfaces by computing Jacobians and parameter updates.", 30, 2, 0);

        String m2 = "mod-ai-2";
        insertModule(conn, m2, cId, "Module 2: Convolutional & Recurrent Networks", "Computer vision with CNNs, pooling layers, ResNet skip connections, and sequence models.", 2);
        insertLesson(conn, "les-ai-3", m2, cId, "2.1 Convolutional Neural Networks (CNNs) for Computer Vision", "Kernels, feature maps, stride, and hierarchical visual representation learning.", "https://www.youtube.com/embed/aircAruvnKk", "# Convolutional Filters\n\nLearn how spatial invariance enables CNNs to detect edges, textures, and semantic shapes.", 35, 1, 0);

        if (!hasAssignments(conn, cId)) {
            insertAssignment(conn, "as-ai-1", cId, m2, "Capstone Project: Image Classification with PyTorch & Transfer Learning", "Train a deep neural network using PyTorch on a custom dataset. Implement data augmentation, fine-tune a pre-trained ResNet model, and achieve >= 92% validation accuracy.", "Submit your training notebook and validation metrics report.", 100, "usr-inst-1");
        }

        if (!hasQuizzes(conn, cId)) {
            String qId = "qz-ai-1";
            insertQuiz(conn, qId, cId, mId, "Deep Learning & PyTorch Certification Exam", "Assess your understanding of tensors, backpropagation, activation functions, and optimizers.", 70);
            insertQuestion(conn, "q-ai-1", qId, "Why is the ReLU activation function commonly preferred over Sigmoid in hidden layers of deep networks?", "ReLU produces negative outputs", "ReLU avoids the vanishing gradient problem for positive inputs and computes faster", "ReLU normalizes values between 0 and 1", "ReLU is non-differentiable everywhere", "B", "ReLU has a constant derivative of 1 for positive inputs, avoiding gradient saturation.", 1);
            insertQuestion(conn, "q-ai-2", qId, "What is the purpose of Dropout in a deep neural network?", "To increase training speed", "To prevent overfitting by randomly deactivating neurons during training", "To compute gradients faster", "To calculate learning rate", "B", "Dropout breaks co-adaptation between neurons by randomly dropping units during forward passes.", 2);
            insertQuestion(conn, "q-ai-3", qId, "In PyTorch, which method computes the gradients of tensors with requires_grad=True?", "tensor.forward()", "loss.backward()", "optimizer.step()", "tensor.detach()", "B", "loss.backward() calculates the gradients of the loss with respect to all graph leaves.", 3);
        }
    }

    // ==============================================================
    // 7. Auxiliary Course Quizzes (AWS, Design, Web Security)
    // ==============================================================
    private static void seedAuxiliaryCourseQuizzes(Connection conn) throws SQLException {
        // crs-free-aws
        String awsId = "crs-free-aws";
        if (!hasQuizzes(conn, awsId)) {
            String qId = "qz-aws-1";
            insertQuiz(conn, qId, awsId, "mod-aws-1", "AWS Cloud Architecture Certification Quiz", "Validate your understanding of AWS compute, storage, networking, and security primitives.", 70);
            insertQuestion(conn, "q-aws-1", qId, "Which AWS service provides scalable object storage with 99.999999999% durability?", "Amazon EC2", "Amazon S3", "Amazon EBS", "Amazon RDS", "B", "Amazon Simple Storage Service (S3) provides highly durable, scalable object storage.", 1);
            insertQuestion(conn, "q-aws-2", qId, "What does AWS IAM stand for?", "Internet Access Management", "Identity and Access Management", "Integrated Application Monitoring", "Internal Asset Manager", "B", "IAM allows you to securely manage identities and access permissions across AWS resources.", 2);
        }

        // crs-free-design
        String desId = "crs-free-design";
        if (!hasQuizzes(conn, desId)) {
            String qId = "qz-des-1";
            insertQuiz(conn, qId, desId, "mod-des-1", "Design Systems & UI/UX Principles Quiz", "Verify your knowledge of design tokens, Figma auto-layout, and accessibility contrast standards.", 70);
            insertQuestion(conn, "q-des-1", qId, "According to WCAG 2.1 AA standards, what is the minimum contrast ratio required for normal body text?", "2:1", "3:1", "4.5:1", "7:1", "C", "WCAG AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.", 1);
            insertQuestion(conn, "q-des-2", qId, "What is a 'Design Token' in a design system?", "A cryptocurrency used to purchase icons", "A named entity that stores visual design attributes like colors, spacing, and typography", "A Figma plugin license", "A responsive breakpoint", "B", "Design tokens are the atomic visual atoms of a design system used across Figma and code.", 2);
        }

        // crs-free-security
        String secId = "crs-free-security";
        if (!hasQuizzes(conn, secId)) {
            String qId = "qz-sec-1";
            insertQuiz(conn, qId, secId, "mod-sec-1", "Web Security Defense & OWASP Top 10 Quiz", "Test your understanding of injection, broken access control, and cryptographic failures.", 70);
            insertQuestion(conn, "q-sec-1", qId, "Which vulnerability regularly tops the OWASP Top 10 list?", "Broken Access Control", "Buffer Overflow", "Password Guessing", "DNS Poisoning", "A", "Broken Access Control is the most prevalent risk in modern web applications.", 1);
            insertQuestion(conn, "q-sec-2", qId, "What flag should be set on session cookies to prevent them from being accessed via client-side JavaScript?", "Secure", "HttpOnly", "SameSite", "Path", "B", "The HttpOnly flag blocks access to cookies via document.cookie, mitigating session theft via XSS.", 2);
        }
    }
}
