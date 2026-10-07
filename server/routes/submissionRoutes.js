const express = require('express');
const router = express.Router();
const {
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
  getInstructorSubmissions,
  getMySubmissions,
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');

router.use(protect);

router.post('/', authorize('student', 'admin'), upload.single('file'), submitAssignment);
router.patch('/:id/grade', authorize('instructor', 'admin'), gradeSubmission);
router.get('/assignment/:assignmentId', authorize('instructor', 'admin'), getAssignmentSubmissions);
router.get('/instructor/submissions', authorize('instructor', 'admin'), getInstructorSubmissions);
router.get('/my-submissions', authorize('student', 'admin'), getMySubmissions);

module.exports = router;
