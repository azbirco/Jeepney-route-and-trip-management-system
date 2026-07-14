import express from 'express';

import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  updateTripStatus,
  confirmArrival,
  getPendingArrivalsCount,
  getMyPendingNotificationsCount,
  acknowledgeNotifications,
  deleteTrip,
  overrideTrip,
  acknowledgeTripOverride,
  disputeTripOverride
} from '../controllers/tripController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();


router.route('/')
  .get(protect, getTrips)
  .post(protect, authorize('Terminal Personnel'), createTrip);


// Literal-path routes must come before '/:id' so Express doesn't treat
// these path segments as an :id param.

router.get(
  '/pending-arrivals-count',
  protect,
  authorize('Admin', 'Terminal Personnel'),
  getPendingArrivalsCount
);

router.get(
  '/my-notifications-count',
  protect,
  authorize('Driver'),
  getMyPendingNotificationsCount
);

router.patch(
  '/acknowledge-notifications',
  protect,
  authorize('Driver'),
  acknowledgeNotifications
);

router.patch(
  '/:id/status',
  protect,
  authorize('Driver'),
  updateTripStatus
);

router.patch(
  '/:id/confirm-arrival',
  protect,
  authorize('Admin', 'Terminal Personnel'),
  confirmArrival
);

router.patch(
  '/:id/override',
  protect,
  authorize('Admin'),
  overrideTrip
);

router.patch(
  '/:id/acknowledge-override',
  protect,
  authorize('Terminal Personnel'),
  acknowledgeTripOverride
);

router.patch(
  '/:id/dispute-override',
  protect,
  authorize('Terminal Personnel'),
  disputeTripOverride
);


router.route('/:id')
  .get(protect, getTripById)
  .put(protect, authorize('Terminal Personnel'), updateTrip)
  .delete(protect, authorize('Terminal Personnel'), deleteTrip);


export default router;