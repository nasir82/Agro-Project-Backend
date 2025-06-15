import express from "express";
import {
	submitApplication,
	getMyApplications,
	getApplicationById,
	getAllApplications,
	approveApplication,
	rejectApplication,
	bulkApplicationAction,
	getApplicationStatistics,
	updateApplicationStatus,
	addApplicationNote,
<<<<<<< HEAD
=======
	getAgentApplications,
	getAgentOperationalArea,
	getAgentApplicationStatistics,
	getUserApplicationStatus,
	getUserApplications,
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
} from "../controllers/applicationController.js";
import { verifyJWT, verifyRole } from "../middleware/auth.js"; // Assuming verifyRole is your admin/role check middleware

const router = express.Router();

// Admin only middleware
const adminOnly = verifyRole(["admin"]);
<<<<<<< HEAD
const adminOrReviewerRoles = ["admin", "reviewer"];
=======
const adminOrAgentRoles = verifyRole(["admin", "agent"]);
const agentOnly = verifyRole(["agent"]);
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d

// Public/User Routes
router.post("/", verifyJWT, submitApplication);
router.get("/my-applications", verifyJWT, getMyApplications);

<<<<<<< HEAD
// Admin Routes (specific routes first)
router.get("/all-applications", verifyJWT, adminOnly, getAllApplications);
router.get("/statistics", verifyJWT, adminOnly, getApplicationStatistics);
router.patch("/bulk-action", verifyJWT, adminOnly, bulkApplicationAction);

// HIGH PRIORITY: Action endpoints (with exact patterns)
router.patch("/:id/approve", verifyJWT, adminOnly, approveApplication);
router.patch("/:id/reject", verifyJWT, adminOnly, rejectApplication);
=======
// User-specific routes
router.get("/user/status", verifyJWT, getUserApplicationStatus);
router.get("/user/:userId", verifyJWT, getUserApplications);

// Agent-Specific Routes (specific routes first)
router.get("/agent/applications", verifyJWT, agentOnly, getAgentApplications);
router.get(
	"/agent/operational-area",
	verifyJWT,
	agentOnly,
	getAgentOperationalArea
);
router.get(
	"/agent/statistics",
	verifyJWT,
	agentOnly,
	getAgentApplicationStatistics
);

// Admin/Agent Routes (specific routes first)
router.get(
	"/all-applications",
	verifyJWT,
	adminOrAgentRoles,
	getAllApplications
);
router.get("/statistics", verifyJWT, adminOnly, getApplicationStatistics);
router.patch("/bulk-action", verifyJWT, adminOnly, bulkApplicationAction);

// Primary action endpoints - professional and direct
router.patch("/:id/approve", verifyJWT, adminOrAgentRoles, approveApplication);
router.patch("/:id/reject", verifyJWT, adminOrAgentRoles, rejectApplication);
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d

// Legacy endpoints (keep for backward compatibility)
router.put(
	"/:id/status",
	verifyJWT,
<<<<<<< HEAD
	verifyRole(adminOrReviewerRoles),
	updateApplicationStatus
);
router.post(
	"/:id/notes",
	verifyJWT,
	verifyRole(adminOrReviewerRoles),
	addApplicationNote
);
=======
	adminOrAgentRoles,
	updateApplicationStatus
);
router.post("/:id/notes", verifyJWT, adminOrAgentRoles, addApplicationNote);
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d

// Dynamic routes last
router.get("/:id", verifyJWT, getApplicationById);

export default router;
