import express from 'express';

import {
  login,
  getProfile,
  logout
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();


// Public login
router.post(
  '/login',
  login
);


// Protected routes
router.get(
  '/profile',
  protect,
  getProfile
);


router.post(
  '/logout',
  protect,
  logout
);


export default router;