import express from 'express';

import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  overrideSchedule,
  acknowledgeScheduleOverride,
  disputeScheduleOverride
} from '../controllers/scheduleController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();



router.route('/')


.get(
  protect,
  getSchedules
)


.post(
  protect,
  authorize(
    'Terminal Personnel'
  ),
  createSchedule
);


// Literal-path routes must come before '/:id' so Express doesn't treat
// these path segments as an :id param.

router.patch(
  '/:id/override',
  protect,
  authorize('Admin'),
  overrideSchedule
);

router.patch(
  '/:id/acknowledge-override',
  protect,
  authorize('Terminal Personnel'),
  acknowledgeScheduleOverride
);

router.patch(
  '/:id/dispute-override',
  protect,
  authorize('Terminal Personnel'),
  disputeScheduleOverride
);


router.route('/:id')


.get(
  protect,
  getScheduleById
)


.put(
  protect,
  authorize(
    'Terminal Personnel'
  ),
  updateSchedule
)


.delete(
  protect,
  authorize(
    'Terminal Personnel'
  ),
  deleteSchedule
);



export default router;