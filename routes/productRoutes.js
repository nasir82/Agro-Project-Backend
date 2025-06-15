import express from "express";
import {
	addProduct,
	getAllProducts,
	searchProducts,
	getProductById,
	getCropTypes,
	getProductsBySeller,
	approveProduct,
	deleteProduct,
	// Agent routes
	getAgentRegionalProducts,
	getAgentStatistics,
	getAgentOperationalArea,
	agentApproveProduct,
	agentRejectProduct,
	agentSuspendProduct,
	getAgentProductDetails,
	getAgentReviewHistory,
	// Admin routes
	getAdminAllProducts,
	getAdminProductStatistics,
	adminApproveProduct,
	adminRejectProduct,
	bulkProductAction,
	getProductAnalytics,
} from "../controllers/productController.js";
import { verifyJWT, verifyRole, verifyUserEmail } from "../middleware/auth.js";

const router = express.Router();

// Admin and agent middleware
const adminOnly = verifyRole(["admin"]);
const agentOnly = verifyRole(["agent"]);
const adminOrAgentRoles = verifyRole(["admin", "agent"]);

// ============================
// PUBLIC ROUTES (Specific routes first)
// ============================

// GET /products – get all approved listings
router.get("/", getAllProducts);

// GET /products/search – filtered search (by region/type/price)
router.get("/search", searchProducts);

// GET /products/crop-types – get available crop types
router.get("/crop-types", getCropTypes);

// ============================
// AGENT ROUTES
// ============================

// 1. GET /products/agent/regional - Get regional products
router.get("/agent/regional", verifyJWT, agentOnly, getAgentRegionalProducts);

// 2. GET /products/agent/statistics - Get agent statistics
router.get("/agent/statistics", verifyJWT, agentOnly, getAgentStatistics);

// 3. GET /products/agent/operational-area - Get operational area info
router.get(
	"/agent/operational-area",
	verifyJWT,
	agentOnly,
	getAgentOperationalArea
);

// 8. GET /products/agent/review-history - Get agent review history
router.get(
	"/agent/review-history",
	verifyJWT,
	agentOnly,
	getAgentReviewHistory
);

// ============================
// ADMIN ROUTES
// ============================

// GET /products/admin/all - Get all products (any status) for admin
router.get("/admin/all", verifyJWT, adminOnly, getAdminAllProducts);

// GET /products/admin/statistics - Get comprehensive product statistics
router.get(
	"/admin/statistics",
	verifyJWT,
	adminOnly,
	getAdminProductStatistics
);

// GET /products/admin/analytics - Product analytics for dashboard
router.get("/admin/analytics", verifyJWT, adminOnly, getProductAnalytics);

// ============================
// PROTECTED ROUTES
// ============================

// GET /products/seller/:email – get seller's products
router.get("/seller/:email", verifyJWT, verifyUserEmail, getProductsBySeller);

// POST /products/add-product – seller adds product (agentVerified required)
router.post("/add-product", verifyJWT, verifyRole(["seller"]), addProduct);

// LEGACY: PATCH /products/approve/:id – agent approves product (keep for compatibility)
router.patch("/approve/:id", verifyJWT, agentOnly, approveProduct);

// 4. PATCH /products/:productId/approve - Approve product (Agent)
router.patch("/:productId/approve", verifyJWT, agentOnly, agentApproveProduct);

// 5. PATCH /products/:productId/reject - Reject product (Agent)
router.patch("/:productId/reject", verifyJWT, agentOnly, agentRejectProduct);

// 6. PATCH /products/:productId/suspend - Suspend product (Agent)
router.patch("/:productId/suspend", verifyJWT, agentOnly, agentSuspendProduct);

// PATCH /products/admin/approve/:id - Admin approve product
router.patch("/admin/approve/:id", verifyJWT, adminOnly, adminApproveProduct);

// PATCH /products/admin/reject/:id - Admin reject product
router.patch("/admin/reject/:id", verifyJWT, adminOnly, adminRejectProduct);

// PATCH /products/bulk-action - Bulk approve/reject products
router.patch("/bulk-action", verifyJWT, adminOnly, bulkProductAction);

// DELETE /products/:id – seller deletes their product
router.delete("/:id", verifyJWT, deleteProduct);

// ============================
// DYNAMIC ROUTES (Must be last)
// ============================

// 7. GET /products/:productId - Enhanced product details (available to all)
router.get("/:productId", getAgentProductDetails);

export default router;
