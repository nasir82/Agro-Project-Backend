import express from "express";
import { verifyJWT, verifyRole } from "../middleware/auth.js";
import {
	getAllApplications,
	updateApplicationStatus,
	addApplicationNote,
} from "../controllers/applicationController.js";
import { updateRole, getAllAgents } from "../controllers/authController.js";
import {
	getAllUsers,
	getAllProducts,
	getUserStats,
	getProductStats,
	getUserById,
	deleteUser,
	suspendUser,
	activateUser,
	editUser,
	getUserHistory,
	bulkUserAction,
	exportUsers,
	verifyUser,
	changeUserRole,
	approveProduct,
	rejectProduct,
	suspendProduct,
	editProduct,
	getProductHistory,
} from "../controllers/adminControllers.js";
import { getAdminOrders } from "../controllers/orderController.js";

const router = express.Router();

// Admin only middleware
const adminOnly = verifyRole(["admin"]);

// User Management
router.get("/users", verifyJWT, adminOnly, getAllUsers);
router.get("/users/stats", verifyJWT, adminOnly, getUserStats);
router.get("/users/export", verifyJWT, adminOnly, exportUsers);
router.get("/users/:userId", verifyJWT, adminOnly, getUserById);
router.get("/users/:userId/history", verifyJWT, adminOnly, getUserHistory);
router.put("/users/:userId", verifyJWT, adminOnly, editUser);
router.delete("/users/:userId", verifyJWT, adminOnly, deleteUser);
router.patch("/users/:userId/suspend", verifyJWT, adminOnly, suspendUser);
router.patch("/users/:userId/activate", verifyJWT, adminOnly, activateUser);
router.patch("/users/:userId/verify", verifyJWT, adminOnly, verifyUser);
router.patch(
	"/users/:userId/change-role",
	verifyJWT,
	adminOnly,
	changeUserRole
);
router.post("/users/bulk-action", verifyJWT, adminOnly, bulkUserAction);
router.patch("/users/role", verifyJWT, adminOnly, updateRole);

// Product Management
router.get("/products", verifyJWT, adminOnly, getAllProducts);
router.get("/products/stats", verifyJWT, adminOnly, getProductStats);
router.patch(
	"/products/:productId/approve",
	verifyJWT,
	adminOnly,
	approveProduct
);
router.patch(
	"/products/:productId/reject",
	verifyJWT,
	adminOnly,
	rejectProduct
);
router.patch(
	"/products/:productId/suspend",
	verifyJWT,
	adminOnly,
	suspendProduct
);
router.put("/products/:productId", verifyJWT, adminOnly, editProduct);
router.get(
	"/products/:productId/history",
	verifyJWT,
	adminOnly,
	getProductHistory
);

// Application Management
router.get("/applications", verifyJWT, adminOnly, getAllApplications);
router.put(
	"/applications/:id/status",
	verifyJWT,
	adminOnly,
	updateApplicationStatus
);
router.post(
	"/applications/:id/notes",
	verifyJWT,
	adminOnly,
	addApplicationNote
);

// Agent Management
router.get("/agents", verifyJWT, adminOnly, getAllAgents);

// Order Management
router.get("/orders", verifyJWT, adminOnly, getAdminOrders);

export default router;
