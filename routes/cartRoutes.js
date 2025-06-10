import express from "express";
import {
	getUserCart,
	saveCart,
	updateCartItem,
	removeCartItem,
	clearCart,
} from "../controllers/cartController.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
