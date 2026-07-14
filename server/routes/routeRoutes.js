import express from 'express';

import {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
} from '../controllers/routeController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();


router.route('/')

.get(
  protect,
  getRoutes
)

.post(
  protect,
  authorize('Admin'),
  createRoute
);


router.route('/:id')

.get(
  protect,
  getRouteById
)

.put(
  protect,
  authorize('Admin'),
  updateRoute
)

.delete(
  protect,
  authorize('Admin'),
  deleteRoute
);


export default router;