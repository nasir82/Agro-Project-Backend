import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

// POST /create-payment-intent - Create Stripe payment intent
router.post("/create-payment-intent", verifyJWT, createPaymentIntent);

export default router;
