import Product from "../models/Product.js";
import User from "../models/User.js";

// Get All Users
export const getAllUsers = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			role,
			isActive,
			verified,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// Build query object
		const query = {};

		// Filter by role if specified
		if (role && role !== "all") {
			query.role = role;
		}

		// Filter by active status if specified
		if (isActive !== undefined && isActive !== "all") {
			query.isActive = isActive === "true";
		}

		// Filter by verified status if specified
		if (verified !== undefined && verified !== "all") {
			query.verified = verified === "true";
		}

		// Search by name, email, or phone number if specified
		if (search && search.trim()) {
			query.$or = [
				{ name: { $regex: search.trim(), $options: "i" } },
				{ email: { $regex: search.trim(), $options: "i" } },
				{ phoneNumber: { $regex: search.trim(), $options: "i" } },
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
		const users = await User.find(query)
			.select("-password")
			.sort(sortOptions)
			.skip(skip)
			.limit(pageSize)
			.exec();

		// Get total count for pagination
		const totalUsers = await User.countDocuments(query);
		const totalPages = Math.ceil(totalUsers / pageSize);

		// Return response in the format expected by frontend
		res.status(200).json({
			users,
			totalUsers,
			totalPages,
			currentPage: pageNumber,
			pageSize,
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching users",
			error: error.message,
		});
	}
};

// Get All Products
export const getAllProducts = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			cropType,
			status,
			quality,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// Build query object
		const query = {};

		// Filter by crop type if specified
		if (cropType && cropType !== "all") {
			query.cropType = cropType;
		}

		// Filter by status if specified
		if (status && status !== "all") {
			query.status = status;
		}

		// Filter by quality if specified
		if (quality && quality !== "all") {
			query.quality = quality;
		}

		// Search by title or description if specified
		if (search && search.trim()) {
			query.$or = [
				{ title: { $regex: search.trim(), $options: "i" } },
				{ description: { $regex: search.trim(), $options: "i" } },
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
		const products = await Product.find(query)
			.sort(sortOptions)
			.skip(skip)
			.limit(pageSize)
			.exec();

		// Get total count for pagination
		const totalProducts = await Product.countDocuments(query);
		const totalPages = Math.ceil(totalProducts / pageSize);

		// Calculate max price from all products (not just current page)
		const maxPriceResult = await Product.aggregate([
			{ $group: { _id: null, maxPrice: { $max: "$pricePerUnit" } } },
		]);
		const maxPrice = maxPriceResult.length > 0 ? maxPriceResult[0].maxPrice : 0;

		// Return response in the format expected by frontend
		res.status(200).json({
			products,
			totalProducts,
			totalPages,
			currentPage: pageNumber,
			pageSize,
			maxPrice,
		});
	} catch (error) {
		console.error("Error fetching products:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching products",
			error: error.message,
		});
	}
};

// Get User Statistics
export const getUserStats = async (req, res) => {
	try {
		const totalUsers = await User.countDocuments();
		const adminCount = await User.countDocuments({ role: "admin" });
		const agentCount = await User.countDocuments({ role: "agent" });
		const sellerCount = await User.countDocuments({ role: "seller" });
		const consumerCount = await User.countDocuments({ role: "consumer" });
		const verifiedUsers = await User.countDocuments({ verified: true });
		const unverifiedUsers = await User.countDocuments({ verified: false });

		res.status(200).json({
			success: true,
			message: "User statistics retrieved successfully",
			stats: {
				totalUsers,
				roleDistribution: {
					admin: adminCount,
					agent: agentCount,
					seller: sellerCount,
					consumer: consumerCount,
				},
				verificationStatus: {
					verified: verifiedUsers,
					unverified: unverifiedUsers,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching user statistics:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching user statistics",
			error: error.message,
		});
	}
};

// Get Product Statistics
export const getProductStats = async (req, res) => {
	try {
		const totalProducts = await Product.countDocuments();
		const approvedProducts = await Product.countDocuments({
			status: "approved",
		});
		const pendingProducts = await Product.countDocuments({ status: "pending" });
		const rejectedProducts = await Product.countDocuments({
			status: "rejected",
		});
		const suspendedProducts = await Product.countDocuments({
			status: "suspended",
		});
		const outOfStockProducts = await Product.countDocuments({
			availableStock: 0,
		});

		// Get crop type distribution
		const cropTypeStats = await Product.aggregate([
			{
				$group: {
					_id: "$cropType",
					count: { $sum: 1 },
				},
			},
		]);

		// Get quality distribution
		const qualityStats = await Product.aggregate([
			{
				$group: {
					_id: "$quality",
					count: { $sum: 1 },
				},
			},
		]);

		res.status(200).json({
			success: true,
			message: "Product statistics retrieved successfully",
			stats: {
				totalProducts,
				statusDistribution: {
					approved: approvedProducts,
					pending: pendingProducts,
					rejected: rejectedProducts,
					suspended: suspendedProducts,
					outOfStock: outOfStockProducts,
				},
				cropTypeDistribution: cropTypeStats.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {}),
				qualityDistribution: qualityStats.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {}),
			},
		});
	} catch (error) {
		console.error("Error fetching product statistics:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching product statistics",
			error: error.message,
		});
	}
};

// Get User by ID
export const getUserById = async (req, res) => {
	try {
		const { userId } = req.params;

		const user = await User.findById(userId).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "User retrieved successfully",
			user,
		});
	} catch (error) {
		console.error("Error fetching user by ID:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching user",
			error: error.message,
		});
	}
};

// Delete User (Admin only)
export const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;

		// Prevent admin from deleting themselves
		if (userId === req.decoded.id) {
			return res.status(400).json({
				success: false,
				message: "You cannot delete your own account",
			});
		}

		const user = await User.findByIdAndDelete(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Log admin action
		await createUserActionLog(userId, req.decoded.id, "deleted", {
			adminEmail: req.decoded.email,
			deletedUser: {
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
			deletedUser: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Error deleting user:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting user",
			error: error.message,
		});
	}
};

// =================== USER MANAGEMENT FUNCTIONS ===================

// Utility Functions
const createUserActionLog = async (userId, adminId, action, details = {}) => {
	try {
		const logEntry = {
			adminId,
			action,
			timestamp: new Date(),
			details,
			adminEmail: details.adminEmail || "Unknown",
		};

		// Add to user's history array
		await User.findByIdAndUpdate(userId, {
			$push: {
				adminHistory: logEntry,
			},
		});

		console.log(
			`Admin action logged: ${action} on user ${userId} by admin ${adminId}`
		);
	} catch (error) {
		console.error("Error creating user action log:", error);
	}
};

const updateUserStatus = async (userId, updates, adminId) => {
	try {
		const user = await User.findByIdAndUpdate(
			userId,
			{
				...updates,
				lastModified: new Date(),
				lastModifiedBy: adminId,
			},
			{ new: true }
		).select("-password");

		return user;
	} catch (error) {
		console.error("Error updating user status:", error);
		throw error;
	}
};

const sendNotificationToUser = async (userId, action, reason = "") => {
	try {
		const user = await User.findById(userId);

		if (user) {
			console.log(`Notification sent to user ${user.email}:`);
			console.log(`Your account has been ${action}.`);
			if (reason) {
				console.log(`Reason: ${reason}`);
			}

			// Here you would implement actual notification sending
			// Example:
			// await emailService.send({
			//     to: user.email,
			//     subject: `Account ${action}`,
			//     template: "account-status-update",
			//     data: { userName: user.name, action, reason }
			// });
		}
	} catch (error) {
		console.error("Error sending notification to user:", error);
	}
};

const validateBulkAction = (action, userIds) => {
	const allowedActions = [
		"activate",
		"suspend",
		"delete",
		"verify",
		"export-selected",
	];

	if (!allowedActions.includes(action)) {
		throw new Error(`Invalid bulk action: ${action}`);
	}

	if (!Array.isArray(userIds) || userIds.length === 0) {
		throw new Error("User IDs array is required for bulk actions");
	}

	if (userIds.length > 100) {
		throw new Error("Bulk action limited to 100 users at a time");
	}

	return true;
};

const generateUserReport = async (users) => {
	return users.map((user) => ({
		id: user._id,
		name: user.name,
		email: user.email,
		role: user.role,
		verified: user.verified,
		isActive: user.isActive,
		createdAt: user.createdAt,
		lastLogin: user.lastLogin || "Never",
		region: user.operationalArea?.region || "N/A",
		district: user.operationalArea?.district || "N/A",
	}));
};

// User Management Functions
export const suspendUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { reason = "Account suspended by admin" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		// Prevent admin from suspending themselves
		if (userId === adminId) {
			return res.status(400).json({
				success: false,
				message: "You cannot suspend your own account",
			});
		}

		const user = await updateUserStatus(userId, { isActive: false }, adminId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Log admin action
		await createUserActionLog(userId, adminId, "suspended", {
			reason,
			adminEmail,
			previousStatus: "active",
		});

		// Send notification to user
		await sendNotificationToUser(userId, "suspended", reason);

		res.status(200).json({
			success: true,
			message: "User suspended successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				isActive: user.isActive,
				reason,
				suspendedBy: adminEmail,
				suspendedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error suspending user:", error);
		res.status(500).json({
			success: false,
			message: "Server error while suspending user",
			error: error.message,
		});
	}
};

export const activateUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { reason = "Account activated by admin" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		const user = await updateUserStatus(userId, { isActive: true }, adminId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Log admin action
		await createUserActionLog(userId, adminId, "activated", {
			reason,
			adminEmail,
			previousStatus: "suspended",
		});

		// Send notification to user
		await sendNotificationToUser(userId, "activated", reason);

		res.status(200).json({
			success: true,
			message: "User activated successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				isActive: user.isActive,
				reason,
				activatedBy: adminEmail,
				activatedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error activating user:", error);
		res.status(500).json({
			success: false,
			message: "Server error while activating user",
			error: error.message,
		});
	}
};

export const editUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const updateData = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		// Remove sensitive fields that shouldn't be updated
		delete updateData.password;
		delete updateData._id;
		delete updateData.adminHistory;

		// Add admin modification metadata
		updateData.lastModified = new Date();
		updateData.lastModifiedBy = adminId;

		const user = await User.findByIdAndUpdate(userId, updateData, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Log admin action
		await createUserActionLog(userId, adminId, "edited", {
			updatedFields: Object.keys(updateData),
			adminEmail,
			editReason: updateData.editReason || "Admin modification",
		});

		// Send notification to user
		await sendNotificationToUser(
			userId,
			"edited",
			updateData.editReason || "Your profile has been updated by admin"
		);

		res.status(200).json({
			success: true,
			message: "User updated successfully",
			user,
		});
	} catch (error) {
		console.error("Error editing user:", error);
		res.status(500).json({
			success: false,
			message: "Server error while editing user",
			error: error.message,
		});
	}
};

export const getUserHistory = async (req, res) => {
	try {
		const { userId } = req.params;

		const user = await User.findById(userId)
			.select(
				"name email adminHistory createdAt lastModified isActive verified role"
			)
			.exec();

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Sort history by timestamp (newest first)
		const history = user.adminHistory
			? user.adminHistory.sort(
					(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
			  )
			: [];

		res.status(200).json({
			success: true,
			message: "User history retrieved successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
				verified: user.verified,
				createdAt: user.createdAt,
				lastModified: user.lastModified,
			},
			history,
			totalActions: history.length,
		});
	} catch (error) {
		console.error("Error fetching user history:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching user history",
			error: error.message,
		});
	}
};

export const bulkUserAction = async (req, res) => {
	try {
		const {
			action,
			userIds,
			reason = "Bulk action performed by admin",
		} = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		// Validate bulk action
		validateBulkAction(action, userIds);

		// Remove admin's own ID from bulk actions to prevent self-modification
		const filteredUserIds = userIds.filter((id) => id !== adminId);

		if (filteredUserIds.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid users to perform bulk action on",
			});
		}

		const results = {
			successful: [],
			failed: [],
			total: filteredUserIds.length,
		};

		// Perform bulk action based on type
		for (const userId of filteredUserIds) {
			try {
				let updateData = {};
				let actionName = action;

				switch (action) {
					case "activate":
						updateData = { isActive: true };
						break;
					case "suspend":
						updateData = { isActive: false };
						break;
					case "verify":
						updateData = { verified: true };
						break;
					case "delete":
						await User.findByIdAndDelete(userId);
						actionName = "deleted";
						break;
					default:
						throw new Error(`Unsupported action: ${action}`);
				}

				if (action !== "delete") {
					await updateUserStatus(userId, updateData, adminId);
				}

				// Log admin action
				await createUserActionLog(userId, adminId, actionName, {
					reason,
					adminEmail,
					bulkAction: true,
				});

				// Send notification to user
				await sendNotificationToUser(userId, actionName, reason);

				results.successful.push(userId);
			} catch (error) {
				console.error(`Error processing user ${userId}:`, error);
				results.failed.push({
					userId,
					error: error.message,
				});
			}
		}

		res.status(200).json({
			success: true,
			message: `Bulk ${action} completed`,
			results,
		});
	} catch (error) {
		console.error("Error performing bulk user action:", error);
		res.status(500).json({
			success: false,
			message: "Server error while performing bulk action",
			error: error.message,
		});
	}
};

export const exportUsers = async (req, res) => {
	try {
		const { format = "json", role, verified, isActive, userIds } = req.query;

		let query = {};

		// Build query based on filters
		if (role) query.role = role;
		if (verified !== undefined) query.verified = verified === "true";
		if (isActive !== undefined) query.isActive = isActive === "true";
		if (userIds) query._id = { $in: userIds.split(",") };

		const users = await User.find(query).select("-password").exec();

		if (!users || users.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No users found for export",
			});
		}

		const userReport = await generateUserReport(users);

		if (format === "csv") {
			// Convert to CSV format
			const csvHeader =
				"ID,Name,Email,Role,Verified,Active,Created At,Region,District\n";
			const csvData = userReport
				.map(
					(user) =>
						`${user.id},${user.name},${user.email},${user.role},${user.verified},${user.isActive},${user.createdAt},${user.region},${user.district}`
				)
				.join("\n");

			res.setHeader("Content-Type", "text/csv");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename=users-export-${Date.now()}.csv`
			);
			res.status(200).send(csvHeader + csvData);
		} else {
			// JSON format
			res.status(200).json({
				success: true,
				message: "Users exported successfully",
				data: userReport,
				exportedAt: new Date(),
				totalUsers: userReport.length,
			});
		}
	} catch (error) {
		console.error("Error exporting users:", error);
		res.status(500).json({
			success: false,
			message: "Server error while exporting users",
			error: error.message,
		});
	}
};

export const verifyUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { reason = "User verified by admin" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		const user = await updateUserStatus(userId, { verified: true }, adminId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Log admin action
		await createUserActionLog(userId, adminId, "verified", {
			reason,
			adminEmail,
			previousStatus: "unverified",
		});

		// Send notification to user
		await sendNotificationToUser(userId, "verified", reason);

		res.status(200).json({
			success: true,
			message: "User verified successfully",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				verified: user.verified,
				reason,
				verifiedBy: adminEmail,
				verifiedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error verifying user:", error);
		res.status(500).json({
			success: false,
			message: "Server error while verifying user",
			error: error.message,
		});
	}
};

export const changeUserRole = async (req, res) => {
	try {
		const { userId } = req.params;
		const { newRole, reason = "Role changed by admin" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		// Validate role
		const validRoles = ["admin", "agent", "seller", "consumer"];
		if (!validRoles.includes(newRole)) {
			return res.status(400).json({
				success: false,
				message: "Invalid role specified",
			});
		}

		// Prevent admin from changing their own role
		if (userId === adminId) {
			return res.status(400).json({
				success: false,
				message: "You cannot change your own role",
			});
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		const previousRole = user.role;
		const updatedUser = await updateUserStatus(
			userId,
			{ role: newRole },
			adminId
		);

		// Log admin action
		await createUserActionLog(userId, adminId, "role_changed", {
			reason,
			adminEmail,
			previousRole,
			newRole,
		});

		// Send notification to user
		await sendNotificationToUser(userId, `role changed to ${newRole}`, reason);

		res.status(200).json({
			success: true,
			message: "User role changed successfully",
			user: {
				id: updatedUser._id,
				name: updatedUser.name,
				email: updatedUser.email,
				previousRole,
				newRole: updatedUser.role,
				reason,
				changedBy: adminEmail,
				changedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error changing user role:", error);
		res.status(500).json({
			success: false,
			message: "Server error while changing user role",
			error: error.message,
		});
	}
};

// =================== PRODUCT MANAGEMENT FUNCTIONS ===================

// Utility Functions
const createAdminActionLog = async (
	productId,
	adminId,
	action,
	details = {}
) => {
	try {
		const logEntry = {
			adminId,
			action,
			timestamp: new Date(),
			details,
			adminEmail: details.adminEmail || "Unknown",
		};

		// Add to product's history array
		await Product.findByIdAndUpdate(productId, {
			$push: {
				adminHistory: logEntry,
			},
		});

		console.log(
			`Admin action logged: ${action} on product ${productId} by admin ${adminId}`
		);
	} catch (error) {
		console.error("Error creating admin action log:", error);
	}
};

const updateProductStatus = async (productId, status, adminId, reason = "") => {
	try {
		const product = await Product.findByIdAndUpdate(
			productId,
			{
				status,
				lastModified: new Date(),
				...(reason && { statusReason: reason }),
			},
			{ new: true }
		).populate("sellerId", "name email");

		return product;
	} catch (error) {
		console.error("Error updating product status:", error);
		throw error;
	}
};

const sendNotificationToSeller = async (
	sellerId,
	productId,
	action,
	reason = ""
) => {
	try {
		// This is a placeholder for notification system
		// In a real implementation, you would integrate with:
		// - Email service (SendGrid, Nodemailer, etc.)
		// - Push notification service
		// - In-app notification system

		const seller = await User.findById(sellerId);
		const product = await Product.findById(productId);

		if (seller && product) {
			console.log(`Notification sent to seller ${seller.email}:`);
			console.log(`Product "${product.name}" has been ${action}.`);
			if (reason) {
				console.log(`Reason: ${reason}`);
			}

			// Here you would implement actual notification sending
			// Example:
			// await emailService.send({
			//     to: seller.email,
			//     subject: `Product ${action}`,
			//     template: "product-status-update",
			//     data: { productName: product.name, action, reason }
			// });
		}
	} catch (error) {
		console.error("Error sending notification to seller:", error);
	}
};

// Product Management Functions
export const approveProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const { reason = "Product meets all requirements" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		const product = await updateProductStatus(
			productId,
			"approved",
			adminId,
			reason
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Create admin action log
		await createAdminActionLog(productId, adminId, "approved", {
			reason,
			adminEmail,
			previousStatus: product.status,
		});

		// Send notification to seller
		await sendNotificationToSeller(
			product.sellerId._id,
			productId,
			"approved",
			reason
		);

		res.status(200).json({
			success: true,
			message: "Product approved successfully",
			product: {
				id: product._id,
				name: product.name,
				status: product.status,
				reason,
				approvedBy: adminEmail,
				approvedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error approving product:", error);
		res.status(500).json({
			success: false,
			message: "Server error while approving product",
			error: error.message,
		});
	}
};

export const rejectProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const { reason = "Product does not meet requirements" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		if (!reason || reason.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Reason for rejection is required",
			});
		}

		const product = await updateProductStatus(
			productId,
			"rejected",
			adminId,
			reason
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Create admin action log
		await createAdminActionLog(productId, adminId, "rejected", {
			reason,
			adminEmail,
			previousStatus: product.status,
		});

		// Send notification to seller
		await sendNotificationToSeller(
			product.sellerId._id,
			productId,
			"rejected",
			reason
		);

		res.status(200).json({
			success: true,
			message: "Product rejected successfully",
			product: {
				id: product._id,
				name: product.name,
				status: product.status,
				reason,
				rejectedBy: adminEmail,
				rejectedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error rejecting product:", error);
		res.status(500).json({
			success: false,
			message: "Server error while rejecting product",
			error: error.message,
		});
	}
};

export const suspendProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const { reason = "Product suspended for review" } = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		if (!reason || reason.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Reason for suspension is required",
			});
		}

		const product = await updateProductStatus(
			productId,
			"suspended",
			adminId,
			reason
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Create admin action log
		await createAdminActionLog(productId, adminId, "suspended", {
			reason,
			adminEmail,
			previousStatus: product.status,
		});

		// Send notification to seller
		await sendNotificationToSeller(
			product.sellerId._id,
			productId,
			"suspended",
			reason
		);

		res.status(200).json({
			success: true,
			message: "Product suspended successfully",
			product: {
				id: product._id,
				name: product.name,
				status: product.status,
				reason,
				suspendedBy: adminEmail,
				suspendedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error suspending product:", error);
		res.status(500).json({
			success: false,
			message: "Server error while suspending product",
			error: error.message,
		});
	}
};

export const editProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const updateData = req.body;
		const adminId = req.decoded.id;
		const adminEmail = req.decoded.email;

		// Remove fields that shouldn't be updated directly
		delete updateData._id;
		delete updateData.sellerId;
		delete updateData.adminHistory;

		// Add admin modification metadata
		updateData.lastModified = new Date();
		updateData.lastModifiedBy = adminId;

		const product = await Product.findByIdAndUpdate(productId, updateData, {
			new: true,
			runValidators: true,
		}).populate("sellerId", "name email");

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Create admin action log
		await createAdminActionLog(productId, adminId, "edited", {
			updatedFields: Object.keys(updateData),
			adminEmail,
			editReason: updateData.editReason || "Admin modification",
		});

		// Send notification to seller
		await sendNotificationToSeller(
			product.sellerId._id,
			productId,
			"edited",
			updateData.editReason || "Your product has been modified by admin"
		);

		res.status(200).json({
			success: true,
			message: "Product updated successfully",
			product,
		});
	} catch (error) {
		console.error("Error editing product:", error);
		res.status(500).json({
			success: false,
			message: "Server error while editing product",
			error: error.message,
		});
	}
};

export const getProductHistory = async (req, res) => {
	try {
		const { productId } = req.params;

		const product = await Product.findById(productId)
			.select("name status adminHistory createdAt lastModified")
			.populate("sellerId", "name email");

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Sort history by timestamp (newest first)
		const history = product.adminHistory
			? product.adminHistory.sort(
					(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
			  )
			: [];

		res.status(200).json({
			success: true,
			message: "Product history retrieved successfully",
			product: {
				id: product._id,
				name: product.name,
				currentStatus: product.status,
				seller: product.sellerId,
				createdAt: product.createdAt,
				lastModified: product.lastModified,
			},
			history,
			totalActions: history.length,
		});
	} catch (error) {
		console.error("Error fetching product history:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching product history",
			error: error.message,
		});
	}
};
