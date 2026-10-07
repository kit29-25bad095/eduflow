const express = require('express');
const router = express.Router();
const {
  createModule,
  updateModule,
  deleteModule,
} = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('instructor', 'admin'));

router.post('/', createModule);
router.put('/:id', updateModule);
router.delete('/:id', deleteModule);

module.exports = router;
