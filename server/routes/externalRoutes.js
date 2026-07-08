import express from "express";
import {
 getExternalSummary,
 getExternalTransactions
} from "../controllers/externalController.js";


const router = express.Router();


router.get(
 "/summary",
 getExternalSummary
);


router.get(
 "/transactions",
 getExternalTransactions
);


export default router;