import express from "express";
import {
	createOrder,
	getMyOrders,
	updateOrderStatus,
	returnOrder,
	completeOrder,
	cancelOrder,
} from "../controllers/orderController.js";
import { verifyJWT, verifyRole } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
