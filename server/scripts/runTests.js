require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const { connectDB, closeDB } = require('../config/db');

// Models
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');

let server;
let baseUrl;

// Simple HTTP request helper
const makeRequest = (method, endpoint, data = null, token = null, isFormData = false) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const headers = {};

    let bodyData = null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && !isFormData) {
      headers['Content-Type'] = 'application/json';
      bodyData = JSON.stringify(data);
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
};

// Multipart form upload helper for testing assignment submission
const makeMultipartRequest = (endpoint, fields, filePath, token) => {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const url = new URL(endpoint, baseUrl);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const chunks = [];

    // Fields
    for (const [k, v] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
    }

    // File
    if (filePath && fs.existsSync(filePath)) {
      const fileName = path.basename(filePath);
      chunks.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`
        )
      );
      chunks.push(fs.readFileSync(filePath));
      chunks.push(Buffer.from('\r\n'));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));

    const totalBuffer = Buffer.concat(chunks);
    headers['Content-Length'] = totalBuffer.length;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers,
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(rawData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', reject);
    req.write(totalBuffer);
    req.end();
  });
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FULL-STACK LMS END-TO-END AUTOMATED TESTS');
  console.log('====================================================');

  try {
    await connectDB();

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    console.log(`Server listening for tests on ${baseUrl}`);

    // --- TEST SUITE 1: AUTHENTICATION & RBAC ---
    console.log('\n--- 1. Authentication & Role-Based Access Control ---');

    // 1.1 Register Student
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'test.student@example.com',
      password: 'Password123!',
      role: 'student',
    });
    assert(regRes.status === 201 && regRes.data.success, 'Student registration creates user with JWT token');
    const studentToken = regRes.data.data.token;
    const studentId = regRes.data.data.user.id;

    // 1.2 Prohibit Public Admin Registration
    const adminRegRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Hack Admin',
      email: 'hacker@example.com',
      password: 'Password123!',
      role: 'admin',
    });
    assert(adminRegRes.status === 403, 'Public registration rejects unauthorized role="admin"');

    // 1.3 Duplicate Email Prevention
    const dupRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Student 2',
      email: 'test.student@example.com',
      password: 'Password123!',
    });
    assert(dupRes.status === 400, 'Duplicate email address is rejected');

    // 1.4 Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'test.student@example.com',
      password: 'Password123!',
    });
    assert(loginRes.status === 200 && loginRes.data.success, 'Login succeeds with valid credentials');

    // 1.5 Invalid Password Rejection
    const badLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'test.student@example.com',
      password: 'WrongPassword!',
    });
    assert(badLoginRes.status === 401, 'Login fails with invalid password');

    // 1.6 Create Instructor User
    const instReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Prof. Testing',
      email: 'prof.testing@example.com',
      password: 'Password123!',
      role: 'instructor',
    });
    assert(instReg.status === 201, 'Instructor registration succeeds');
    const instructorToken = instReg.data.data.token;

    // 1.7 RBAC Check: Student cannot access Instructor Course Creation
    const forbiddenRes = await makeRequest(
      'POST',
      '/api/courses',
      { title: 'Illegal Course', description: 'Desc', category: 'Web' },
      studentToken
    );
    assert(forbiddenRes.status === 403, 'Student cannot create courses (403 Forbidden)');

    // --- TEST SUITE 2: COURSE & SYLLABUS MANAGEMENT ---
    console.log('\n--- 2. Course, Module, and Lesson Lifecycle ---');

    // 2.1 Instructor Creates Course
    const courseRes = await makeRequest(
      'POST',
      '/api/courses',
      {
        title: 'Full-Stack Architecture Verification',
        description: 'Comprehensive test curriculum for verification.',
        shortDescription: 'Short desc',
        category: 'Web Development',
        level: 'Intermediate',
        price: 49.99,
        status: 'published',
      },
      instructorToken
    );
    assert(courseRes.status === 201 && courseRes.data.success, 'Instructor creates course');
    const courseId = courseRes.data.data._id;

    // 2.2 Add Module
    const modRes = await makeRequest(
      'POST',
      '/api/modules',
      {
        courseId,
        title: 'Module 1: Foundations',
        order: 0,
      },
      instructorToken
    );
    assert(modRes.status === 201, 'Instructor creates module');
    const moduleId = modRes.data.data._id;

    // 2.3 Add Lesson 1
    const les1Res = await makeRequest(
      'POST',
      '/api/lessons',
      {
        courseId,
        moduleId,
        title: 'Lesson 1.1: Core Concepts',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: 10,
        isPreview: true,
      },
      instructorToken
    );
    assert(les1Res.status === 201, 'Instructor creates preview lesson');
    const lesson1Id = les1Res.data.data._id;

    // 2.4 Add Lesson 2
    const les2Res = await makeRequest(
      'POST',
      '/api/lessons',
      {
        courseId,
        moduleId,
        title: 'Lesson 1.2: Advanced Patterns',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: 15,
        isPreview: false,
      },
      instructorToken
    );
    assert(les2Res.status === 201, 'Instructor creates second lesson');
    const lesson2Id = les2Res.data.data._id;

    // 2.5 Catalog Search & Filter
    const catalogRes = await makeRequest('GET', '/api/courses?search=Architecture&category=Web+Development');
    assert(
      catalogRes.status === 200 && catalogRes.data.data.length > 0,
      'Public catalog server-side search and category filtering returns course'
    );

    // --- TEST SUITE 3: ENROLLMENT & REAL PROGRESS CALCULATION ---
    console.log('\n--- 3. Enrollment & Progress Calculation ---');

    // 3.1 Student Enrolls in Course
    const enrollRes = await makeRequest('POST', '/api/enrollments', { courseId }, studentToken);
    assert(enrollRes.status === 201 && enrollRes.data.success, 'Student successfully enrolls in course');

    // 3.2 Duplicate Enrollment Rejection
    const dupEnrollRes = await makeRequest('POST', '/api/enrollments', { courseId }, studentToken);
    assert(dupEnrollRes.status === 400, 'Duplicate enrollment is rejected');

    // 3.3 My Courses listing
    const myCoursesRes = await makeRequest('GET', '/api/enrollments/my-courses', null, studentToken);
    assert(
      myCoursesRes.status === 200 && myCoursesRes.data.data.length === 1 && myCoursesRes.data.data[0].progress === 0,
      'My Courses returns enrolled course with initial 0% progress'
    );

    // 3.4 Complete Lesson 1 (50% progress expected since 1/2 completed)
    const prog1Res = await makeRequest('POST', `/api/progress/lesson/${lesson1Id}/complete`, { timeSpent: 10 }, studentToken);
    assert(
      prog1Res.status === 200 && prog1Res.data.data.progress === 50,
      'Lesson 1 completed: progress accurately calculates to 50% (1/2 lessons)'
    );

    // 3.5 Complete Lesson 2 (100% progress expected and course status marked 'completed')
    const prog2Res = await makeRequest('POST', `/api/progress/lesson/${lesson2Id}/complete`, { timeSpent: 15 }, studentToken);
    assert(
      prog2Res.status === 200 && prog2Res.data.data.progress === 100 && prog2Res.data.data.isCompleted,
      'Lesson 2 completed: progress reaches 100% and auto-completes enrollment'
    );

    // --- TEST SUITE 4: ASSIGNMENTS, SUBMISSION & GRADING ---
    console.log('\n--- 4. Assignment Creation, File Submission, and Grading ---');

    // 4.1 Instructor creates assignment
    const assignRes = await makeRequest(
      'POST',
      '/api/assignments',
      {
        courseId,
        title: 'Project 1: System Benchmark Report',
        description: 'Submit an architectural analysis PDF.',
        maxMarks: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      instructorToken
    );
    assert(assignRes.status === 201, 'Instructor creates assignment with maxMarks=100');
    const assignmentId = assignRes.data.data._id;

    // 4.2 Student uploads assignment deliverable file
    // Create temporary dummy file for upload test
    const dummyFilePath = path.join(__dirname, 'test_deliverable.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 test document content');

    const submitRes = await makeMultipartRequest(
      '/api/submissions',
      { assignmentId },
      dummyFilePath,
      studentToken
    );
    // Clean up dummy file
    try { fs.unlinkSync(dummyFilePath); } catch (e) {}

    assert(submitRes.status === 201 && submitRes.data.success, 'Student uploads submission file successfully');
    const submissionId = submitRes.data.data._id;

    // 4.3 Student cannot grade assignments
    const hackGradeRes = await makeRequest(
      'PATCH',
      `/api/submissions/${submissionId}/grade`,
      { marks: 100, feedback: 'Hacked' },
      studentToken
    );
    assert(hackGradeRes.status === 403, 'Student cannot grade submissions (403 Forbidden)');

    // 4.4 Instructor Grades Submission
    const gradeRes = await makeRequest(
      'PATCH',
      `/api/submissions/${submissionId}/grade`,
      { marks: 95, feedback: 'Exceptional architectural diagrams and clean implementation.' },
      instructorToken
    );
    assert(
      gradeRes.status === 200 && gradeRes.data.data.marks === 95 && gradeRes.data.data.status === 'graded',
      'Instructor successfully grades submission: 95/100 marks and feedback recorded'
    );

    // 4.5 Student verifies updated grade
    const mySubRes = await makeRequest('GET', '/api/submissions/my-submissions', null, studentToken);
    assert(
      mySubRes.status === 200 && mySubRes.data.data[0].marks === 95,
      'Student receives and verifies awarded grade in submissions portal'
    );

    // --- TEST SUITE 5: REAL ANALYTICS & NOTIFICATIONS ---
    console.log('\n--- 5. Real Database Analytics & Notifications ---');

    // 5.1 Student Analytics
    const studentAnalytics = await makeRequest('GET', '/api/analytics/student', null, studentToken);
    assert(
      studentAnalytics.status === 200 &&
      studentAnalytics.data.data.totalEnrolled === 1 &&
      studentAnalytics.data.data.completedCourses === 1 &&
      studentAnalytics.data.data.averageGrade === 95,
      'Student analytics dynamically reflects database state (1 enrolled, 1 completed, 95% avg grade)'
    );

    // 5.2 Notifications
    const notifRes = await makeRequest('GET', '/api/notifications', null, studentToken);
    assert(
      notifRes.status === 200 && notifRes.data.data.notifications.length >= 2,
      'Notifications generated for enrollment, course completion, and assignment grading'
    );

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('====================================================');

    if (server) {
      server.close();
    }
    await closeDB();

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    await closeDB();
    process.exit(1);
  }
}

runAllTests();
