# 🎓 EduFlow Academy — Unified Java 21 Full-Stack Learning Management System (LMS)

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![Maven](https://img.shields.io/badge/Maven-POM-C71A36.svg)](https://maven.apache.org/)
[![SQLite](https://img.shields.io/badge/SQLite-JDBC-003B57.svg)](https://sqlite.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth-Google%202.0-4285F4.svg)](https://developers.google.com/identity/protocols/oauth2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**EduFlow Academy** is a complete, production-ready Full-Stack Learning Management System (LMS) engineered with a high-performance **Java 21 (JDBC + SQLite)** backend that directly serves both the RESTful API and the embedded **React 18** Single Page Application from a single unified server.

---

## 🏗️ Architecture & Platform Structure

The application runs as a **single unified Java project** on port `5000`:

```text
                                EduFlow Unified Application
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ↓                                           ↓
          Java 21 RESTful API Engine                 Embedded React SPA Static Server
          (SQLite Relational DB via JDBC)            (SPA Fallback & Asset Delivery)
                       │                                           │
  ┌────────────────────┼────────────────────┐                      │
  ↓                    ↓                    ↓                      ↓
Auth & Google OAuth  Courses & Quizzes   Progress & Certs     http://localhost:5000
```

* **Single Port Deployment**: The Java backend serves both the REST API at `/api/*` and the compiled React frontend at `/` with HTML5 pushState fallback routing.
* **Pure Java 21 & JDBC**: Uses standard `java.sql.*` with `sqlite-jdbc` and Google `gson`. No heavy third-party web frameworks required.
* **Relational Schema**: Complete data persistence for users, courses, modules, lessons, quizzes, quiz attempts, assignments, submissions, wishlist, and verified certificates.

---

## 🌟 Key Platform Features

1. **Course Exploration & Recommendation Engine**:
   - Multi-attribute search and filtering (keyword, categories, levels, pricing, duration, ratings).
   - Dynamic *Recommended for You* section scoring course relevance against real student interests.
   - Course tags (`#tag`), skill pills, and persistent Wishlist heart toggles.

2. **Interactive Quizzes & Instant Evaluation**:
   - Multi-question assessment runner with question numbering, radio choices, and instant grading.
   - Comprehensive score calculations, pass/fail thresholds, and detailed answer explanations.
   - Integrated into course modules and syllabus drawer.

3. **Composite Course Progress & Automatic Certifications**:
   - Calculates combined progress: `(completedLessons + completedAssignments + passedQuizzes) / (totalLessons + totalAssignments + totalQuizzes) * 100`.
   - Automatically issues digital certificates with unique verification codes when courses are 100% completed.

4. **Complete Learner Profile**:
   - First-time student onboarding flow (Degree, Specialization, Course Interests, Skills, Goals).
   - Real-time learning statistics: Enrolled Courses, Verified Certificates, Saved Wishlist, and Quizzes Passed.
   - Interactive quiz assessment history table.

5. **Course Player with Downloadable Resources**:
   - Video player with YouTube/Vimeo embed support and MP4 fallback.
   - Downloadable lecture resources (PDF notes, starter code repositories, cheatsheets).
   - Previous/Next lesson navigation.

---

## 📁 Repository Structure

```text
online-lms/
├── pom.xml                     # Maven project specification (Java 21, SQLite JDBC, Gson, Slf4j)
├── build.bat                   # 1-click build script (compiles frontend + compiles Java)
├── run.bat                     # 1-click launch script for Java server
├── src/                        # Java 21 Source Code
│   └── com/eduflow/
│       ├── Main.java           # Main application entrypoint
│       ├── database/           # DatabaseManager, schema setup, seeders
│       ├── model/              # User, Course, Lesson, Quiz, Certificate, etc.
│       ├── dao/                # Relational JDBC Data Access Objects
│       ├── server/             # HTTP server, REST handlers, StaticFileHandler
│       └── util/               # JWT, PasswordUtil, GoogleAuth, ResponseUtil
├── lib/                        # Pre-packaged runtime JAR dependencies
│   ├── sqlite-jdbc.jar
│   ├── gson.jar
│   ├── slf4j-api.jar
│   └── slf4j-nop.jar
├── data/                       # Relational database file
│   └── lms_jdbc.db             # SQLite database
├── client/                     # React 18 Frontend SPA
│   ├── src/                    # React components, pages, context, services
│   ├── dist/                   # Production-built static assets (served by Java)
│   └── package.json
└── .gitattributes              # Configured for GitHub Linguist (Java repository classification)
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 21 LTS** or higher
- **Node.js 18+** & npm (for building the frontend assets)

### 1. Build the Application
Run the build script to compile both the React frontend and Java backend:
```cmd
build.bat
```

### 2. Run the Java Server
Launch the unified server:
```cmd
run.bat
```
Or directly using Java:
```cmd
java -cp "bin;lib/*" com.eduflow.Main
```

### 3. Access the Application
Open your browser and navigate to:
- **Web Application:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Course Catalog:** [http://localhost:5000/courses](http://localhost:5000/courses)
- **Student Profile:** [http://localhost:5000/profile](http://localhost:5000/profile)

---

## 🧑‍💻 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@eduflow.com` | `password123` |
| **Instructor** | `instructor@eduflow.com` | `password123` |
| **Admin** | `admin@eduflow.com` | `password123` |

*(You can also use the **Google One-Tap / Sign-In** button on the login screen).*

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
