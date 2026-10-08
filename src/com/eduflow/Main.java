package com.eduflow;

import com.eduflow.database.DatabaseManager;
import com.eduflow.database.DatabaseSeeder;
import com.eduflow.server.LmsHttpServer;

public class Main {
    public static void main(String[] args) {
        System.out.println("-----------------------------------------------------------------");
        System.out.println(" Starting EduFlow LMS - Java JDBC Relational Engine ");
        System.out.println("-----------------------------------------------------------------");

        try {
            // 1. Initialize Relational Schema via pure JDBC
            DatabaseManager.initializeDatabase();

            // 2. Populate Seed Records if Database is Empty
            DatabaseSeeder.seedIfEmpty();

            // 2b. Populate Rich Free Courses if Not Present
            com.eduflow.database.AddFreeCourses.seedFreeCourses();

            // 2c. Ensure ALL courses have complete modules, lessons, assignments, and quizzes
            com.eduflow.database.SeedAllCoursesContent.seedMissingContent();

            // 3. Start High-Performance HTTP REST Server on port 5000
            int port = 5000;
            LmsHttpServer server = new LmsHttpServer();
            server.start(port);

        } catch (Exception e) {
            System.err.println("❌ Fatal Error starting EduFlow Java Backend: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
