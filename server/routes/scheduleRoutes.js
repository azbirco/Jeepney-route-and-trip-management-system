import express from 'express';

import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
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
    'Admin',
    'Terminal Personnel'
  ),
  createSchedule
);





router.route('/:id')


.get(
  protect,
  getScheduleById
)


.put(
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  updateSchedule
)


.delete(
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  deleteSchedule
);



export default router;