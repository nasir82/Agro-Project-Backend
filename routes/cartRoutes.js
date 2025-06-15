import express from "express";
import {
	getUserCart,
<<<<<<< HEAD
	saveCart,
	updateCartItem,
	removeCartItem,
	clearCart,
=======
	addSingleItem,
	addMultipleItems,
	updateCartItem,
	removeCartItem,
	clearCart,
	batchUpdateCart,
	previewCartMerge,
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
} from "../controllers/cartController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

<<<<<<< HEAD
// GET /carts/:email - Get user cart
router.get("/:email", verifyJWT, getUserCart);

// POST /carts - Save/update user cart
router.post("/", verifyJWT, saveCart);

// PUT /carts/:email/items/:itemId - Update cart item quantity
router.put("/:email/items/:itemId", verifyJWT, updateCartItem);

// DELETE /carts/:email/items/:itemId - Remove cart item
router.delete("/:email/items/:itemId", verifyJWT, removeCartItem);

// DELETE /carts/:email - Clear user cart
router.delete("/:email", verifyJWT, clearCart);
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d

export default router;
