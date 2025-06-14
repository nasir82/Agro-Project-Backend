import express from "express";
import {
	createReview,
	getProductReviews,
} from "../controllers/reviewController.js";
import { verifyJWT, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes
// GET /reviews/product/:id – fetch all reviews for a product
router.get("/product/:id", getProductReviews);

// Protected routes
// POST /reviews – consumer posts review after delivery
router.post("/", verifyJWT, verifyRole(["consumer"]), createReview);

export default router;
