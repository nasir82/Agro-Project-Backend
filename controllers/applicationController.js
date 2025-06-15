import Application from "../models/Application.js";
import User from "../models/User.js"; // Assuming User model path
import Seller from "../models/Seller.js";
import Agent from "../models/Agent.js";
import Admin from "../models/Admin.js";

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
		// console.error("Error submitting application:", error);
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
		// console.error("Error fetching user applications:", error);
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
		// console.error("Error fetching application by ID:", error);
		res
			.status(500)
			.json({ success: false, message: "Server error.", error: error.message });
	}
};

// Get all applications (for admins/agents) - ENHANCED with better query support
export const getAllApplications = async (req, res) => {
	try {
		const {
			status,
			type,
			applicationType,
			search,
			region,
			district,
			page = 1,
			limit = 10,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// Build query object
		const query = {};

		// Role-based filtering
		const userRole = req.decoded.role;

		if (userRole === "agent") {
			// Agents can only see seller-applications from their region and district
			query.applicationType = "seller-application";

			// Agent must provide region and district in query params
			if (!region || !district) {
				return res.status(400).json({
					success: false,
					message:
						"Agents must provide region and district in query parameters",
				});
			}

			query["operationalArea.region"] = region;
			query["operationalArea.district"] = district;
		} else if (userRole === "admin") {
			// Admins can see all applications with optional filtering

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

			// Filter by district if specified
			if (district && district !== "all") {
				query["operationalArea.district"] = district;
			}
		} else {
			// Other roles are not authorized
			return res.status(403).json({
				success: false,
				message: "Access denied. Only admins and agents can view applications.",
			});
		}

		// Search by applicant name or email if specified (available for both roles)
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
			userRole, // Include user role in response for frontend reference
			appliedFilters: {
				...(userRole === "agent" && {
					restrictedTo: "seller-applications",
					region,
					district,
				}),
			},
		});
	} catch (error) {
		// console.error("Error fetching all applications:", error);
		res
			.status(500)
			.json({ success: false, message: "Server error.", error: error.message });
	}
};

// HIGH PRIORITY: Approve Application (dedicated endpoint)
export const approveApplication = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason, reviewedBy } = req.body;
		const reviewerId = reviewedBy || req.decoded.id;
		const approvalReason = reason || "Application approved";

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
		application.reviewNotes = approvalReason;

		// Update user role based on application type
		const userToUpdate = await User.findById(application.applicantId);
		if (!userToUpdate) {
			return res.status(404).json({
				success: false,
				message: "User not found for this application.",
			});
		}

		let newRole = userToUpdate.role;
		let createdRecord = null;

		if (application.applicationType === "seller-application") {
			// Create Seller record
			const sellerData = {
				userId: application.applicantId,
				name: application.applicantName,
				email: application.applicantEmail,
				phoneNumber: userToUpdate.phoneNumber || "",
				profilePicture: application.applicantImg,
				fullAddress: userToUpdate.fullAddress || "",
				applicationId: application._id.toString(),
				operationalArea: application.operationalArea,
				formData: application.formData,
				// Map formData fields to model fields
				farmName: application.formData.farmName || "Unknown Farm",
				farmType: application.formData.farmType || "Other",
				farmSize: application.formData.farmSize || "Unknown",
				experience: application.formData.experience || "Not specified",
				farmAddress: application.formData.farmAddress || "",
				specialization:
					application.formData.specialization || "General farming",
				certifications: application.formData.certifications || "",
				nidNumber: application.formData.nidNumber || "",
				nidCopy: application.formData.nidCopy || "",
				farmPhotos: application.formData.farmPhotos || [],
				region:
					application.formData.region || application.operationalArea.region,
				district:
					application.formData.district || application.operationalArea.district,
				upazila: application.formData.upazila || "",
				village: application.formData.village || "",
				bankAccountDetails: application.formData.bankAccountDetails || "",
				references: application.formData.references || "",
				motivation: application.formData.motivation || "Join platform",
				verified: true, // Set to true since application is approved
				approvedBy: reviewerId,
				approvedAt: new Date(),
			};

			const newSeller = new Seller(sellerData);
			createdRecord = await newSeller.save();
			newRole = "seller";

			// Update user operational area
			userToUpdate.operationalArea = {
				region: application.operationalArea.region,
				district: application.operationalArea.district,
			};
			userToUpdate.verified = true;
		} else if (application.applicationType === "agent-application") {
			// Generate unique agent ID
			const agentCount = await Agent.countDocuments();
			const agentId = `AGT-${Date.now()}-${String(agentCount + 1).padStart(
				4,
				"0"
			)}`;

			// Create Agent record
			const agentData = {
				userId: application.applicantId,
				name: application.applicantName,
				email: application.applicantEmail,
				phoneNumber: userToUpdate.phoneNumber || "",
				profilePicture: application.applicantImg,
				fullAddress: userToUpdate.fullAddress || "",
				applicationId: application._id.toString(),
				operationalArea: application.operationalArea,
				formData: application.formData,
				agentId: agentId,
				// Map formData fields to model fields
				businessName: application.formData.businessName || "Unknown Business",
				businessType: application.formData.businessType || "Other",
				experience: application.formData.experience || "Not specified",
				warehouseAddress: application.formData.warehouseAddress || "",
				warehouseSize: application.formData.warehouseSize || "Unknown",
				coverageAreas: application.formData.coverageAreas || "",
				businessLicense: application.formData.businessLicense || "",
				warehouseImages: application.formData.warehouseImages || [],
				region:
					application.formData.region || application.operationalArea.region,
				district:
					application.formData.district || application.operationalArea.district,
				bankAccountDetails: application.formData.bankAccountDetails || "",
				references: application.formData.references || "",
				motivation: application.formData.motivation || "Join platform",
				verified: true, // Set to true since application is approved
				approvedBy: reviewerId,
				approvedAt: new Date(),
			};

			const newAgent = new Agent(agentData);
			createdRecord = await newAgent.save();
			newRole = "agent";

			// Update user operational area and set verified
			userToUpdate.operationalArea = {
				region: application.operationalArea.region,
				district: application.operationalArea.district,
			};
			userToUpdate.verified = true;
		} else if (application.applicationType === "admin-application") {
			// Generate unique admin ID
			const adminCount = await Admin.countDocuments();
			const adminId = `ADM-${Date.now()}-${String(adminCount + 1).padStart(
				4,
				"0"
			)}`;

			// Create Admin record
			const adminData = {
				userId: application.applicantId,
				name: application.applicantName,
				email: application.applicantEmail,
				phoneNumber: userToUpdate.phoneNumber || "",
				profilePicture: application.applicantImg,
				fullAddress: userToUpdate.fullAddress || "",
				applicationId: application._id.toString(),
				operationalArea: application.operationalArea,
				formData: application.formData,
				adminId: adminId,
				adminLevel: application.formData.adminLevel || "junior",
				department: application.formData.department || "operations",
				experience: {
					totalYears: application.formData.experience?.totalYears || 0,
					description: application.formData.experience?.description || "",
				},
				verified: true, // Set to true since application is approved
				approvedBy: reviewerId,
				approvedAt: new Date(),
			};

			const newAdmin = new Admin(adminData);
			createdRecord = await newAdmin.save();
			newRole = "admin";
		}


		res.json({
			success: true,
			message: "Application approved successfully.",
			application,
			userUpdated: {
				userId: userToUpdate._id,
				newRole: userToUpdate.role,
				operationalArea: userToUpdate.operationalArea,
			},
			createdRecord: createdRecord
				? {
						type: newRole,
						id: createdRecord._id,
						[newRole + "Id"]:
							createdRecord[newRole === "seller" ? "userId" : newRole + "Id"],
				  }
				: null,
		});
	} catch (error) {
		// console.error("Error approving application:", error);
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
		const { reason, reviewedBy } = req.body;
		const reviewerId = reviewedBy || req.decoded.id;

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
		// console.error("Error rejecting application:", error);
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
			reviewedBy,
		} = req.body;
		const reviewerId = reviewedBy || req.decoded.id;

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
				application.reviewedBy = reviewerId;
				application.reviewNotes = reason;

				// If approving, update user role
				if (action === "approve") {
					const userToUpdate = await User.findById(application.applicantId);
					if (userToUpdate) {
						let newRole = userToUpdate.role;
						let createdRecord = null;

						if (application.applicationType === "seller-application") {
							// Create Seller record
							const sellerData = {
								userId: application.applicantId,
								name: application.applicantName,
								email: application.applicantEmail,
								phoneNumber: userToUpdate.phoneNumber || "",
								profilePicture: application.applicantImg,
								fullAddress: userToUpdate.fullAddress || "",
								applicationId: application._id.toString(),
								operationalArea: application.operationalArea,
								formData: application.formData,
								// Map formData fields to model fields
								farmName: application.formData.farmName || "Unknown Farm",
								farmType: application.formData.farmType || "Other",
								farmSize: application.formData.farmSize || "Unknown",
								experience: application.formData.experience || "Not specified",
								farmAddress: application.formData.farmAddress || "",
								specialization:
									application.formData.specialization || "General farming",
								certifications: application.formData.certifications || "",
								nidNumber: application.formData.nidNumber || "",
								nidCopy: application.formData.nidCopy || "",
								farmPhotos: application.formData.farmPhotos || [],
								region:
									application.formData.region ||
									application.operationalArea.region,
								district:
									application.formData.district ||
									application.operationalArea.district,
								upazila: application.formData.upazila || "",
								village: application.formData.village || "",
								bankAccountDetails:
									application.formData.bankAccountDetails || "",
								references: application.formData.references || "",
								motivation: application.formData.motivation || "Join platform",
								verified: true, // Set to true since application is approved
								approvedBy: reviewerId,
								approvedAt: new Date(),
							};

							const newSeller = new Seller(sellerData);
							createdRecord = await newSeller.save();
							newRole = "seller";

							// Update user operational area
							userToUpdate.operationalArea = {
								region: application.operationalArea.region,
								district: application.operationalArea.district,
							};
						} else if (application.applicationType === "agent-application") {
							// Generate unique agent ID
							const agentCount = await Agent.countDocuments();
							const agentId = `AGT-${Date.now()}-${String(
								agentCount + 1
							).padStart(4, "0")}`;

							// Create Agent record
							const agentData = {
								userId: application.applicantId,
								name: application.applicantName,
								email: application.applicantEmail,
								phoneNumber: userToUpdate.phoneNumber || "",
								profilePicture: application.applicantImg,
								fullAddress: userToUpdate.fullAddress || "",
								applicationId: application._id.toString(),
								operationalArea: application.operationalArea,
								formData: application.formData,
								agentId: agentId,
								// Map formData fields to model fields
								businessName:
									application.formData.businessName || "Unknown Business",
								businessType: application.formData.businessType || "Other",
								experience: application.formData.experience || "Not specified",
								warehouseAddress: application.formData.warehouseAddress || "",
								warehouseSize: application.formData.warehouseSize || "Unknown",
								coverageAreas: application.formData.coverageAreas || "",
								businessLicense: application.formData.businessLicense || "",
								warehouseImages: application.formData.warehouseImages || [],
								region:
									application.formData.region ||
									application.operationalArea.region,
								district:
									application.formData.district ||
									application.operationalArea.district,
								bankAccountDetails:
									application.formData.bankAccountDetails || "",
								references: application.formData.references || "",
								motivation: application.formData.motivation || "Join platform",
								verified: true, // Set to true since application is approved
								approvedBy: reviewerId,
								approvedAt: new Date(),
							};

							const newAgent = new Agent(agentData);
							createdRecord = await newAgent.save();
							newRole = "agent";

							// Update user operational area and set verified
							userToUpdate.operationalArea = {
								region: application.operationalArea.region,
								district: application.operationalArea.district,
							};
							userToUpdate.verified = true;
						} else if (application.applicationType === "admin-application") {
							// Generate unique admin ID
							const adminCount = await Admin.countDocuments();
							const generatedAdminId = `ADM-${Date.now()}-${String(
								adminCount + 1
							).padStart(4, "0")}`;

							// Create Admin record
							const adminData = {
								userId: application.applicantId,
								name: application.applicantName,
								email: application.applicantEmail,
								phoneNumber: userToUpdate.phoneNumber || "",
								profilePicture: application.applicantImg,
								fullAddress: userToUpdate.fullAddress || "",
								applicationId: application._id.toString(),
								operationalArea: application.operationalArea,
								formData: application.formData,
								adminId: generatedAdminId,
								adminLevel: application.formData.adminLevel || "junior",
								department: application.formData.department || "operations",
								experience: {
									totalYears: application.formData.experience?.totalYears || 0,
									description:
										application.formData.experience?.description || "",
								},
								verified: true, // Set to true since application is approved
								approvedBy: reviewerId,
								approvedAt: new Date(),
							};

							const newAdmin = new Admin(adminData);
							createdRecord = await newAdmin.save();
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
		// console.error("Error performing bulk application action:", error);
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
		// console.error("Error fetching application statistics:", error);
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

		// If approved, update user role and create model entries
		if (status === "approved") {
			const userToUpdate = await User.findById(application.applicantId);
			if (userToUpdate) {
				let newRole = userToUpdate.role;
				let createdRecord = null;

				if (application.applicationType === "seller-application") {
					// Create Seller record
					const sellerData = {
						userId: application.applicantId,
						name: application.applicantName,
						email: application.applicantEmail,
						phoneNumber: userToUpdate.phoneNumber || "",
						profilePicture: application.applicantImg,
						fullAddress: userToUpdate.fullAddress || "",
						applicationId: application._id.toString(),
						operationalArea: application.operationalArea,
						formData: application.formData,
						// Map formData fields to model fields
						farmName: application.formData.farmName || "Unknown Farm",
						farmType: application.formData.farmType || "Other",
						farmSize: application.formData.farmSize || "Unknown",
						experience: application.formData.experience || "Not specified",
						farmAddress: application.formData.farmAddress || "",
						specialization:
							application.formData.specialization || "General farming",
						certifications: application.formData.certifications || "",
						nidNumber: application.formData.nidNumber || "",
						nidCopy: application.formData.nidCopy || "",
						farmPhotos: application.formData.farmPhotos || [],
						region:
							application.formData.region || application.operationalArea.region,
						district:
							application.formData.district ||
							application.operationalArea.district,
						upazila: application.formData.upazila || "",
						village: application.formData.village || "",
						bankAccountDetails: application.formData.bankAccountDetails || "",
						references: application.formData.references || "",
						motivation: application.formData.motivation || "Join platform",
						verified: true,
						approvedBy: reviewerId,
						approvedAt: new Date(),
					};

					const newSeller = new Seller(sellerData);
					createdRecord = await newSeller.save();
					newRole = "seller";
				} else if (application.applicationType === "agent-application") {
					// Generate unique agent ID
					const agentCount = await Agent.countDocuments();
					const agentId = `AGT-${Date.now()}-${String(agentCount + 1).padStart(
						4,
						"0"
					)}`;

					// Create Agent record
					const agentData = {
						userId: application.applicantId,
						name: application.applicantName,
						email: application.applicantEmail,
						phoneNumber: userToUpdate.phoneNumber || "",
						profilePicture: application.applicantImg,
						fullAddress: userToUpdate.fullAddress || "",
						applicationId: application._id.toString(),
						operationalArea: application.operationalArea,
						formData: application.formData,
						agentId: agentId,
						// Map formData fields to model fields
						businessName:
							application.formData.businessName || "Unknown Business",
						businessType: application.formData.businessType || "Other",
						experience: application.formData.experience || "Not specified",
						warehouseAddress: application.formData.warehouseAddress || "",
						warehouseSize: application.formData.warehouseSize || "Unknown",
						coverageAreas: application.formData.coverageAreas || "",
						businessLicense: application.formData.businessLicense || "",
						warehouseImages: application.formData.warehouseImages || [],
						region:
							application.formData.region || application.operationalArea.region,
						district:
							application.formData.district ||
							application.operationalArea.district,
						bankAccountDetails: application.formData.bankAccountDetails || "",
						references: application.formData.references || "",
						motivation: application.formData.motivation || "Join platform",
						verified: true,
						approvedBy: reviewerId,
						approvedAt: new Date(),
					};

					const newAgent = new Agent(agentData);
					createdRecord = await newAgent.save();
					newRole = "agent";
					userToUpdate.verified = true;
				} else if (application.applicationType === "admin-application") {
					newRole = "admin";
				}

				userToUpdate.role = newRole;

				// Update user operational area
				userToUpdate.operationalArea = {
					region: application.operationalArea.region,
					district: application.operationalArea.district,
				};

				await userToUpdate.save();
				// console.log(
				// 	`Application ${application._id} approved. User ${
				// 		application.applicantId
				// 	} role updated to ${newRole}. Created record: ${
				// 		createdRecord ? createdRecord._id : "None"
				// 	}`
				// );
			}
		}

		await application.save();
		res.json({
			success: true,
			message: "Application status updated.",
			application,
		});
	} catch (error) {
		// console.error("Error updating application status:", error);
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
		// console.error("Error adding note to application:", error);
		res.status(500).json({
			success: false,
			message: "Server error while adding note.",
			error: error.message,
		});
	}
};

// AGENT-SPECIFIC ENDPOINTS

// 1. Agent-Specific Application Filtering
export const getAgentApplications = async (req, res) => {
	try {
		const agentId = req.decoded.id;
		const {
			status,
			search,
			page = 1,
			limit = 10,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// Get agent's operational area from user profile
		const agent = await User.findById(agentId);
		if (!agent || agent.role !== "agent") {
			return res.status(403).json({
				success: false,
				message: "Access denied. Only agents can use this endpoint.",
			});
		}

		if (
			!agent.operationalArea ||
			!agent.operationalArea.region ||
			!agent.operationalArea.district
		) {
			return res.status(400).json({
				success: false,
				message: "Agent's operational area is not properly configured.",
			});
		}

		// Build query for seller applications in agent's operational area
		const query = {
			applicationType: "seller-application",
			"operationalArea.region": agent.operationalArea.region,
			"operationalArea.district": agent.operationalArea.district,
		};

		// Filter by status if specified
		if (status && status !== "all") {
			query.status = status;
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
			agentOperationalArea: {
				region: agent.operationalArea.region,
				district: agent.operationalArea.district,
			},
		});
	} catch (error) {
		// console.error("Error fetching agent applications:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching agent applications.",
			error: error.message,
		});
	}
};

// 2. Agent Role Assignment Check
export const getAgentOperationalArea = async (req, res) => {
	try {
		const agentId = req.decoded.id;

		// Get agent's profile
		const agent = await User.findById(agentId).select(
			"name email role operationalArea verified"
		);

		if (!agent || agent.role !== "agent") {
			return res.status(403).json({
				success: false,
				message: "Access denied. Only agents can use this endpoint.",
			});
		}

		// Check if operational area is properly configured
		const hasOperationalArea =
			agent.operationalArea &&
			agent.operationalArea.region &&
			agent.operationalArea.district;

		res.json({
			success: true,
			message: "Agent operational area retrieved successfully.",
			agent: {
				id: agent._id,
				name: agent.name,
				email: agent.email,
				role: agent.role,
				verified: agent.verified,
				operationalArea: agent.operationalArea || null,
				hasValidOperationalArea: hasOperationalArea,
			},
		});
	} catch (error) {
		// console.error("Error fetching agent operational area:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching agent operational area.",
			error: error.message,
		});
	}
};

// 3. Enhanced Agent Statistics
export const getAgentApplicationStatistics = async (req, res) => {
	try {
		const agentId = req.decoded.id;

		// Get agent's operational area
		const agent = await User.findById(agentId);
		if (!agent || agent.role !== "agent") {
			return res.status(403).json({
				success: false,
				message: "Access denied. Only agents can use this endpoint.",
			});
		}

		if (
			!agent.operationalArea ||
			!agent.operationalArea.region ||
			!agent.operationalArea.district
		) {
			return res.status(400).json({
				success: false,
				message: "Agent's operational area is not properly configured.",
			});
		}

		// Base query for agent's operational area
		const baseQuery = {
			applicationType: "seller-application",
			"operationalArea.region": agent.operationalArea.region,
			"operationalArea.district": agent.operationalArea.district,
		};

		// Get counts by status
		const [total, pending, approved, rejected, inReview] = await Promise.all([
			Application.countDocuments(baseQuery),
			Application.countDocuments({ ...baseQuery, status: "pending" }),
			Application.countDocuments({ ...baseQuery, status: "approved" }),
			Application.countDocuments({ ...baseQuery, status: "rejected" }),
			Application.countDocuments({ ...baseQuery, status: "in-review" }),
		]);

		// Get applications by date (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentApplications = await Application.aggregate([
			{
				$match: {
					...baseQuery,
					createdAt: { $gte: thirtyDaysAgo },
				},
			},
			{
				$group: {
					_id: {
						$dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		res.json({
			success: true,
			message: "Agent application statistics retrieved successfully",
			operationalArea: {
				region: agent.operationalArea.region,
				district: agent.operationalArea.district,
			},
			statistics: {
				total,
				pending,
				approved,
				rejected,
				inReview,
				recentTrend: recentApplications,
			},
		});
	} catch (error) {
		// console.error("Error fetching agent application statistics:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching agent statistics.",
			error: error.message,
		});
	}
};

// Get user's own application status
export const getUserApplicationStatus = async (req, res) => {
	try {
		const userId = req.decoded.id;

		// Find the most recent application for this user
		const application = await Application.findOne({
			applicantId: userId,
		}).sort({ createdAt: -1 });

		if (!application) {
			return res.json({
				success: true,
				hasApplication: false,
				applicationType: null,
				status: null,
				applicationId: null,
			});
		}

		res.json({
			success: true,
			hasApplication: true,
			applicationType: application.applicationType,
			status: application.status,
			applicationId: application._id,
			submittedAt: application.createdAt,
			reviewedAt: application.reviewedAt,
			reviewNotes: application.reviewNotes,
		});
	} catch (error) {
		// console.error("Error fetching user application status:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching application status.",
			error: error.message,
		});
	}
};

// Get user's application by userId (for admins/agents or own applications)
export const getUserApplications = async (req, res) => {
	try {
		const { userId } = req.params;
		const requesterId = req.decoded.id;
		const requesterRole = req.decoded.role;

		// Check authorization
		if (userId !== requesterId && !["admin", "agent"].includes(requesterRole)) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to view this user's applications.",
			});
		}

		// For agents, additional checks needed
		if (requesterRole === "agent" && userId !== requesterId) {
			// Get agent's operational area
			const agent = await User.findById(requesterId);
			if (!agent || !agent.operationalArea) {
				return res.status(400).json({
					success: false,
					message: "Agent's operational area is not configured.",
				});
			}

			// Find user's applications
			const userApplications = await Application.find({
				applicantId: userId,
			});

			// Check if any application is in agent's operational area
			const hasAccessibleApplication = userApplications.some(
				(app) =>
					app.applicationType === "seller-application" &&
					app.operationalArea?.region === agent.operationalArea.region &&
					app.operationalArea?.district === agent.operationalArea.district
			);

			if (!hasAccessibleApplication) {
				return res.status(403).json({
					success: false,
					message:
						"No applications found in your operational area for this user.",
				});
			}
		}

		// Fetch user's applications
		const applications = await Application.find({
			applicantId: userId,
		}).sort({ createdAt: -1 });

		res.json({
			success: true,
			applications,
			totalApplications: applications.length,
		});
	} catch (error) {
		// console.error("Error fetching user applications:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching user applications.",
			error: error.message,
		});
	}
};
