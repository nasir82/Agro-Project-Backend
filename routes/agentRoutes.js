import express from "express";
import {
	applyForAgent,
	approveAgent,
	getAgentProfile,
	updateDeliveryStatus,
} from "../controllers/agentController.js";
import { verifyJWT, verifyRole } from "../middleware/auth.js";

const router = express.Router();

// All agent routes are protected
// POST /agents/apply – apply to become agent
router.post("/apply", verifyJWT, applyForAgent);

// PATCH /agents/approve/:id – admin approves agent
router.patch("/approve/:id", verifyJWT, verifyRole(["admin"]), approveAgent);

// GET /agents/:id – get agent profile (protected)
router.get("/:id", verifyJWT, getAgentProfile);

// PATCH /agents/status/:id – update delivery status
router.patch(
	"/status/:id",
	verifyJWT,
	verifyRole(["agent"]),
	updateDeliveryStatus
);

export default router;
