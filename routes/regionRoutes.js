import express from "express";
import { getRegions } from "../controllers/regionController.js";

const router = express.Router();

// GET /regions - Get all regions with districts
router.get("/", getRegions);

export default router;
