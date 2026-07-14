import express from 'express';

import {
  getJeepneys,
  getJeepneyById,
  createJeepney,
  updateJeepney,
  deleteJeepney
} from '../controllers/jeepneyController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';


const router = express.Router();


router.route('/')

  .get(
    protect,
    getJeepneys
  )

  .post(
    protect,
    authorize('Admin'),
    createJeepney
  );


router.route('/:id')

  .get(
    protect,
    getJeepneyById
  )

  .put(
    protect,
    authorize('Admin'),
    updateJeepney
  )

  .delete(
    protect,
    authorize('Admin'),
    deleteJeepney
  );


export default router;