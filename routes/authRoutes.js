import express from "express";
import {
	register,
	login,
	logout,
	getProfile,
	updateRole,
	getAllAgents,
	getAgentByRegion,
	getUserWithEmail,
	verifyUser,
	updateUserProfile,
	updatePassword
} from "../controllers/authController.js";
import { verifyJWT, verifyRole, verifyUserEmail } from "../middleware/auth.js";

const router = express.Router();

// Public routes
// POST /users/register – register user
router.post("/register", register);

// POST /users/login – login user
router.post("/login", login);

// POST /users/logout – logout user
router.post("/logout", logout);

// GET /users/verifyUser - Check if user exists
router.get("/verifyUser", verifyUser);

// GET /users/agents – list all approved agents
router.get("/agents", getAllAgents);

// GET /users/agents/:region – get agent by region
router.get("/agents/:region", getAgentByRegion);

// Protected routes
// GET /users/:email - Get user by email
router.get("/:email", verifyJWT, getUserWithEmail);

// PATCH /users/:email - Update user profile
router.patch("/:email", verifyJWT, verifyUserEmail, updateUserProfile);

router.patch("/updatePassword/:email", verifyJWT, verifyUserEmail, updatePassword);

// GET /users/profile – get profile (protected)
router.get("/profile", verifyJWT, getProfile);

// PATCH /users/role – admin assigns/updates role
router.patch("/role", verifyJWT, verifyRole(["admin"]), updateRole);

export default router;
