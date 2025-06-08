import Application from "../models/applicationModel.js";
import User from "../models/User.js"; // Assuming User model path

// Submit a new application
export const submitApplication = async (req, res) => {
	try {
		const { applicationType, applicantId } = req.body;

		const previousApplication = await Application.findOne({
			applicantId: applicantId,
			applicationType: applicationType,
		});

		if (previousApplication) {
			if (previousApplication?.status === "approved") {
				return res
					.status(400)
					.json({ success: false, message: "Application already approved" });
			} else if (previousApplication?.status === "rejected") {
				return res
					.status(400)
					.json({ success: false, message: "Application already rejected" });
			} else if (previousApplication?.status === "in-review") {
				return res
					.status(400)
					.json({ success: false, message: "Application already in review" });
			}
			return res.status(400).json({
				success: false,
				message:
					"Your Application is pending. Don't make duplicate applications.",
			});
		}

		const newApplication = new Application({
			...req.body,
		});

		await newApplication.save();
		res.status(201).json({
			success: true,
			message: "Application submitted successfully!",
			application: newApplication,
		});
	} catch (error) {
		console.error("Error submitting application:", error);
		res.status(500).json({
			success: false,
			message: "Server error while submitting application.",
			error: error.message,
		});
	}
};

// Get all applications for the logged-in user
export const getMyApplications = async (req, res) => {
	try {
		const applications = await Application.find({
			applicantId: req.decoded.id,
		}).sort({ createdAt: -1 });
		res.json({ success: true, applications });
	} catch (error) {
		console.error("Error fetching user applications:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching applications.",
			error: error.message,
		});
	}
};

// Get a specific application by ID (user must own it or be admin)
export const getApplicationById = async (req, res) => {
	try {
		const application = await Application.findById(req.params.id);
		if (!application) {
			return res
				.status(404)
				.json({ success: false, message: "Application not found." });
		}

		// Check if the logged-in user is the owner or an admin
		if (
			application.applicantId !== req.decoded.id &&
			req.decoded.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to view this application.",
			});
		}
		res.json({ success: true, application });
	} catch (error) {
		console.error("Error fetching application by ID:", error);
		res
			.status(500)
			.json({ success: false, message: "Server error.", error: error.message });
	}
};

// Get all applications (for admins/reviewers) - ENHANCED with better query support
export const getAllApplications = async (req, res) => {
	try {
		const {
			status,
			type,
			applicationType,
			search,
			region,
			page = 1,
			limit = 10,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// Build query object
		const query = {};

		// Filter by status if specified
		if (status && status !== "all") {
			query.status = status;
		}

		// Filter by application type if specified (support both 'type' and 'applicationType')
		if (type && type !== "all") {
			query.applicationType = type;
		}
		if (applicationType && applicationType !== "all") {
			query.applicationType = applicationType;
		}

		// Filter by region if specified
		if (region && region !== "all") {
			query["operationalArea.region"] = region;
		}

		// Search by applicant name or email if specified
		if (search && search.trim()) {
			query.$or = [
				{ applicantName: { $regex: search.trim(), $options: "i" } },
				{ applicantEmail: { $regex: search.trim(), $options: "i" } },
			];
		}

		// Calculate pagination
		const pageNumber = parseInt(page);
		const pageSize = parseInt(limit);
		const skip = (pageNumber - 1) * pageSize;

		// Sort options
		const sortOptions = {};
		sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

		// Execute query with pagination
		const applications = await Application.find(query)
			.sort(sortOptions)
			.skip(skip)
			.limit(pageSize)
			.exec();

		// Get total count for pagination
		const totalApplications = await Application.countDocuments(query);
		const totalPages = Math.ceil(totalApplications / pageSize);

		res.json({
			success: true,
			applications,
			totalApplications,
			totalPages,
			currentPage: pageNumber,
			pageSize,
		});
	} catch (error) {
		console.error("Error fetching all applications:", error);
		res
			.status(500)
			.json({ success: false, message: "Server error.", error: error.message });
	}
};

// HIGH PRIORITY: Approve Application (dedicated endpoint)
export const approveApplication = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason = "Application approved", adminId } = req.body;
		const reviewerId = adminId || req.decoded.id;

		const application = await Application.findById(id);
		if (!application) {
			return res
				.status(404)
				.json({ success: false, message: "Application not found." });
		}

		// Update application status
		application.status = "approved";
		application.reviewedAt = new Date();
		application.reviewedBy = reviewerId;
		application.reviewNotes = reason;

		// Update user role based on application type
		const userToUpdate = await User.findById(application.applicantId);
		if (userToUpdate) {
			let newRole = userToUpdate.role;

			if (application.applicationType === "seller-application" || application.applicationType === "agent-application") {
				// Update region and district for sellers & agents 
				userToUpdate.operationalArea = {
					region: application.operationalArea.region,
					district: application.operationalArea.district,
				};
				newRole = application.applicationType === "seller-application" ? "seller" : "agent";
        if(application.applicationType === "agent-application"){
          userToUpdate.verified = true;
        }
			} else if (application.applicationType === "admin-application") {
				newRole = "admin";
			}

			userToUpdate.role = newRole;
			await userToUpdate.save();

			console.log(
				`Application ${application._id} approved. User ${application.applicantId} role updated to ${newRole}.`
			);
		}

		await application.save();

		res.json({
			success: true,
			message: "Application approved successfully.",
			application,
			userUpdated: {
				userId: userToUpdate._id,
				newRole: userToUpdate.role,
				operationalArea: userToUpdate.operationalArea,
			},
		});
	} catch (error) {
		console.error("Error approving application:", error);
		res.status(500).json({
			success: false,
			message: "Server error while approving application.",
			error: error.message,
		});
	}
};

// HIGH PRIORITY: Reject Application (dedicated endpoint)
export const rejectApplication = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason, adminId } = req.body;
		const reviewerId = adminId || req.decoded.id;

		if (!reason || reason.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Reason for rejection is required.",
			});
		}

		const application = await Application.findById(id);
		if (!application) {
			return res
				.status(404)
				.json({ success: false, message: "Application not found." });
		}

		// Update application status
		application.status = "rejected";
		application.reviewedAt = new Date();
		application.reviewedBy = reviewerId;
		application.reviewNotes = reason;

		await application.save();

		res.json({
			success: true,
			message: "Application rejected successfully.",
			application,
		});
	} catch (error) {
		console.error("Error rejecting application:", error);
		res.status(500).json({
			success: false,
			message: "Server error while rejecting application.",
			error: error.message,
		});
	}
};

// MEDIUM PRIORITY: Bulk Actions
export const bulkApplicationAction = async (req, res) => {
	try {
		const {
			applicationIds,
			action,
			reason = "Bulk action performed",
		} = req.body;
		const adminId = req.decoded.id;

		// Validate input
		if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Application IDs array is required",
			});
		}

		if (!["approve", "reject"].includes(action)) {
			return res.status(400).json({
				success: false,
				message: "Invalid action. Must be 'approve' or 'reject'",
			});
		}

		if (action === "reject" && (!reason || reason.trim().length === 0)) {
			return res.status(400).json({
				success: false,
				message: "Reason is required for bulk rejection",
			});
		}

		const results = {
			successful: [],
			failed: [],
			total: applicationIds.length,
		};

		// Process each application
		for (const appId of applicationIds) {
			try {
				const application = await Application.findById(appId);
				if (!application) {
					results.failed.push({
						applicationId: appId,
						error: "Application not found",
					});
					continue;
				}

				// Update application
				application.status = action === "approve" ? "approved" : "rejected";
				application.reviewedAt = new Date();
				application.reviewedBy = adminId;
				application.reviewNotes = reason;

				// If approving, update user role
				if (action === "approve") {
					const userToUpdate = await User.findById(application.applicantId);
					if (userToUpdate) {
						let newRole = userToUpdate.role;

						if (application.applicationType === "seller-application") {
							newRole = "seller";
						} else if (application.applicationType === "agent-application") {
							newRole = "agent";
							userToUpdate.operationalArea = {
								region: application.operationalArea.region,
								district: application.operationalArea.district,
							};
						} else if (application.applicationType === "admin-application") {
							newRole = "admin";
						}

						userToUpdate.role = newRole;
						await userToUpdate.save();
					}
				}

				await application.save();
				results.successful.push(appId);
			} catch (error) {
				results.failed.push({
					applicationId: appId,
					error: error.message,
				});
			}
		}

		res.json({
			success: true,
			message: `Bulk ${action} completed`,
			results,
		});
	} catch (error) {
		console.error("Error performing bulk application action:", error);
		res.status(500).json({
			success: false,
			message: "Server error while performing bulk action.",
			error: error.message,
		});
	}
};

// MEDIUM PRIORITY: Application Statistics
export const getApplicationStatistics = async (req, res) => {
	try {
		// Basic counts
		const total = await Application.countDocuments();
		const pending = await Application.countDocuments({ status: "pending" });
		const approved = await Application.countDocuments({ status: "approved" });
		const rejected = await Application.countDocuments({ status: "rejected" });
		const inReview = await Application.countDocuments({ status: "in-review" });

		// By application type
		const byTypeStats = await Application.aggregate([
			{
				$group: {
					_id: "$applicationType",
					count: { $sum: 1 },
				},
			},
		]);

		// By region
		const byRegionStats = await Application.aggregate([
			{
				$group: {
					_id: "$operationalArea.region",
					count: { $sum: 1 },
				},
			},
		]);

		// By status and type combined
		const statusTypeStats = await Application.aggregate([
			{
				$group: {
					_id: {
						status: "$status",
						type: "$applicationType",
					},
					count: { $sum: 1 },
				},
			},
		]);

		res.json({
			success: true,
			message: "Application statistics retrieved successfully",
			statistics: {
				total,
				pending,
				approved,
				rejected,
				inReview,
				byType: byTypeStats.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {}),
				byRegion: byRegionStats.reduce((acc, item) => {
					acc[item._id || "Unknown"] = item.count;
					return acc;
				}, {}),
				statusByType: statusTypeStats.reduce((acc, item) => {
					const key = `${item._id.status}_${item._id.type}`;
					acc[key] = item.count;
					return acc;
				}, {}),
			},
		});
	} catch (error) {
		console.error("Error fetching application statistics:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching statistics.",
			error: error.message,
		});
	}
};

// Update application status (for admins/reviewers)
export const updateApplicationStatus = async (req, res) => {
	try {
		const { status, reviewNotes } = req.body;
		const reviewerId = req.decoded.id;

		if (!["pending", "approved", "rejected", "in-review"].includes(status)) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid status value." });
		}

		const application = await Application.findById(req.params.id);
		if (!application) {
			return res
				.status(404)
				.json({ success: false, message: "Application not found." });
		}

		application.status = status;

		// Add review metadata
		application.reviewedAt = new Date();
		application.reviewedBy = reviewerId;
		if (reviewNotes) {
			application.reviewNotes = reviewNotes;
		}

		// If approved, update user role
		if (status === "approved") {
			const userToUpdate = await User.findById(application.applicantId);
			if (userToUpdate) {
				let newRole = userToUpdate.role;
				if (application.applicationType === "seller-application")
					newRole = "seller";
				else if (application.applicationType === "agent-application")
					newRole = "agent";
				else if (application.applicationType === "admin-application")
					newRole = "admin";

				userToUpdate.role = newRole;

				// If agent application, also update region based on operationalArea
				if (application.applicationType === "agent-application") {
					userToUpdate.region = application.operationalArea.region;
					userToUpdate.district = application.operationalArea.district;
				}

				await userToUpdate.save();
				console.log(
					`Application ${application._id} approved. User ${application.applicantId} role updated to ${newRole}.`
				);
			}
		}

		await application.save();
		res.json({
			success: true,
			message: "Application status updated.",
			application,
		});
	} catch (error) {
		console.error("Error updating application status:", error);
		res
			.status(500)
			.json({ success: false, message: "Server error.", error: error.message });
	}
};

// Add a note to an application (for admins/reviewers)
export const addApplicationNote = async (req, res) => {
	try {
		const { noteText } = req.body;
		const application = await Application.findById(req.params.id);

		if (!application) {
			return res
				.status(404)
				.json({ success: false, message: "Application not found." });
		}
		if (!noteText) {
			return res
				.status(400)
				.json({ success: false, message: "Note text is required." });
		}

		// Add note to formData or create a notes array
		if (!application.reviewNotes) {
			application.reviewNotes = noteText;
		} else {
			application.reviewNotes += `\n${new Date().toISOString()}: ${noteText}`;
		}

		await application.save();
		res.json({
			success: true,
			message: "Note added successfully.",
			application,
		});
	} catch (error) {
		console.error("Error adding note to application:", error);
		res.status(500).json({
			success: false,
			message: "Server error while adding note.",
			error: error.message,
		});
	}
};
