package com.eduflow.database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
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

            populateCourseTagsAndCatalog(conn);

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
}
