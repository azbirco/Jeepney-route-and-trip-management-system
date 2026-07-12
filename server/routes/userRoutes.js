import express from 'express';

import {
  createUser,
  getUsers,
  getDrivers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin'), getUsers)
  .post(protect, authorize('Admin'), createUser);

// Dedicated, locked-down Driver list — must be declared before '/:id'
// so Express matches '/drivers' here first, not as an :id param.
router.get('/drivers', protect, authorize('Admin', 'Terminal Personnel'), getDrivers);

router.route('/:id')
  .get(protect, authorize('Admin'), getUserById)
  .put(protect, authorize('Admin'), updateUser)
  .delete(protect, authorize('Admin'), deleteUser);

export default router;