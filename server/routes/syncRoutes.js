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
    'Admin',
    'Terminal Personnel'
  ),
  getSynchronizationLogs
);




// Sync reports
router.post(
  '/sync-summaries',
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  sendSummaryReports
);




// Sync transaction records
router.post(
  '/sync-transactions',
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  sendTransactionRecords
);




// Retry failed synchronization
router.post(
  '/retry/:id',
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  retrySynchronization
);



export default router;