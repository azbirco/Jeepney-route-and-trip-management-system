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
  verifyApiKey,
  getExternalSummary
);



// =====================================
// External Transactions API
// GET /api/external/transactions
// =====================================
router.get(
  "/transactions",
  verifyApiKey,
  getExternalTransactions
);



export default router;