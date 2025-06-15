import express from "express";
import {
	getUserCart,
	addSingleItem,
	addMultipleItems,
	updateCartItem,
	removeCartItem,
	clearCart,
	batchUpdateCart,
	previewCartMerge,
} from "../controllers/cartController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

// ============================
// CART API ROUTES - FRONTEND ALIGNED
// ============================

// 1. GET /api/cart/:email - Load User Cart
router.get("/:email", verifyJWT, getUserCart);

// 2. POST /api/cart/add - Add Single Item to Cart
router.post("/add", verifyJWT, addSingleItem);

// 3. POST /api/cart/add-multiple - Add Multiple Items to Cart
router.post("/add-multiple", verifyJWT, addMultipleItems);

// 4. PUT /api/cart/update - Update Item Quantity
router.put("/update", verifyJWT, updateCartItem);

// 5. DELETE /api/cart/remove - Remove Item from Cart
router.delete("/remove", verifyJWT, removeCartItem);

// 6. DELETE /api/cart/clear/:email - Clear Entire Cart
router.delete("/clear/:email", verifyJWT, clearCart);

// 7. POST /api/cart/batch-update - Batch Update Cart Items
router.post("/batch-update", verifyJWT, batchUpdateCart);

// 8. POST /api/cart/preview-merge - Preview Cart Merge (Optional)
router.post("/preview-merge", verifyJWT, previewCartMerge);

export default router;
