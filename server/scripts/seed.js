require('dotenv').config();
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const CourseReview = require('../models/CourseReview');
const Notification = require('../models/Notification');

async function seedData() {
  console.log('--- Starting Comprehensive LMS Seed Script ---');
  try {
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Enrollment.deleteMany({});
    await LessonProgress.deleteMany({});
    await CourseReview.deleteMany({});
    await Notification.deleteMany({});

    // 1. Create Admin
    console.log('[Seed] Creating Administrator...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@eduflow.com',
      password: 'Password123!',
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      bio: 'Head LMS Platform Administrator overseeing platform security, instructor approvals, and institutional curricula.',
      phone: '+1 555-0199',
      skills: ['System Administration', 'Database Management', 'Platform Governance'],
    });

    // 2. Create 5 Instructors
    console.log('[Seed] Creating 5 Expert Instructors...');
    const instructorsData = [
      {
        name: 'Dr. Sarah Lin',
        email: 'sarah.lin@eduflow.com',
        password: 'Password123!',
        role: 'instructor',
        profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        bio: 'Principal AI Scientist and PhD in Machine Learning. Ex-Google Research, passionate about making deep learning intuitive.',
        skills: ['Deep Learning', 'PyTorch', 'Transformers', 'Reinforcement Learning'],
      },
      {
        name: 'David Miller',
        email: 'david.miller@eduflow.com',
        password: 'Password123!',
        role: 'instructor',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Senior Staff Engineer with 12+ years building distributed cloud backends, microservices, and React ecosystems.',
        skills: ['React', 'Node.js', 'TypeScript', 'Kubernetes', 'AWS'],
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@eduflow.com',
        password: 'Password123!',
        role: 'instructor',
        profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        bio: 'Cybersecurity Architect, CISSP, Offensive Security Certified Professional (OSCP). Leading red-team operations.',
        skills: ['Penetration Testing', 'Network Security', 'Zero Trust', 'Cloud Security'],
      },
      {
        name: 'Marcus Chen',
        email: 'marcus.chen@eduflow.com',
        password: 'Password123!',
        role: 'instructor',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'Lead Data Scientist & Quant Strategist. Teaches advanced predictive modeling and statistical inference at scale.',
        skills: ['Python', 'Pandas', 'Data Science', 'Machine Learning', 'SQL'],
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@eduflow.com',
        password: 'Password123!',
        role: 'instructor',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Staff Product Designer & Design Systems Lead. Helping engineers bridge the gap between Figma and robust UI code.',
        skills: ['UI/UX Design', 'Design Systems', 'Figma', 'Human-Computer Interaction'],
      },
    ];

    const instructors = [];
    for (const inst of instructorsData) {
      instructors.push(await User.create(inst));
    }

    // 3. Create 25 Students
    console.log('[Seed] Creating 25 Students...');
    const students = [];
    const studentNames = [
      'Alex Johnson', 'Beatriz Silva', 'Carlos Mendez', 'Deepak Patel', 'Emma Watson',
      'Farooq Al-Mansoor', 'Grace Hopper', 'Hannah Schmidt', 'Ivan Petrov', 'Julia Roberts',
      'Kevin Zhang', 'Leila Nour', 'Michael Scott', 'Nina Dobrev', 'Oliver Queen',
      'Pam Beesly', 'Quinn Fabray', 'Rohan Gupta', 'Sofia Vergara', 'Tariq Aziz',
      'Uma Thurman', 'Victor Vance', 'Wendy Darling', 'Xavier Woods', 'Yara Shahidi'
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const sName = studentNames[i];
      const sEmail = `student${i + 1}@eduflow.com`;
      const student = await User.create({
        name: sName,
        email: sEmail,
        password: 'Password123!',
        role: 'student',
        profileImage: `https://images.unsplash.com/photo-${1530000000000 + (i * 1234567 % 100000000)}?w=150&auto=format&fit=crop&q=80`,
        bio: `Eager learner pursuing software mastery and career advancement.`,
        skills: ['Programming', 'Problem Solving'],
      });
      students.push(student);
    }

    // 4. Create 16 Comprehensive Courses across Categories
    console.log('[Seed] Creating 16 Comprehensive Courses...');
    const courseDefs = [
      {
        title: 'Deep Learning & Neural Network Architecture',
        shortDescription: 'Master convolution, attention mechanisms, backpropagation, and PyTorch.',
        description: 'An exhaustive deep dive into state-of-the-art deep learning. You will build neural networks from raw linear algebra, master PyTorch, implement convolutional nets for computer vision, and deploy production inference pipelines.',
        category: 'Artificial Intelligence',
        level: 'Advanced',
        language: 'English',
        price: 89.99,
        duration: '18 hours',
        instructor: instructors[0]._id,
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
        skills: ['PyTorch', 'Deep Learning', 'Neural Networks', 'Matrix Calculus', 'Model Deployment'],
        requirements: ['Python proficiency', 'Basic linear algebra and calculus'],
        status: 'published',
      },
      {
        title: 'Full-Stack Web Engineering with React & Node.js',
        shortDescription: 'Build scalable modern web applications from frontend to backend with MongoDB.',
        description: 'Complete hands-on journey building production-ready web applications. Covers React 18, Vite, Tailwind CSS, Express, MongoDB, authentication, RESTful APIs, and testing.',
        category: 'Web Development',
        level: 'Intermediate',
        language: 'English',
        price: 74.99,
        duration: '24 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
        skills: ['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Tailwind CSS'],
        requirements: ['Basic JavaScript, HTML, and CSS knowledge'],
        status: 'published',
      },
      {
        title: 'Applied Python for Data Science & Machine Learning',
        shortDescription: 'Explore data wrangling, NumPy, Pandas, Scikit-Learn, and predictive modeling.',
        description: 'Turn raw data into actionable intelligence. Learn data wrangling with Pandas, high-performance computing with NumPy, statistical visualization, and training predictive models with Scikit-Learn.',
        category: 'Data Science',
        level: 'Beginner',
        language: 'English',
        price: 59.99,
        duration: '16 hours',
        instructor: instructors[3]._id,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        skills: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'Data Visualization', 'Machine Learning'],
        requirements: ['No prior programming experience required'],
        status: 'published',
      },
      {
        title: 'Cloud DevOps, Docker Containers & Kubernetes',
        shortDescription: 'Master CI/CD pipelines, container orchestration, and cloud infrastructure.',
        description: 'Learn modern DevOps practices from ground up. Containerize applications with Docker, orchestrate microservices with Kubernetes, set up automated CI/CD pipelines, and deploy on AWS.',
        category: 'Cloud Computing',
        level: 'Advanced',
        language: 'English',
        price: 94.99,
        duration: '20 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80',
        skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'DevOps'],
        requirements: ['Linux command line familiarity', 'Basic networking principles'],
        status: 'published',
      },
      {
        title: 'Practical Ethical Hacking & Offensive Cybersecurity',
        shortDescription: 'Learn penetration testing, vulnerability assessment, and network security defenses.',
        description: 'Learn ethical hacking tools and methodologies. Perform reconnaissance, scan networks, exploit system vulnerabilities in legal sandboxes, and configure enterprise defenses.',
        category: 'Cybersecurity',
        level: 'Intermediate',
        language: 'English',
        price: 79.99,
        duration: '22 hours',
        instructor: instructors[2]._id,
        thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
        skills: ['Penetration Testing', 'Wireshark', 'Metasploit', 'Vulnerability Assessment', 'Network Defense'],
        requirements: ['Understanding of TCP/IP networking', 'Basic Linux command line'],
        status: 'published',
      },
      {
        title: 'Generative AI & LLM Application Engineering',
        shortDescription: 'Build AI agents, RAG systems, and fine-tune large language models.',
        description: 'Build enterprise GenAI systems with Retrieval Augmented Generation (RAG), vector databases, function calling, agentic workflows, and prompt engineering.',
        category: 'Generative AI',
        level: 'Intermediate',
        language: 'English',
        price: 99.99,
        duration: '15 hours',
        instructor: instructors[0]._id,
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        skills: ['LLMs', 'RAG', 'Vector Databases', 'Prompt Engineering', 'LangChain', 'AI Agents'],
        requirements: ['Python proficiency', 'Basic API experience'],
        status: 'published',
      },
      {
        title: 'Design Systems & Modern UI/UX Architecture',
        shortDescription: 'Create scalable design tokens, accessible components, and Figma workflows.',
        description: 'Bridge the gap between design and front-end engineering. Master component typography, color theory, design tokens, responsive auto-layout in Figma, and WCAG accessibility standards.',
        category: 'UI/UX Design',
        level: 'All Levels',
        language: 'English',
        price: 49.99,
        duration: '12 hours',
        instructor: instructors[4]._id,
        thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
        skills: ['Figma', 'UI/UX Design', 'Design Systems', 'WCAG Accessibility', 'Wireframing'],
        requirements: ['Curiosity for visual design and digital products'],
        status: 'published',
      },
      {
        title: 'High-Performance Database Systems: PostgreSQL & MongoDB',
        shortDescription: 'Master indexing, query execution plans, transactions, and schema modeling.',
        description: 'Deep dive into relational and document data storage. Compare ACID vs BASE, write complex aggregation pipelines, optimize indexes, and tune query performance.',
        category: 'Database Systems',
        level: 'Intermediate',
        language: 'English',
        price: 64.99,
        duration: '14 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
        skills: ['PostgreSQL', 'MongoDB', 'Indexing', 'Query Optimization', 'Transactions', 'Data Modeling'],
        requirements: ['Basic SQL or database knowledge'],
        status: 'published',
      },
      {
        title: 'Mastering Data Structures & Algorithms in Java',
        shortDescription: 'Ace technical interviews with trees, graphs, dynamic programming, and complexity analysis.',
        description: 'Comprehensive DSA course covering Big-O analysis, linked lists, binary search trees, graph traversals, and dynamic programming with live visual problem solving.',
        category: 'Computer Science',
        level: 'Intermediate',
        language: 'English',
        price: 69.99,
        duration: '30 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        skills: ['Java', 'Algorithms', 'Data Structures', 'Dynamic Programming', 'Complexity Analysis'],
        requirements: ['Basic Java or object-oriented programming knowledge'],
        status: 'published',
      },
      {
        title: 'Cross-Platform Mobile Apps with React Native',
        shortDescription: 'Build native iOS and Android applications with a single React codebase.',
        description: 'Learn to build performant mobile applications using React Native and Expo. Covers navigation, camera integration, offline SQLite storage, push notifications, and app deployment.',
        category: 'Mobile Development',
        level: 'Intermediate',
        language: 'English',
        price: 69.99,
        duration: '18 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
        skills: ['React Native', 'Expo', 'Mobile UX', 'Native APIs', 'Redux Toolkit'],
        requirements: ['Solid understanding of React and modern JavaScript'],
        status: 'published',
      },
      {
        title: 'Natural Language Processing with Modern Transformers',
        shortDescription: 'Implement BERT, tokenizers, sequence classification, and Hugging Face.',
        description: 'Explore computational linguistics and neural text processing. Build BPE tokenizers, sentiment classifiers, named-entity recognition systems, and fine-tune transformer models.',
        category: 'Artificial Intelligence',
        level: 'Advanced',
        language: 'English',
        price: 84.99,
        duration: '16 hours',
        instructor: instructors[0]._id,
        thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        skills: ['NLP', 'Transformers', 'Hugging Face', 'Tokenization', 'Fine-Tuning'],
        requirements: ['Python and PyTorch basics'],
        status: 'published',
      },
      {
        title: 'Computer Vision & Deep Convolutional Networks',
        shortDescription: 'Image segmentation, object detection with YOLO, and OpenCV image processing.',
        description: 'Master image filters, edge detection, feature matching, transfer learning with ResNet, and real-time object tracking with YOLO and OpenCV.',
        category: 'Artificial Intelligence',
        level: 'Advanced',
        language: 'English',
        price: 79.99,
        duration: '15 hours',
        instructor: instructors[0]._id,
        thumbnail: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&auto=format&fit=crop&q=80',
        skills: ['Computer Vision', 'OpenCV', 'YOLO', 'Object Detection', 'PyTorch'],
        requirements: ['Python programming', 'Basic neural network familiarity'],
        status: 'published',
      },
      {
        title: 'Modern Systems Programming with Rust',
        shortDescription: 'Memory safety without garbage collection, concurrency, and CLI tooling.',
        description: 'Dive into systems programming with Rust. Master ownership, borrowing, lifetimes, pattern matching, fearless multithreading, and building blazingly fast binaries.',
        category: 'Computer Science',
        level: 'Intermediate',
        language: 'English',
        price: 79.99,
        duration: '20 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        skills: ['Rust', 'Systems Programming', 'Memory Safety', 'Concurrency', 'Cargo'],
        requirements: ['Comfortable with at least one compiled or interpreted language'],
        status: 'published',
      },
      {
        title: 'Microservices Architecture & Event-Driven Systems',
        shortDescription: 'Domain-driven design, Apache Kafka, gRPC, and distributed transaction patterns.',
        description: 'Architect resilient enterprise microservices. Implement event streaming with Kafka, synchronous gRPC communication, Saga patterns for distributed transactions, and API gateways.',
        category: 'Cloud Computing',
        level: 'Advanced',
        language: 'English',
        price: 89.99,
        duration: '22 hours',
        instructor: instructors[1]._id,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        skills: ['Microservices', 'Kafka', 'gRPC', 'Saga Pattern', 'Distributed Systems'],
        requirements: ['Backend development experience'],
        status: 'published',
      },
      {
        title: 'Web Application Security & Defensive Engineering',
        shortDescription: 'Mitigate OWASP Top 10, implement Content Security Policy, and secure JWT auth.',
        description: 'Learn how malicious attackers exploit web applications and how to defend them. Covers SQL injection, XSS, CSRF, secure cookie flags, rate limiting, and cryptographic key rotation.',
        category: 'Cybersecurity',
        level: 'Intermediate',
        language: 'English',
        price: 69.99,
        duration: '14 hours',
        instructor: instructors[2]._id,
        thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
        skills: ['OWASP Top 10', 'Web Security', 'Cryptography', 'XSS Prevention', 'CORS & CSP'],
        requirements: ['Web development fundamentals'],
        status: 'published',
      },
      {
        title: 'Draft Course: Quantum Computing Fundamentals',
        shortDescription: 'Upcoming course on qubits, superposition, quantum circuits, and Qiskit.',
        description: 'An introductory preview course covering the principles of quantum computation.',
        category: 'Computer Science',
        level: 'Beginner',
        language: 'English',
        price: 49.99,
        duration: '10 hours',
        instructor: instructors[0]._id,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
        skills: ['Quantum Computing', 'Qiskit', 'Linear Algebra'],
        requirements: ['Basic math familiarity'],
        status: 'draft',
      },
    ];

    const courses = [];
    for (const cDef of courseDefs) {
      const course = await Course.create(cDef);
      courses.push(course);
    }

    // 5. Create Modules and Lessons for Courses
    console.log('[Seed] Generating Modules, Lessons, and Assignments for courses...');
    const allLessons = [];
    const allAssignments = [];

    for (let cIdx = 0; cIdx < courses.length; cIdx++) {
      const course = courses[cIdx];

      // Create 3 Modules
      const moduleTitles = [
        `Module 1: Foundations & Core Concepts of ${course.category}`,
        `Module 2: Practical Implementation & Architectural Patterns`,
        `Module 3: Advanced Applications & Production Case Studies`,
      ];

      const moduleIds = [];

      for (let mIdx = 0; mIdx < moduleTitles.length; mIdx++) {
        const mod = await Module.create({
          course: course._id,
          title: moduleTitles[mIdx],
          description: `Detailed study unit covering theory, real-world examples, and exercises for section ${mIdx + 1}.`,
          order: mIdx,
        });

        // Create 2–3 Lessons per module
        const lessonDefs = [
          {
            title: `Unit ${mIdx + 1}.1: Conceptual Introduction & Architecture`,
            description: `Core theoretical overview and terminology breakdown.`,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            content: `### Welcome to this in-depth lecture\n\nIn this section, we study the core underlying mechanics.\n\n* **Key Objective 1:** Understand the foundational paradigm\n* **Key Objective 2:** Master clean separation of concerns\n* **Key Objective 3:** Write modular and testable code\n\nMake sure to review the attached reference materials before moving to hands-on practice.`,
            duration: 12,
            order: 0,
            isPreview: mIdx === 0, // First lesson of first module is free preview
            resources: [
              { title: 'Lecture Notes (PDF)', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
              { title: 'Reference Cheat Sheet', url: 'https://developer.mozilla.org' },
            ],
          },
          {
            title: `Unit ${mIdx + 1}.2: Guided Implementation & Coding Workshop`,
            description: `Hands-on step-by-step walkthrough building functional logic.`,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            content: `### Implementation Guide\n\nFollow along with the terminal commands and code architecture presented in the video.\n\n\`\`\`javascript\n// Architectural example\nfunction executeWorkflow(payload) {\n  console.log("Processing payload safely:", payload);\n  return { success: true, timestamp: Date.now() };\n}\n\`\`\`\n\nVerify your local environment produces the expected output.`,
            duration: 18,
            order: 1,
            isPreview: false,
            resources: [
              { title: 'Starter Code Repository', url: 'https://github.com' },
            ],
          },
        ];

        const lessonIds = [];
        for (const lDef of lessonDefs) {
          const lesson = await Lesson.create({
            module: mod._id,
            course: course._id,
            ...lDef,
          });
          lessonIds.push(lesson._id);
          allLessons.push(lesson);
        }

        mod.lessons = lessonIds;
        await mod.save();
        moduleIds.push(mod._id);
      }

      course.modules = moduleIds;
      await course.save();

      // Create 2 Assignments for each course (total > 30 assignments!)
      const assign1 = await Assignment.create({
        course: course._id,
        module: moduleIds[0],
        title: `Project Milestone 1: Fundamental Design for ${course.title.substring(0, 30)}`,
        description: `Design and implement the initial system specifications following the criteria outlined in Module 1.`,
        instructions: `Upload your design document or compressed archive (PDF, ZIP, or DOCX) containing your source code and design justification.`,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        maxMarks: 100,
        createdBy: course.instructor,
      });

      const assign2 = await Assignment.create({
        course: course._id,
        module: moduleIds[1],
        title: `Capstone Deliverable: Advanced Implementation Benchmark`,
        description: `Complete the practical capstone project demonstrating end-to-end functionality, performance benchmarking, and test coverage.`,
        instructions: `Submit a final report (PDF) with performance graphs, code snippets, and deployment links.`,
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        maxMarks: 100,
        createdBy: course.instructor,
      });

      allAssignments.push(assign1, assign2);
    }

    console.log(`[Seed] Created ${allLessons.length} lessons and ${allAssignments.length} assignments.`);

    // 6. Create Enrollments, Progress, Submissions, Grades, and Reviews
    console.log('[Seed] Enrolling students and generating realistic activity...');
    const publishedCourses = courses.filter((c) => c.status === 'published');

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const student = students[sIdx];

      // Each student enrolls in 2–4 courses
      const numEnrollments = 2 + (sIdx % 3);
      for (let eIdx = 0; eIdx < numEnrollments; eIdx++) {
        const courseIndex = (sIdx * 2 + eIdx) % publishedCourses.length;
        const course = publishedCourses[courseIndex];

        // Fetch lessons for this course
        const courseLessons = allLessons.filter((l) => l.course.toString() === course._id.toString());
        const totalLessons = courseLessons.length;

        // Determine student progress archetype
        // Student 0: 100% completed
        // Student 1: 75% completed
        // Student 2: 50% completed
        // Student 3: 25% completed
        // Student 4: 0% started
        const progressArchetype = sIdx % 5;
        let lessonsToComplete = 0;
        let isCompletedCourse = false;

        if (progressArchetype === 0) {
          lessonsToComplete = totalLessons; // 100%
          isCompletedCourse = true;
        } else if (progressArchetype === 1) {
          lessonsToComplete = Math.floor(totalLessons * 0.75); // ~75%
        } else if (progressArchetype === 2) {
          lessonsToComplete = Math.floor(totalLessons * 0.5); // ~50%
        } else if (progressArchetype === 3) {
          lessonsToComplete = Math.max(1, Math.floor(totalLessons * 0.25)); // ~25%
        } else {
          lessonsToComplete = 0; // Just enrolled
        }

        // Create Enrollment
        const enrollment = await Enrollment.create({
          student: student._id,
          course: course._id,
          status: isCompletedCourse ? 'completed' : 'active',
          completedAt: isCompletedCourse ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null,
          lastAccessedAt: new Date(Date.now() - (sIdx % 7) * 24 * 60 * 60 * 1000),
        });

        // Increment course enrolled count
        await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });

        // Record LessonProgress
        for (let lIdx = 0; lIdx < lessonsToComplete; lIdx++) {
          const lesson = courseLessons[lIdx];
          await LessonProgress.create({
            student: student._id,
            course: course._id,
            lesson: lesson._id,
            completed: true,
            completedAt: new Date(Date.now() - (totalLessons - lIdx) * 12 * 60 * 60 * 1000),
            timeSpent: lesson.duration || 15,
          });
        }

        // Handle Submissions for the first assignment of this course
        const courseAssignments = allAssignments.filter((a) => a.course.toString() === course._id.toString());
        if (courseAssignments.length > 0 && lessonsToComplete > 0) {
          const assign = courseAssignments[0];
          const isGraded = sIdx % 2 === 0;
          const marks = 75 + (sIdx * 3 % 25); // Score between 75 and 99

          await Submission.create({
            assignment: assign._id,
            student: student._id,
            course: course._id,
            fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            fileName: `${student.name.replace(/\s+/g, '_')}_Milestone1.pdf`,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: isGraded ? 'graded' : 'submitted',
            marks: isGraded ? marks : undefined,
            feedback: isGraded
              ? 'Excellent architectural breakdown! Clean separation of concerns and robust verification tests.'
              : '',
            gradedBy: isGraded ? course.instructor : undefined,
            gradedAt: isGraded ? new Date() : undefined,
          });

          // Notification for graded student
          if (isGraded) {
            await Notification.create({
              recipient: student._id,
              type: 'GRADE',
              title: 'Assignment Graded',
              message: `Your assignment "${assign.title}" received ${marks}/${assign.maxMarks} marks.`,
              relatedEntity: { entityType: 'assignment', entityId: assign._id },
            });
          }
        }

        // Add Review if student has progressed
        if (lessonsToComplete >= 2) {
          const ratings = [5, 5, 4, 5, 4];
          const ratingVal = ratings[sIdx % ratings.length];
          const reviewComments = [
            'Exceptional curriculum! The lectures are crystal clear and the practical assignments solidified the concepts.',
            'One of the best courses I have taken online. Directly applicable to real-world software architecture.',
            'Very thorough and well structured. Instructor provides fast feedback and high-quality explanations.',
            'Outstanding course! The coding walkthroughs helped me understand the topics deeply.',
            'Super practical course. Loved the real-world assignments and project milestone reviews.',
          ];

          await CourseReview.create({
            course: course._id,
            student: student._id,
            rating: ratingVal,
            comment: reviewComments[sIdx % reviewComments.length],
          });
        }
      }
    }

    // 7. Recalculate average ratings for all courses
    console.log('[Seed] Aggregating course ratings...');
    for (const c of publishedCourses) {
      await CourseReview.calculateAverageRating(c._id);
    }

    // 8. Create realistic initial notifications
    console.log('[Seed] Seeding sample notifications...');
    await Notification.create({
      recipient: admin._id,
      type: 'SYSTEM',
      title: 'Platform Maintenance Scheduled',
      message: 'Weekly database integrity check and performance index optimization scheduled for midnight UTC.',
    });

    await Notification.create({
      recipient: instructors[0]._id,
      type: 'SUBMISSION',
      title: 'New Submissions Awaiting Grading',
      message: 'Multiple students have submitted deliverables for your Deep Learning course.',
    });

    console.log('=======================================================');
    console.log('🎉 SEED SCRIPT COMPLETED SUCCESSFULLY!');
    console.log('Sample Accounts Created:');
    console.log('  👑 Admin:       admin@eduflow.com / Password123!');
    console.log('  👨‍🏫 Instructor: sarah.lin@eduflow.com / Password123!');
    console.log('  👨‍🏫 Instructor: david.miller@eduflow.com / Password123!');
    console.log('  🎓 Student:    student1@eduflow.com / Password123!');
    console.log('  🎓 Student:    student2@eduflow.com / Password123!');
    console.log(`  📚 Total Courses:     ${courses.length}`);
    console.log(`  📖 Total Lessons:     ${allLessons.length}`);
    console.log(`  📝 Total Assignments: ${allAssignments.length}`);
    console.log(`  👥 Total Students:    ${students.length}`);
    console.log('=======================================================');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
