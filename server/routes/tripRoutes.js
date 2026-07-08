import express from 'express';

import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip
} from '../controllers/tripController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();




// Get trips
router.route('/')

.get(
  protect,
  getTrips
)


.post(
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  createTrip
);





// Trip by ID
router.route('/:id')

.get(
  protect,
  getTripById
)


.put(
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  updateTrip
)


.delete(
  protect,
  authorize(
    'Admin',
    'Terminal Personnel'
  ),
  deleteTrip
);



export default router;