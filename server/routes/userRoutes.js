const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  toggleUserStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id/status', toggleUserStatus);

module.exports = router;
