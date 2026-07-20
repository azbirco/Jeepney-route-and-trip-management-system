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



router.get(
  "/summary",
   verifyApiKey, 
  getExternalSummary
);

router.get(
  "/transactions",
   verifyApiKey, 
  getExternalTransactions
);

router.get(
  "/routes",
   verifyApiKey, 
  getExternalRoutes
);



export default router;