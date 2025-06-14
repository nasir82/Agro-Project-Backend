import express from "express";
import {
	createOrder,
	getUserOrders,
	getOrderById,
	updateOrderStatus,
	getSellerOrders,
	getAdminOrders,
} from "../controllers/orderController.js";
import { verifyJWT, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// 📦 CREATE ORDER
// POST /api/orders
router.post("/", verifyJWT, createOrder);

// 📋 GET USER ORDERS
// GET /api/orders/user/:userId
router.get("/user/:userId", verifyJWT, getUserOrders);

// 📄 GET SPECIFIC ORDER
// GET /api/orders/:orderId
router.get("/:orderId", verifyJWT, getOrderById);

// 🔄 UPDATE ORDER STATUS
// PUT /api/orders/:orderId/status
router.put("/:orderId/status", verifyJWT, updateOrderStatus);

// 📊 SELLER ORDERS
// GET /api/orders/seller/:sellerId
router.get("/seller/:sellerId", verifyJWT, getSellerOrders);

// 🛡️ ADMIN ORDERS
// GET /api/admin/orders (this will be handled in admin routes)
// But we can also provide it here for convenience
router.get("/admin/all", verifyJWT, verifyRole(["admin"]), getAdminOrders);

export default router;
