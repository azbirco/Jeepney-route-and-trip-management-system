import express from "express";

import {
  getExternalSummary,
  getExternalTransactions,
  getExternalRoutes
} from "../controllers/externalController.js";


import {
  verifyApiKey
} from "../middleware/authMiddleware.js";



const router = express.Router();



// =====================================
// External Summary API
// GET /api/external/summary
// =====================================
router.get(
  "/summary",
  // verifyApiKey, // TEMP: commented out for local testing - RESTORE BEFORE DEPLOY
  getExternalSummary
);

router.get(
  "/transactions",
  // verifyApiKey, // TEMP: commented out for local testing - RESTORE BEFORE DEPLOY
  getExternalTransactions
);

router.get(
  "/routes",
  // verifyApiKey, // TEMP: commented out for local testing - RESTORE BEFORE DEPLOY
  getExternalRoutes
);



export default router;