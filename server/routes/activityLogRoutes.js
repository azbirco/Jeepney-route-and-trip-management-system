import express from "express";

import { getActivityLogs } from "../controllers/activityLogController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize('Admin'),
  getActivityLogs
);

export default router;