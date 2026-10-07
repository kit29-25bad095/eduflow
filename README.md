# 🎓 EduFlow Academy — Full-Stack Learning Management System (LMS)

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth-Google%202.0-4285F4.svg)](https://developers.google.com/identity/protocols/oauth2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**EduFlow Academy** is an editorial-grade, full-stack Learning Management System designed to bridge university computer science curricula and modern software engineering practices. Built with a high-performance **Java 21 JDBC** backend and a responsive **React 18** frontend styled with Tailwind CSS, EduFlow provides real-world learning workflows including Google OAuth 2.0, assignment grading, real-time analytics, and secure course checkout.

---

## 🌟 Key Platform Highlights

* 🔐 **Google OAuth 2.0 & Local Auth:** Secure authentication supporting both official Google Sign-In and standard Email/Password authentication with BCrypt hashing and JWT sessions.
* 👥 **Role-Based Access Control (RBAC):** Customized dashboards and permission boundaries for **Students**, **Instructors**, and **Administrators**.
* 📖 **Coursera-Style Course Catalog:** Real-time search, multi-category pills, multi-parameter filters (Free vs. Premium $79.99, Beginner/Intermediate/Advanced), and sorting.
* 💳 **SSL Payment & Enrollment Flow:** Differentiates free courses (instant 100% free enrollment) from premium courses ($79.99) with simulated 256-bit SSL checkout modal and receipt generation.
* 🎥 **Cinema Mode Course Player:** Lecture video player, expandable modular syllabus accordions, lecture notes, code references, and assignment uploads.
* 📝 **Deliverable Submissions & Grading:** File uploads for project milestones with instructor grading modal, marks evaluation, and student feedback.
* ⭐ **Course Reviews & Post-Completion Feedback:** Course completion prompt for student reviews and ratings displayed dynamically on course landing pages and instructor dashboards.
* 📊 **Analytics Dashboards:** Real-time metrics for students (learning hours, progress, average grade) and instructors (total enrollments, revenue, pending grading).

---

## 🏗️ Architecture & Technology Stack

```text
┌─────────────────────────────────────────────────────────────────┐
│                    React 18 Single Page App                     │
│    Vite • Tailwind CSS • React Router 6 • Recharts • Lucide     │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / REST / JSON
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Java 21 High-Performance Server                   │
│   Pure Java HTTP Server • Modular DAO Layer • SQLite / MySQL    │
│   • Google OAuth 2.0 Handler • JWT Auth • BCrypt Password Hash  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ JDBC Driver
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Relational Database                         │
│   users • courses • modules • lessons • enrollments             │
│   progress • assignments • submissions • reviews • payments     │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with `"Plus Jakarta Sans"` and `"JetBrains Mono"`
- **Icons & Visuals:** Lucide React
- **Data Visualization:** Recharts
- **HTTP Client:** Axios with JWT interceptors

### Backend & Database
- **Core Runtime:** Java 21 LTS (or Node.js Express alternative)
- **Database Engine:** SQLite / MySQL via JDBC
- **Authentication:** Google OAuth 2.0 (`google-api-client`), JWT (`java-jwt`), BCrypt password hashing
- **JSON Serialization:** Google Gson

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Java Development Kit (JDK 21)**
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/kit29-25bad095/eduflow.git
cd eduflow
```

---

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your credentials in `.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5555
JDBC_URL=jdbc:sqlite:data/lms_jdbc.db
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5555/api/auth/google/callback
```

---

### 3. Run the Java JDBC Server
```bash
cd java-server
javac -cp "lib/*" -d bin src/com/eduflow/*.java src/com/eduflow/*/*.java
java -cp "bin;lib/*" com.eduflow.Main
```
*The Java REST API will start on `http://localhost:5000`.*

---

### 4. Run the React Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
*The React client will launch at `http://localhost:5555`.*

---

## 🔑 Demo Personas

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Student** | `student1@eduflow.com` | `Password123!` | Course player, assignment submission, progress analytics |
| **Instructor** | `sarah.lin@eduflow.com` | `Password123!` | Course builder, submission grading studio, student reviews |
| **Admin** | `admin@eduflow.com` | `Password123!` | System oversight, user activation, catalog moderation |

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
