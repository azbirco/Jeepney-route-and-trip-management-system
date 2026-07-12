import express from "express";

import {
  getExternalSummary,
  getExternalTransactions
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



export default router;