import express from "express";
import {
	createOrder,
<<<<<<< HEAD
	getMyOrders,
	updateOrderStatus,
	returnOrder,
	completeOrder,
	cancelOrder,
=======
	getUserOrders,
	getOrderById,
	updateOrderStatus,
	getSellerOrders,
	getAdminOrders,
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
} from "../controllers/orderController.js";
import { verifyJWT, verifyRole } from "../middleware/auth.js";

const router = express.Router();

<<<<<<< HEAD
// All order routes are protected
// POST /orders – place order (consumer)
router.post("/", verifyJWT, verifyRole(["consumer"]), createOrder);

// GET /orders/my-orders – get my orders (based on role)
router.get("/my-orders", verifyJWT, getMyOrders);

// PATCH /orders/status/:id – update delivery stage (role-based)
router.patch("/status/:id", verifyJWT, updateOrderStatus);

// PATCH /orders/return/:id – auto/manual return logic
router.patch(
	"/return/:id",
	verifyJWT,
	verifyRole(["agent", "admin"]),
	returnOrder
);

// PATCH /orders/complete/:id – mark as delivered
router.patch(
	"/complete/:id",
	verifyJWT,
	verifyRole(["consumer"]),
	completeOrder
);

// DELETE /orders/:id – cancel order (before shipment)
router.delete("/:id", verifyJWT, cancelOrder);
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d

export default router;
