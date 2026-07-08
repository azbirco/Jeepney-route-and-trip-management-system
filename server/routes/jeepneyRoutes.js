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
    authorize(
      'Admin',
      'Terminal Personnel'
    ),
    createJeepney
  );





router.route('/:id')

  .get(
    protect,
    getJeepneyById
  )


  .put(
    protect,
    authorize(
      'Admin',
      'Terminal Personnel'
    ),
    updateJeepney
  )


  .delete(
    protect,
    authorize(
      'Admin',
      'Terminal Personnel'
    ),
    deleteJeepney
  );



export default router;