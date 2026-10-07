package com.eduflow.database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Manages JDBC Database Connection and Schema Initialization.
 */
public class DatabaseManager {
    private static final String DB_DIR = "data";
    private static final String DB_FILE = DB_DIR + "/lms_jdbc.db";
    private static final String JDBC_URL = "jdbc:sqlite:" + DB_FILE;

    static {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.err.println("[JDBC] SQLite JDBC Driver not found: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        File dir = new File(DB_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        Connection conn = DriverManager.getConnection(JDBC_URL);
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA foreign_keys = ON;");
            stmt.execute("PRAGMA journal_mode = WAL;");
        }
        return conn;
    }

    public static void initializeDatabase() {
        System.out.println("[JDBC] Initializing relational schema via JDBC...");
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            // 1. Users Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT,
                    google_id TEXT DEFAULT '',
                    profile_image TEXT DEFAULT '',
                    auth_provider TEXT DEFAULT 'LOCAL',
                    bio TEXT DEFAULT '',
                    skills TEXT DEFAULT '',
                    role TEXT NOT NULL DEFAULT 'student',
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            // Migration safeguards for existing databases
            try { stmt.execute("ALTER TABLE users ADD COLUMN google_id TEXT DEFAULT '';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'LOCAL';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP;"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN degree TEXT DEFAULT '';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN specialization TEXT DEFAULT '';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN institution TEXT DEFAULT '';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN course_interests TEXT DEFAULT '';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN learning_goals TEXT DEFAULT '';"); } catch (SQLException ignored) {}
            try { stmt.execute("ALTER TABLE users ADD COLUMN profile_completed INTEGER DEFAULT 0;"); } catch (SQLException ignored) {}

            // 2. Courses Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS courses (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    description TEXT NOT NULL,
                    short_description TEXT DEFAULT '',
                    thumbnail TEXT DEFAULT '',
                    category TEXT NOT NULL,
                    level TEXT DEFAULT 'All Levels',
                    language TEXT DEFAULT 'English',
                    price REAL DEFAULT 0.0,
                    instructor_id TEXT NOT NULL,
                    duration TEXT DEFAULT '10 hours',
                    skills TEXT DEFAULT '',
                    requirements TEXT DEFAULT '',
                    status TEXT DEFAULT 'draft',
                    rating_avg REAL DEFAULT 0.0,
                    rating_count INTEGER DEFAULT 0,
                    enrolled_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            try { stmt.execute("ALTER TABLE courses ADD COLUMN tags TEXT DEFAULT '';"); } catch (SQLException ignored) {}

            // 3. Modules Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS modules (
                    id TEXT PRIMARY KEY,
                    course_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    order_num INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            // 4. Lessons Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS lessons (
                    id TEXT PRIMARY KEY,
                    module_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    video_url TEXT DEFAULT '',
                    content TEXT DEFAULT '',
                    duration INTEGER DEFAULT 10,
                    order_num INTEGER DEFAULT 0,
                    is_preview INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            try { stmt.execute("ALTER TABLE lessons ADD COLUMN resources TEXT DEFAULT '';"); } catch (SQLException ignored) {}

            // 5. Enrollments Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS enrollments (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, course_id),
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            // 6. Lesson Progress Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS lesson_progress (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    lesson_id TEXT NOT NULL,
                    completed INTEGER DEFAULT 0,
                    completed_at TIMESTAMP,
                    time_spent INTEGER DEFAULT 0,
                    UNIQUE(student_id, lesson_id),
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
                );
            """);

            // 7. Assignments Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS assignments (
                    id TEXT PRIMARY KEY,
                    course_id TEXT NOT NULL,
                    module_id TEXT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    instructions TEXT DEFAULT '',
                    due_date TIMESTAMP,
                    max_marks INTEGER DEFAULT 100,
                    created_by TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            // 8. Submissions Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS submissions (
                    id TEXT PRIMARY KEY,
                    assignment_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'submitted',
                    marks REAL,
                    feedback TEXT DEFAULT '',
                    graded_by TEXT,
                    graded_at TIMESTAMP,
                    UNIQUE(assignment_id, student_id),
                    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            // 9. Notifications Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    recipient_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            // 10. Reviews Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS reviews (
                    id TEXT PRIMARY KEY,
                    course_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    comment TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(course_id, student_id),
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            // 11. Payments Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    currency TEXT DEFAULT 'USD',
                    payment_method TEXT DEFAULT 'credit_card',
                    transaction_id TEXT UNIQUE NOT NULL,
                    status TEXT DEFAULT 'completed',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            // 12. Certificates Table (Automatic Generation)
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS certificates (
                    id TEXT PRIMARY KEY,
                    certificate_id TEXT UNIQUE NOT NULL,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    course_name TEXT NOT NULL,
                    student_name TEXT NOT NULL,
                    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    certificate_url TEXT DEFAULT '',
                    verification_code TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, course_id),
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            try { stmt.execute("ALTER TABLE lessons ADD COLUMN resources TEXT DEFAULT '';"); } catch (SQLException ignored) {}

            // 13. Wishlist Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS wishlist (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, course_id),
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            // 14. Quizzes Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS quizzes (
                    id TEXT PRIMARY KEY,
                    course_id TEXT NOT NULL,
                    module_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    passing_score INTEGER DEFAULT 70,
                    order_num INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
                );
            """);

            // 15. Quiz Questions Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS quiz_questions (
                    id TEXT PRIMARY KEY,
                    quiz_id TEXT NOT NULL,
                    question_text TEXT NOT NULL,
                    option_a TEXT NOT NULL,
                    option_b TEXT NOT NULL,
                    option_c TEXT NOT NULL,
                    option_d TEXT NOT NULL,
                    correct_option TEXT NOT NULL,
                    explanation TEXT DEFAULT '',
                    order_num INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
                );
            """);

            // 16. Quiz Attempts Table
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS quiz_attempts (
                    id TEXT PRIMARY KEY,
                    quiz_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    course_id TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    total_questions INTEGER NOT NULL,
                    percentage INTEGER NOT NULL,
                    passed INTEGER NOT NULL,
                    answers_json TEXT DEFAULT '',
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            // 17. Abuse Reports Table (Instructor moderation & reporting to Admin)
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS abuse_reports (
                    id TEXT PRIMARY KEY,
                    review_id TEXT,
                    course_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    instructor_id TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    comment_snippet TEXT DEFAULT '',
                    status TEXT DEFAULT 'pending',
                    admin_notes TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                );
            """);

            populateCourseTagsAndCatalog(conn);
            seedQuizzesAndResources(conn);

            System.out.println("[JDBC] Schema initialization successful on " + JDBC_URL);
        } catch (SQLException e) {
            System.err.println("[JDBC] Schema initialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void populateCourseTagsAndCatalog(Connection conn) {
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("UPDATE courses SET tags = 'Python, Programming, Automation, Data Science, Scripting' WHERE id = 'crs-free-python' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'AI, Machine Learning, Python, Data Science, Scikit-Learn, ML' WHERE id = 'crs-free-ml' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'Cloud Computing, AWS, Cloud, Architecture, DevOps' WHERE id = 'crs-free-aws' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'Cybersecurity, Web Security, OWASP, AppSec, Security' WHERE id = 'crs-free-security' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'Design, UI/UX, Figma, Tailwind CSS, Frontend' WHERE id = 'crs-free-design' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'Web Development, React, Node.js, JavaScript, Full Stack, Frontend' WHERE id = 'crs-react-pro' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'AI, Artificial Intelligence, Deep Learning, Machine Learning, PyTorch, Neural Networks' WHERE id = 'crs-ai-deeplearn' AND (tags IS NULL OR tags = '');");
            stmt.execute("UPDATE courses SET tags = 'Cybersecurity, Penetration Testing, Ethical Hacking, Linux, Security' WHERE id = 'crs-cyber-sec' AND (tags IS NULL OR tags = '');");
        } catch (SQLException ignored) {}

        String insertExtraSql = """
            INSERT OR IGNORE INTO courses (id, title, slug, description, short_description, thumbnail, category, level, language, price, instructor_id, duration, skills, requirements, status, rating_avg, rating_count, enrolled_count, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'English', 0.0, 'usr-inst-2', ?, ?, ?, 'published', ?, ?, ?, ?);
        """;

        try (PreparedStatement ps = conn.prepareStatement(insertExtraSql)) {
            // 1. Enterprise Java
            ps.setString(1, "crs-java-enterprise");
            ps.setString(2, "Enterprise Java & Spring Boot Microservices");
            ps.setString(3, "enterprise-java-spring-boot-microservices");
            ps.setString(4, "Build robust, cloud-native enterprise microservices using Java 21, Spring Boot 3, Spring Data JPA, and RESTful architectures.");
            ps.setString(5, "Master enterprise Java development, Spring Boot, microservices, and JPA relational persistence.");
            ps.setString(6, "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80");
            ps.setString(7, "Web Development");
            ps.setString(8, "Intermediate");
            ps.setString(9, "15 hours");
            ps.setString(10, "Java, Spring Boot, Microservices, REST APIs, Hibernate, Maven, Database Systems");
            ps.setString(11, "Basic Java syntax knowledge");
            ps.setDouble(12, 4.9);
            ps.setInt(13, 86);
            ps.setInt(14, 1120);
            ps.setString(15, "Java, Web Development, Backend, Spring Boot, Microservices, Database Systems");
            ps.executeUpdate();

            // 2. Database Systems & SQL
            ps.setString(1, "crs-database-sql");
            ps.setString(2, "Relational Database Systems & SQL Mastery");
            ps.setString(3, "relational-database-systems-sql-mastery");
            ps.setString(4, "Comprehensive mastery of database normalization, relational algebra, SQL optimization, indexing strategies, and transactional ACID guarantees.");
            ps.setString(5, "Master relational schema architecture, advanced SQL joins, indexing, and query tuning.");
            ps.setString(6, "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80");
            ps.setString(7, "Database Systems");
            ps.setString(8, "Beginner");
            ps.setString(9, "11 hours");
            ps.setString(10, "SQL, Database Systems, PostgreSQL, Indexing, Transactions, Relational Schema");
            ps.setString(11, "No prior database experience required");
            ps.setDouble(12, 4.8);
            ps.setInt(13, 74);
            ps.setInt(14, 980);
            ps.setString(15, "Database Systems, SQL, Database, Backend, Data Science, Web Development");
            ps.executeUpdate();

            // 3. Generative AI
            ps.setString(1, "crs-genai-llm");
            ps.setString(2, "Generative AI Fundamentals & LLM Applications");
            ps.setString(3, "generative-ai-fundamentals-llm-applications");
            ps.setString(4, "Architect, fine-tune, and deploy generative AI solutions. Master prompt engineering, LangChain, vector databases (RAG), and OpenAI API integrations with Python.");
            ps.setString(5, "Build production-grade GenAI apps with Python, LangChain, RAG, and vector databases.");
            ps.setString(6, "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80");
            ps.setString(7, "Artificial Intelligence");
            ps.setString(8, "Intermediate");
            ps.setString(9, "13 hours");
            ps.setString(10, "Generative AI, Python, LLMs, LangChain, Prompt Engineering, Vector Databases");
            ps.setString(11, "Python programming fundamentals");
            ps.setDouble(12, 4.9);
            ps.setInt(13, 112);
            ps.setInt(14, 1540);
            ps.setString(15, "Generative AI, AI, Artificial Intelligence, Machine Learning, Python, Data Science");
            ps.executeUpdate();

            // 4. Data Science with Python
            ps.setString(1, "crs-datascience-python");
            ps.setString(2, "Data Science & Practical Analytics with Python");
            ps.setString(3, "data-science-practical-analytics-with-python");
            ps.setString(4, "Transform raw datasets into actionable intelligence. Hands-on exploratory analysis, statistical testing, Matplotlib/Seaborn visualization, and Pandas manipulation.");
            ps.setString(5, "Analyze complex datasets and extract business insights using Python and Pandas.");
            ps.setString(6, "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80");
            ps.setString(7, "Data Science");
            ps.setString(8, "Beginner");
            ps.setString(9, "14 hours");
            ps.setString(10, "Data Science, Python, Pandas, NumPy, Data Visualization, Analytics, Statistics");
            ps.setString(11, "Basic programming familiarity");
            ps.setDouble(12, 4.8);
            ps.setInt(13, 93);
            ps.setInt(14, 1310);
            ps.setString(15, "Data Science, Python, Machine Learning, AI, Analytics, Statistics");
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[JDBC] Extra course seed error: " + e.getMessage());
        }
    }

    private static void seedQuizzesAndResources(Connection conn) {
        try {
            // Update lesson resources if empty
            String resJson = """
                [{"title":"Lecture Reference Slides & Notes (PDF)","url":"https://arxiv.org/pdf/1706.03762","type":"pdf"},{"title":"GitHub Practice Repository & Code Samples","url":"https://github.com/torvalds/linux","type":"code"},{"title":"Official Documentation Reference","url":"https://docs.python.org/3/","type":"link"}]
            """;
            try (PreparedStatement ps = conn.prepareStatement("UPDATE lessons SET resources = ? WHERE resources IS NULL OR resources = ''")) {
                ps.setString(1, resJson.trim());
                ps.executeUpdate();
            }

            // Check if quizzes already seeded
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM quizzes")) {
                if (rs.next() && rs.getInt(1) >= 3) {
                    return; // already seeded
                }
            }

            String quizSql = "INSERT OR IGNORE INTO quizzes (id, course_id, module_id, title, description, passing_score, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)";
            String qSql = "INSERT OR IGNORE INTO quiz_questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (PreparedStatement qzPs = conn.prepareStatement(quizSql);
                 PreparedStatement qPs = conn.prepareStatement(qSql)) {

                // Quiz 1: ML Foundations
                String qz1Id = "qz-ml-1";
                qzPs.setString(1, qz1Id);
                qzPs.setString(2, "crs-free-ml");
                qzPs.setString(3, "mod-ml-1");
                qzPs.setString(4, "Machine Learning Workflow & Validation Quiz");
                qzPs.setString(5, "Test your understanding of supervised learning, regression, and cross-validation.");
                qzPs.setInt(6, 70);
                qzPs.setInt(7, 1);
                qzPs.executeUpdate();

                // Questions for Quiz 1
                qPs.setString(1, "q-ml-1-1");
                qPs.setString(2, qz1Id);
                qPs.setString(3, "Which evaluation metric is most appropriate for assessing an imbalanced binary classification model?");
                qPs.setString(4, "Accuracy");
                qPs.setString(5, "F1-Score / Area Under ROC Curve (ROC-AUC)");
                qPs.setString(6, "Mean Absolute Error");
                qPs.setString(7, "R-Squared");
                qPs.setString(8, "B");
                qPs.setString(9, "When classes are heavily skewed, accuracy is misleading; F1-Score balances precision and recall.");
                qPs.setInt(10, 1);
                qPs.executeUpdate();

                qPs.setString(1, "q-ml-1-2");
                qPs.setString(2, qz1Id);
                qPs.setString(3, "In linear regression, what role does the objective loss function play during training?");
                qPs.setString(4, "It normalizes feature scale distributions.");
                qPs.setString(5, "It quantifies the residual discrepancy between predicted and ground-truth target values.");
                qPs.setString(6, "It performs principal component extraction.");
                qPs.setString(7, "It encodes categorical labels.");
                qPs.setString(8, "B");
                qPs.setString(9, "The loss function computes error (MSE) which optimization algorithms minimize.");
                qPs.setInt(10, 2);
                qPs.executeUpdate();

                qPs.setString(1, "q-ml-1-3");
                qPs.setString(2, qz1Id);
                qPs.setString(3, "What is the primary danger of training without a dedicated validation or test split?");
                qPs.setString(4, "Underfitting");
                qPs.setString(5, "Overfitting to training noise and lack of generalizability");
                qPs.setString(6, "Gradient explosion in linear models");
                qPs.setString(7, "Memory fragmentation in NumPy");
                qPs.setString(8, "B");
                qPs.setString(9, "Models evaluated only on training data cannot reveal over-parameterized overfitting.");
                qPs.setInt(10, 3);
                qPs.executeUpdate();

                // Quiz 2: Python Foundations
                String qz2Id = "qz-py-1";
                qzPs.setString(1, qz2Id);
                qzPs.setString(2, "crs-free-python");
                qzPs.setString(3, "mod-py-1");
                qzPs.setString(4, "Python Core Syntax & Data Structures Quiz");
                qzPs.setString(5, "Verify core Python concepts, mutability, and error handling mechanisms.");
                qzPs.setInt(6, 70);
                qzPs.setInt(7, 1);
                qzPs.executeUpdate();

                qPs.setString(1, "q-py-1-1");
                qPs.setString(2, qz2Id);
                qPs.setString(3, "Which of the following built-in collection types in Python is mutable?");
                qPs.setString(4, "tuple");
                qPs.setString(5, "list");
                qPs.setString(6, "str");
                qPs.setString(7, "frozenset");
                qPs.setString(8, "B");
                qPs.setString(9, "Python lists are mutable sequence types allowing item assignment and appending.");
                qPs.setInt(10, 1);
                qPs.executeUpdate();

                qPs.setString(1, "q-py-1-2");
                qPs.setString(2, qz2Id);
                qPs.setString(3, "What does the Python 'is' operator evaluate?");
                qPs.setString(4, "Value equality (equivalent to ==)");
                qPs.setString(5, "Memory identity (whether two references point to the exact same object in RAM)");
                qPs.setString(6, "Type equivalence only");
                qPs.setString(7, "Subclass hierarchy");
                qPs.setString(8, "B");
                qPs.setString(9, "'is' compares memory addresses (id()), whereas '==' compares equality of content.");
                qPs.setInt(10, 2);
                qPs.executeUpdate();

                qPs.setString(1, "q-py-1-3");
                qPs.setString(2, qz2Id);
                qPs.setString(3, "Which block in a try-except statement is guaranteed to run regardless of exception occurrence?");
                qPs.setString(4, "catch");
                qPs.setString(5, "finally");
                qPs.setString(6, "else");
                qPs.setString(7, "ensure");
                qPs.setString(8, "B");
                qPs.setString(9, "The 'finally' clause is always executed prior to exiting the try statement.");
                qPs.setInt(10, 3);
                qPs.executeUpdate();

                // Quiz 3: React Full-Stack
                String qz3Id = "qz-react-1";
                qzPs.setString(1, qz3Id);
                qzPs.setString(2, "crs-react-pro");
                qzPs.setString(3, "mod-c1-1");
                qzPs.setString(4, "Modern React & Component Lifecycle Quiz");
                qzPs.setString(5, "Assess your proficiency with React 18 hooks, rendering rules, and RESTful communication.");
                qzPs.setInt(6, 70);
                qzPs.setInt(7, 1);
                qzPs.executeUpdate();

                qPs.setString(1, "q-react-1-1");
                qPs.setString(2, qz3Id);
                qPs.setString(3, "When does React execute the cleanup return function of a useEffect hook?");
                qPs.setString(4, "Only on initial component mount");
                qPs.setString(5, "Before the component unmounts and before re-running the effect on dependency change");
                qPs.setString(6, "On every microtask tick");
                qPs.setString(7, "Never automatically");
                qPs.setString(8, "B");
                qPs.setString(9, "The cleanup function cleans up prior effects (subscriptions, timers) before the next run or unmount.");
                qPs.setInt(10, 1);
                qPs.executeUpdate();

                qPs.setString(1, "q-react-1-2");
                qPs.setString(2, qz3Id);
                qPs.setString(3, "Which React hook is designed specifically to memoize heavy computational results between re-renders?");
                qPs.setString(4, "useCallback");
                qPs.setString(5, "useMemo");
                qPs.setString(6, "useRef");
                qPs.setString(7, "useReducer");
                qPs.setString(8, "B");
                qPs.setString(9, "useMemo memoizes values, while useCallback memoizes function definitions.");
                qPs.setInt(10, 2);
                qPs.executeUpdate();

                qPs.setString(1, "q-react-1-3");
                qPs.setString(2, qz3Id);
                qPs.setString(3, "Why should React state never be mutated directly (e.g., state.property = value)?");
                qPs.setString(4, "JavaScript throws a syntax error");
                qPs.setString(5, "React relies on shallow reference comparison to detect state changes and schedule re-renders");
                qPs.setString(6, "It deletes localStorage");
                qPs.setString(7, "It causes server timeouts");
                qPs.setString(8, "B");
                qPs.setString(9, "Direct mutations don't change object reference identity, causing React to miss the update.");
                qPs.setInt(10, 3);
                qPs.executeUpdate();
            }

            // Seed downloadable resources for lessons
            try (Statement resStmt = conn.createStatement()) {
                resStmt.execute("UPDATE lessons SET resources = '[{\"name\":\"Python Quickstart Cheatsheet (PDF)\",\"url\":\"https://www.python.org/doc/\",\"type\":\"pdf\"},{\"name\":\"Course Source Code Repo\",\"url\":\"https://github.com/python/cpython\",\"type\":\"code\"},{\"name\":\"Standard Library Guide\",\"url\":\"https://docs.python.org/3/library/\",\"type\":\"link\"}]' WHERE (resources IS NULL OR resources = '') AND course_id = 'crs-free-python';");
                resStmt.execute("UPDATE lessons SET resources = '[{\"name\":\"Scikit-Learn Guidebook (PDF)\",\"url\":\"https://scikit-learn.org/stable/\",\"type\":\"pdf\"},{\"name\":\"Jupyter ML Starter Project\",\"url\":\"https://github.com/ageron/handson-ml3\",\"type\":\"code\"},{\"name\":\"Evaluation Metrics Reference\",\"url\":\"https://scikit-learn.org/stable/modules/model_evaluation.html\",\"type\":\"link\"}]' WHERE (resources IS NULL OR resources = '') AND course_id = 'crs-free-ml';");
                resStmt.execute("UPDATE lessons SET resources = '[{\"name\":\"React 18 Architecture Spec (PDF)\",\"url\":\"https://react.dev/reference/react\",\"type\":\"pdf\"},{\"name\":\"Starter Vite Repository\",\"url\":\"https://github.com/vitejs/vite\",\"type\":\"code\"},{\"name\":\"Hooks Cheat Sheet\",\"url\":\"https://react.dev/learn\",\"type\":\"link\"}]' WHERE (resources IS NULL OR resources = '') AND course_id = 'crs-react-pro';");
            } catch (SQLException ignored) {}

        } catch (SQLException e) {
            System.err.println("[JDBC] Quizzes and resources seed error: " + e.getMessage());
        }
    }
}
