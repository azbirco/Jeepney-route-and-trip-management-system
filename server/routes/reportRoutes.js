import express from 'express';

import {
  getDailyTripReport,
  getPassengerSummaryReport,
  getRouteSummaryReport,
  getJeepneyActivityReport,
  getRevenueSummaryReport
} from '../controllers/reportController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

const reportAccess = authorize(
  'Admin',
  'Terminal Personnel'
);

router.get(
  '/daily-trips',
  protect,
  reportAccess,
  getDailyTripReport
);

router.get(
  '/passengers',
  protect,
  reportAccess,
  getPassengerSummaryReport
);

router.get(
  '/routes',
  protect,
  reportAccess,
  getRouteSummaryReport
);

router.get(
  '/jeepneys',
  protect,
  reportAccess,
  getJeepneyActivityReport
);

router.get(
  '/revenue',
  protect,
  reportAccess,
  getRevenueSummaryReport
);

export default router;