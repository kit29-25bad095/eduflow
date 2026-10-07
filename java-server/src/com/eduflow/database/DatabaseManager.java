package com.eduflow.database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
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

            System.out.println("[JDBC] Schema initialization successful on " + JDBC_URL);
        } catch (SQLException e) {
            System.err.println("[JDBC] Schema initialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
