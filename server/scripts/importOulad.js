require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');

const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const moduleTitles = {
  AAA: 'Discovering Arts and Humanities',
  BBB: 'Introduction to Business and Management',
  CCC: 'Science, Technology, and Applied Mathematics',
  DDD: 'Social Sciences and Quantitative Analysis',
  EEE: 'STEM Computing and Software Principles',
  FFF: 'Advanced Engineering and Computational Systems',
  GGG: 'Psychological Sciences and Behavioral Foundations',
};

const moduleCategories = {
  AAA: 'Humanities',
  BBB: 'Business & Management',
  CCC: 'Data Science',
  DDD: 'Social Sciences',
  EEE: 'Computer Science',
  FFF: 'Engineering',
  GGG: 'Psychology',
};

async function importOulad() {
  console.log('--- Starting OULAD Educational Data ETL Pipeline ---');
  try {
    await connectDB();

    const ouladDir = path.join(__dirname, '..', '..', 'data', 'external', 'oulad');

    // 1. Read CSV files
    console.log('[ETL] Reading OULAD CSV dataset files...');
    const coursesRaw = await parseCsv(path.join(ouladDir, 'courses.csv'));
    const studentInfoRaw = await parseCsv(path.join(ouladDir, 'studentInfo.csv'));
    const assessmentsRaw = await parseCsv(path.join(ouladDir, 'assessments.csv'));
    const registrationsRaw = await parseCsv(path.join(ouladDir, 'studentRegistration.csv'));

    console.log(`[ETL] Loaded ${coursesRaw.length} course presentations, ${studentInfoRaw.length} student records, ${assessmentsRaw.length} assessments.`);

    // 2. Create or find OULAD Faculty instructor
    let faculty = await User.findOne({ email: 'oulad.faculty@open.ac.uk' });
    if (!faculty) {
      faculty = await User.create({
        name: 'Open University Academic Faculty',
        email: 'oulad.faculty@open.ac.uk',
        password: 'Password123!',
        role: 'instructor',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'Official curriculum faculty from the Open University Learning Analytics Research Group.',
        skills: ['Curriculum Design', 'Higher Education', 'Learning Analytics'],
      });
    }

    // 3. Transform and create Courses
    const courseMap = new Map(); // code_module -> Course doc
    for (const c of coursesRaw) {
      const modCode = c.code_module;
      if (!courseMap.has(modCode)) {
        let course = await Course.findOne({ title: new RegExp(`^${moduleTitles[modCode] || modCode}`, 'i') });
        if (!course) {
          course = await Course.create({
            title: `${moduleTitles[modCode] || modCode} (${modCode})`,
            description: `Comprehensive higher education course for ${moduleTitles[modCode] || modCode}. Based on historical Open University course presentation ${c.code_presentation} with length ${c.module_presentation_length} days.`,
            shortDescription: `Open University curriculum module ${modCode} spanning verified academic coursework and assessments.`,
            category: moduleCategories[modCode] || 'General Studies',
            level: 'Intermediate',
            language: 'English',
            price: 49.99,
            duration: `${Math.round(parseInt(c.module_presentation_length, 10) / 7)} weeks`,
            skills: ['Critical Analysis', 'Academic Writing', 'Research Methodology'],
            requirements: ['Secondary Education Diploma', 'Basic computer literacy'],
            status: 'published',
            instructor: faculty._id,
          });

          // Create default Modules and Lessons for this course
          const mod1 = await Module.create({
            course: course._id,
            title: 'Foundational Concepts and Core Reading',
            description: 'Introduction to subject domain, methodology, and learning expectations.',
            order: 0,
          });

          const lesson1 = await Lesson.create({
            module: mod1._id,
            course: course._id,
            title: 'Welcome & Academic Overview',
            description: 'Orientation to module structure, learning aims, and key resources.',
            content: 'Welcome to this Open University accredited module. In this unit, we explore core conceptual definitions.',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 15,
            order: 0,
            isPreview: true,
          });

          const lesson2 = await Lesson.create({
            module: mod1._id,
            course: course._id,
            title: 'Methodology and Practice Study',
            description: 'Deep dive into analytical frameworks and empirical examples.',
            content: 'Follow the guided analytical exercise and review recommended supplementary reading.',
            duration: 25,
            order: 1,
            isPreview: false,
          });

          mod1.lessons = [lesson1._id, lesson2._id];
          await mod1.save();

          course.modules = [mod1._id];
          await course.save();
        }
        courseMap.set(modCode, course);
      }
    }

    // 4. Transform Assessments
    let createdAssessments = 0;
    for (const a of assessmentsRaw) {
      const course = courseMap.get(a.code_module);
      if (course) {
        const existing = await Assignment.findOne({
          course: course._id,
          title: `Assessment ${a.id_assessment} (${a.assessment_type})`,
        });

        if (!existing) {
          const dueDays = parseInt(a.date, 10) || 30;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + dueDays);

          await Assignment.create({
            course: course._id,
            title: `Assessment ${a.id_assessment} (${a.assessment_type})`,
            description: `Tutor-Marked / Computer-Marked Assessment weighting ${a.weight}% of final grade.`,
            instructions: 'Submit a single PDF or document answering the assigned problem set.',
            dueDate,
            maxMarks: 100,
            createdBy: faculty._id,
          });
          createdAssessments++;
        }
      }
    }

    // 5. Transform Students & Enrollments
    let createdStudents = 0;
    let createdEnrollments = 0;

    for (const s of studentInfoRaw) {
      const email = `oulad.student.${s.id_student}@learning.ac.uk`;
      let student = await User.findOne({ email });

      if (!student) {
        student = await User.create({
          name: `Student ${s.id_student}`,
          email,
          password: 'Password123!',
          role: 'student',
          bio: `Higher Education Candidate from ${s.region}. Prior education: ${s.highest_education}.`,
          skills: ['Self-directed Learning', 'Academic Study'],
        });
        createdStudents++;
      }

      const course = courseMap.get(s.code_module);
      if (course) {
        const existingEnr = await Enrollment.findOne({
          student: student._id,
          course: course._id,
        });

        if (!existingEnr) {
          let enrStatus = 'active';
          let completedAt = null;

          if (s.final_result === 'Pass' || s.final_result === 'Distinction') {
            enrStatus = 'completed';
            completedAt = new Date();
          } else if (s.final_result === 'Withdrawn') {
            enrStatus = 'dropped';
          }

          await Enrollment.create({
            student: student._id,
            course: course._id,
            status: enrStatus,
            completedAt,
          });
          createdEnrollments++;

          // Increment course enrollment count
          await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
        }
      }
    }

    console.log(`[ETL] Pipeline Completed Successfully!`);
    console.log(`[ETL] Summary:`);
    console.log(`  - Courses active: ${courseMap.size}`);
    console.log(`  - Assessments created: ${createdAssessments}`);
    console.log(`  - Students imported: ${createdStudents}`);
    console.log(`  - Enrollments processed: ${createdEnrollments}`);

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[ETL Pipeline Error]', err);
    process.exit(1);
  }
}

if (require.main === module) {
  importOulad();
}

module.exports = importOulad;
