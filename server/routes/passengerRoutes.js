import express from 'express';

import {
  getStatistics,
  createPassengerStatistic,
  computeOccupancyAndRevenue
} from '../controllers/passengerStatisticController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();



// View statistics
router.get(
  '/',
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  getStatistics
);




// Create passenger statistics
router.post(
  '/',
  protect,
  authorize(
    'Terminal Personnel'
  ),
  createPassengerStatistic
);




// Compute occupancy/revenue
router.post(
  '/compute',
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  computeOccupancyAndRevenue
);



export default router;