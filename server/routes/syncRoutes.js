import express from 'express';

import {
  getSynchronizationLogs,
  sendSummaryReports,
  sendTransactionRecords,
  retrySynchronization
} from '../controllers/synchronizationController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();



// View synchronization history
router.get(
  '/logs',
  protect,
  authorize(
    'Admin'
  ),
  getSynchronizationLogs
);




// Sync reports (manual, admin override)
router.post(
  '/sync-summaries',
  protect,
  authorize(
    'Admin'
  ),
  sendSummaryReports
);




// Sync transaction records (manual, admin override)
router.post(
  '/sync-transactions',
  protect,
  authorize(
    'Admin'
  ),
  sendTransactionRecords
);




// Retry failed synchronization
router.post(
  '/retry/:id',
  protect,
  authorize(
    'Admin'
  ),
  retrySynchronization
);



export default router;