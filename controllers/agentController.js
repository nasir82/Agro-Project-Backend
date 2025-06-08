import Agent from "../models/Agent.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Apply to become an agent
export const applyForAgent = async (req, res) => {
	try {
		const {
			userId,
			name,
			email,
			phoneNumber,
			region,
			warehouseAddress,
			experience,
		} = req.body;

		// Check if application already exists
		const existingApplication = await Agent.findOne({ email });
		if (existingApplication) {
			return res.status(400).json({
				success: false,
				message: "Application already submitted",
			});
		}

		// Create new application
		const newApplication = new Agent({
			userId,
			name,
			email,
			phoneNumber,
			region,
			warehouseAddress,
			experience,
			status: "pending",
		});

		await newApplication.save();

		res.status(201).json({
			success: true,
			application: newApplication,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Admin approves agent
export const approveAgent = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		const application = await Agent.findById(id);

		if (!application) {
			return res.status(404).json({
				success: false,
				message: "Application not found",
			});
		}

		application.status = status;
		await application.save();

		// If approved, update user role and region
		if (status === "approved") {
			await User.findOneAndUpdate(
				{ email: application.email },
				{
					role: "agent",
					region: application.region,
					warehouseAddress: application.warehouseAddress,
					verified: true,
				}
			);
		}

		res.status(200).json({
			success: true,
			application,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get agent profile
export const getAgentProfile = async (req, res) => {
	try {
		const { id } = req.params;

		const agent = await Agent.findById(id);

		if (!agent) {
			return res.status(404).json({
				success: false,
				message: "Agent not found",
			});
		}

		res.status(200).json({
			success: true,
			agent,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		// Validate status
		const validStatuses = [
			"packaging",
			"to agent",
			"on the way",
			"reached",
			"delivered",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: "Invalid status",
			});
		}

		const agent = await Agent.findById(id);

		if (!agent) {
			return res.status(404).json({
				success: false,
				message: "Agent not found",
			});
		}

		// Update status logic would depend on your application's requirements
		// This is a placeholder for the actual implementation

		res.status(200).json({
			success: true,
			message: `Delivery status updated to ${status}`,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
