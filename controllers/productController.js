import Product from "../models/Product.js";
import User from "../models/User.js";
import AgentReviewHistory from "../models/AgentReviewHistory.js";

// Add a new product
export const addProduct = async (req, res) => {
	try {
		const { sellerInfo } = req.body;

		// Check if seller is verified
		const seller = await User.findById(sellerInfo?._id).exec();

		if (!seller) {
			return res.status(403).json({
				success: false,
				message: "User data not found",
			});
		} else if (!seller?.verified) {
			return res.status(403).json({
				success: false,
				message: "Seller is not verified",
			});
		}

		const newProduct = new Product({
			...req.body,
			quality: "D",
			approvedBy: { agentId: null, approvedAt: null },
			averageRating: 0,
		});

		await newProduct.save();

		res.status(201).json({
			success: true,
			product: newProduct,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get all approved products
export const getAllProducts = async (req, res) => {
	try {
		const {
			cropType,
			region,
			district,
			minPrice,
			maxPrice,
			page = 1,
			limit = 10,
		} = req.query;

		let query = { status: "approved" };

		if (cropType) query.cropType = cropType;
		if (region) query["sellerInfo.operationalArea.region"] = region;
		if (district) query["sellerInfo.operationalArea.district"] = district;

		if (minPrice || maxPrice) {
			query.pricePerUnit = {};
			if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
			if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
		}

		const maxPriceResult = await Product.aggregate([
			{ $match: { status: "approved" } },
			{ $group: { _id: null, maxPrice: { $max: "$pricePerUnit" } } },
		]);

		const existingMaxPrice =
			maxPriceResult.length > 0 ? maxPriceResult[0].maxPrice : 0;

		const options = {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			sort: { createdAt: -1 },
		};

		const products = await Product.find(query)
			.skip((options.page - 1) * options.limit)
			.limit(options.limit)
			.sort(options.sort);

		const total = await Product.countDocuments(query);

		res.status(200).json({
			success: true,
			products,
			totalPages: Math.ceil(total / options.limit),
			currentPage: options.page,
			totalProducts: total,
			maxPrice: existingMaxPrice,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Search products
export const searchProducts = async (req, res) => {
	try {
		const {
			cropType,
			region,
			minPrice,
			maxPrice,
			page = 1,
			limit = 10,
		} = req.query;

		let query = { status: "approved" };

		if (cropType) query.cropType = cropType;
		if (region) query["sellerInfo.operationalArea.region"] = region;

		if (minPrice || maxPrice) {
			query.pricePerUnit = {};
			if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
			if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
		}

		const options = {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			sort: { createdAt: -1 },
		};

		const products = await Product.find(query)
			.skip((options.page - 1) * options.limit)
			.limit(options.limit)
			.sort(options.sort);

		const total = await Product.countDocuments(query);

		res.status(200).json({
			success: true,
			products,
			totalPages: Math.ceil(total / options.limit),
			currentPage: options.page,
			totalProducts: total,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get product by ID
export const getProductById = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await Product.findById(id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		res.status(200).json({
			success: true,
			product,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Seller Products
export const getProductsBySeller = async (req, res) => {
	const { email } = req.params;
	if (!email) {
		return res.status(400).json({
			success: false,
			message: "Missing seller email in URL",
		});
	}
	try {
		const products = await Product.find({ "sellerInfo.email": email }).lean();
		res.status(200).json({
			success: true,
			products,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get crop types
export const getCropTypes = async (req, res) => {
	try {
		const cropTypes = await Product.distinct("cropType", {
			cropType: { $ne: null },
		});
		cropTypes.sort();

		res.status(200).json({
			success: true,
			data: cropTypes,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Agent approves product
export const approveProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const agentId = req.decoded.id;

		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		const agent = await User.findById(agentId);
		if (agent.region !== product.sellerInfo.operationalArea.region) {
			return res.status(403).json({
				success: false,
				message: "Agent can only approve products from their assigned region",
			});
		}

		product.status = "approved";
		product.approvedBy = {
			agentId,
			approvedAt: new Date(),
		};

		await product.save();

		res.status(200).json({
			success: true,
			product,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Delete product
export const deleteProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.decoded.id;

		const product = await Product.findById(id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		if (
			product.sellerInfo._id.toString() !== userId &&
			req.decoded.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this product",
			});
		}

		await Product.findByIdAndDelete(id);

		res.status(200).json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ============================
// AGENT-SPECIFIC ROUTES
// ============================

// 1. Get Regional Products
export const getAgentRegionalProducts = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			region,
			district,
			status,
			cropType,
			search,
		} = req.query;

		const agentId = req.decoded.id;

		// Get agent's operational area
		const agent = await User.findById(agentId);
		if (!agent || !agent.operationalArea) {
			return res.status(403).json({
				success: false,
				message: "Agent has no operational area assigned",
				error: {
					code: "OPERATIONAL_AREA_NOT_ASSIGNED",
					details: "Agent has no operational area assigned",
				},
			});
		}

		// Build query with regional filtering
		let query = {
			"sellerInfo.operationalArea.region":
				region || agent.operationalArea.region,
			"sellerInfo.operationalArea.district":
				district || agent.operationalArea.district,
		};

		if (status) query.status = status;
		if (cropType) query.cropType = cropType;
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ cropType: { $regex: search, $options: "i" } },
				{ "sellerInfo.name": { $regex: search, $options: "i" } },
			];
		}

		const options = {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			sort: { "timeline.submittedAt": -1 },
		};

		const products = await Product.find(query)
			.skip((options.page - 1) * options.limit)
			.limit(options.limit)
			.sort(options.sort);

		const total = await Product.countDocuments(query);

		// Format response according to specification
		const formattedProducts = products.map((product) => ({
			id: product._id,
			title: product.title,
			description: product.description,
			category: product.cropType,
			price: product.pricePerUnit,
			unit: product.unit,
			stock: product.availableStock,
			minimumOrderQuantity: product.minimumOrderQuantity,
			qualityScore: product.qualityScore || 0,
			image: product.images?.[0] || "",
			status: product.status,
			seller: {
				id: product.sellerInfo._id,
				name: product.sellerInfo.name,
				farmName: product.sellerInfo.farmName || "",
				email: product.sellerInfo.email,
				phone: product.sellerInfo.phone,
			},
			location: {
				region: product.sellerInfo.operationalArea.region,
				district: product.sellerInfo.operationalArea.district,
				upazila: product.sellerInfo.operationalArea.upazila || "",
				address: product.sellerInfo.operationalArea.address || "",
			},
			submittedAt: product.timeline?.submittedAt || product.createdAt,
			approvedAt: product.approvedBy?.approvedAt || null,
			approvedBy: product.approvedBy?.agentId || null,
			rejectedAt: product.rejectedAt || null,
			rejectionReason: product.rejectionReason || null,
			suspendedAt: product.suspendedAt || null,
			suspensionReason: product.suspensionReason || null,
		}));

		res.status(200).json({
			success: true,
			message: "Regional products retrieved successfully",
			products: formattedProducts,
			totalProducts: total,
			totalPages: Math.ceil(total / options.limit),
			currentPage: options.page,
			hasNextPage: options.page < Math.ceil(total / options.limit),
			hasPreviousPage: options.page > 1,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 2. Get Agent Statistics
export const getAgentStatistics = async (req, res) => {
	try {
		const agentId = req.decoded.id;

		// Get agent's operational area
		const agent = await User.findById(agentId);
		if (!agent || !agent.operationalArea) {
			return res.status(403).json({
				success: false,
				message: "Agent has no operational area assigned",
				error: {
					code: "OPERATIONAL_AREA_NOT_ASSIGNED",
					details: "Agent has no operational area assigned",
				},
			});
		}

		const regionQuery = {
			"sellerInfo.operationalArea.region": agent.operationalArea.region,
			"sellerInfo.operationalArea.district": agent.operationalArea.district,
		};

		const [total, pending, approved, rejected, live, suspended] =
			await Promise.all([
				Product.countDocuments(regionQuery),
				Product.countDocuments({ ...regionQuery, status: "pending" }),
				Product.countDocuments({
					...regionQuery,
					status: "approved",
					"approvedBy.agentId": agentId,
				}),
				Product.countDocuments({ ...regionQuery, status: "rejected" }),
				Product.countDocuments({ ...regionQuery, status: "live" }),
				Product.countDocuments({ ...regionQuery, status: "suspended" }),
			]);

		// Calculate average quality score
		const qualityScoreResult = await Product.aggregate([
			{ $match: regionQuery },
			{ $group: { _id: null, avgQuality: { $avg: "$qualityScore" } } },
		]);
		const avgQualityScore =
			qualityScoreResult.length > 0 ? qualityScoreResult[0].avgQuality : 0;

		// This month statistics
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const thisMonthQuery = {
			...regionQuery,
			"timeline.submittedAt": { $gte: startOfMonth },
		};

		const [thisMonthReviewed, thisMonthApproved, thisMonthRejected] =
			await Promise.all([
				Product.countDocuments({
					...thisMonthQuery,
					$or: [{ status: "approved" }, { status: "rejected" }],
				}),
				Product.countDocuments({ ...thisMonthQuery, status: "approved" }),
				Product.countDocuments({ ...thisMonthQuery, status: "rejected" }),
			]);

		// Top categories
		const topCategories = await Product.aggregate([
			{ $match: regionQuery },
			{ $group: { _id: "$cropType", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 5 },
			{ $project: { category: "$_id", count: 1, _id: 0 } },
		]);

		res.status(200).json({
			success: true,
			message: "Agent statistics retrieved successfully",
			statistics: {
				total,
				pending,
				approved,
				rejected,
				live,
				suspended,
				avgQualityScore: Number(avgQualityScore.toFixed(1)),
				thisMonth: {
					reviewed: thisMonthReviewed,
					approved: thisMonthApproved,
					rejected: thisMonthRejected,
				},
				topCategories,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 3. Get Operational Area Info
export const getAgentOperationalArea = async (req, res) => {
	try {
		const agentId = req.decoded.id;

		// Get agent's operational area
		const agent = await User.findById(agentId);
		if (!agent || !agent.operationalArea) {
			return res.status(403).json({
				success: false,
				message: "Agent has no operational area assigned",
				error: {
					code: "OPERATIONAL_AREA_NOT_ASSIGNED",
					details: "Agent has no operational area assigned",
				},
			});
		}

		const regionQuery = {
			"sellerInfo.operationalArea.region": agent.operationalArea.region,
			"sellerInfo.operationalArea.district": agent.operationalArea.district,
		};

		// Get operational area statistics
		const [totalSellers, activeSellers, totalProducts] = await Promise.all([
			User.countDocuments({
				role: "seller",
				"operationalArea.region": agent.operationalArea.region,
				"operationalArea.district": agent.operationalArea.district,
			}),
			User.countDocuments({
				role: "seller",
				verified: true,
				"operationalArea.region": agent.operationalArea.region,
				"operationalArea.district": agent.operationalArea.district,
			}),
			Product.countDocuments(regionQuery),
		]);

		// Get unique upazilas in the area
		const upazilas = await Product.distinct(
			"sellerInfo.operationalArea.upazila",
			regionQuery
		);

		res.status(200).json({
			success: true,
			message: "Operational area information retrieved",
			operationalArea: {
				region: agent.operationalArea.region,
				district: agent.operationalArea.district,
				assignedAt: agent.createdAt || new Date("2024-01-01T00:00:00Z"),
				totalSellers,
				activeSellers,
				totalProducts,
				coverage: {
					upazilas: upazilas.filter((u) => u && u.trim() !== ""),
					totalArea: "1500 sq km", // Static for now
				},
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 4. Approve Product (Enhanced)
export const agentApproveProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const { reviewedBy, agentOperationalArea, reason } = req.body;
		const agentId = reviewedBy || req.decoded.id;

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
				error: { code: "NOT_FOUND", details: "Product not found" },
			});
		}

		if (product.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Product already processed",
				error: {
					code: "ALREADY_PROCESSED",
					details: "Product already approved/rejected",
				},
			});
		}

		const agent = await User.findById(agentId);
		if (!agent || !agent.operationalArea) {
			return res.status(403).json({
				success: false,
				message: "Agent not authorized for this region",
				error: {
					code: "FORBIDDEN",
					details: "Agent not authorized for this region",
				},
			});
		}

		// Verify regional authorization
		if (
			agent.operationalArea.region !== product.sellerInfo.operationalArea.region
		) {
			return res.status(403).json({
				success: false,
				message: "Agent not authorized for this region",
				error: {
					code: "FORBIDDEN",
					details: "Agent not authorized for this region",
				},
			});
		}

		const previousStatus = product.status;
		product.status = "approved";
		product.approvedBy = {
			agentId: agentId,
			approvedAt: new Date(),
		};
		product.approvalReason = reason || "Product meets quality standards";
		product.lastModified = new Date();
		product.lastModifiedBy = agentId;

		// Add to admin history
		product.adminHistory.push({
			adminId: agentId,
			action: "approved",
			timestamp: new Date(),
			details: {
				reason: product.approvalReason,
				adminEmail: agent.email,
				previousStatus: previousStatus,
			},
		});

		// Add to agent review history
		const reviewHistory = new AgentReviewHistory({
			agentId: agentId,
			productId: productId,
			productTitle: product.title,
			action: "approved",
			reason: product.approvalReason,
			seller: {
				name: product.sellerInfo.name,
				farmName: product.sellerInfo.farmName || "",
				email: product.sellerInfo.email,
			},
			operationalArea: {
				region: product.sellerInfo.operationalArea.region,
				district: product.sellerInfo.operationalArea.district,
			},
			previousStatus: previousStatus,
			newStatus: "approved",
		});

		await Promise.all([product.save(), reviewHistory.save()]);

		res.status(200).json({
			success: true,
			message: "Product approved successfully",
			product: {
				id: product._id,
				status: product.status,
				approvedAt: product.approvedBy.approvedAt,
				approvedBy: product.approvedBy.agentId,
				approvalReason: product.approvalReason,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 5. Reject Product (Enhanced)
export const agentRejectProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const { reviewedBy, agentOperationalArea, reason } = req.body;
		const agentId = reviewedBy || req.decoded.id;

		if (!reason || reason.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Reason for rejection is required",
				error: {
					code: "VALIDATION_ERROR",
					details: "Reason for rejection is required",
					field: "reason",
				},
			});
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
				error: { code: "NOT_FOUND", details: "Product not found" },
			});
		}

		if (product.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Product already processed",
				error: {
					code: "ALREADY_PROCESSED",
					details: "Product already approved/rejected",
				},
			});
		}

		const agent = await User.findById(agentId);
		if (!agent || !agent.operationalArea) {
			return res.status(403).json({
				success: false,
				message: "Agent not authorized for this region",
				error: {
					code: "FORBIDDEN",
					details: "Agent not authorized for this region",
				},
			});
		}

		// Verify regional authorization
		if (
			agent.operationalArea.region !== product.sellerInfo.operationalArea.region
		) {
			return res.status(403).json({
				success: false,
				message: "Agent not authorized for this region",
				error: {
					code: "FORBIDDEN",
					details: "Agent not authorized for this region",
				},
			});
		}

		const previousStatus = product.status;
		product.status = "rejected";
		product.rejectedAt = new Date();
		product.rejectedBy = agentId;
		product.rejectionReason = reason;
		product.lastModified = new Date();
		product.lastModifiedBy = agentId;

		// Add to admin history
		product.adminHistory.push({
			adminId: agentId,
			action: "rejected",
			timestamp: new Date(),
			details: {
				reason: reason,
				adminEmail: agent.email,
				previousStatus: previousStatus,
			},
		});

		// Add to agent review history
		const reviewHistory = new AgentReviewHistory({
			agentId: agentId,
			productId: productId,
			productTitle: product.title,
			action: "rejected",
			reason: reason,
			seller: {
				name: product.sellerInfo.name,
				farmName: product.sellerInfo.farmName || "",
				email: product.sellerInfo.email,
			},
			operationalArea: {
				region: product.sellerInfo.operationalArea.region,
				district: product.sellerInfo.operationalArea.district,
			},
			previousStatus: previousStatus,
			newStatus: "rejected",
		});

		await Promise.all([product.save(), reviewHistory.save()]);

		res.status(200).json({
			success: true,
			message: "Product rejected successfully",
			product: {
				id: product._id,
				status: product.status,
				rejectedAt: product.rejectedAt,
				rejectedBy: product.rejectedBy,
				rejectionReason: product.rejectionReason,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 6. Suspend Product
export const agentSuspendProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		const { reviewedBy, agentOperationalArea, reason } = req.body;
		const agentId = reviewedBy || req.decoded.id;

		if (!reason || reason.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Reason for suspension is required",
				error: {
					code: "VALIDATION_ERROR",
					details: "Reason for suspension is required",
					field: "reason",
				},
			});
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
				error: { code: "NOT_FOUND", details: "Product not found" },
			});
		}

		const agent = await User.findById(agentId);
		if (!agent || !agent.operationalArea) {
			return res.status(403).json({
				success: false,
				message: "Agent not authorized for this region",
				error: {
					code: "FORBIDDEN",
					details: "Agent not authorized for this region",
				},
			});
		}

		// Verify regional authorization
		if (
			agent.operationalArea.region !== product.sellerInfo.operationalArea.region
		) {
			return res.status(403).json({
				success: false,
				message: "Agent not authorized for this region",
				error: {
					code: "FORBIDDEN",
					details: "Agent not authorized for this region",
				},
			});
		}

		const previousStatus = product.status;
		product.status = "suspended";
		product.suspendedAt = new Date();
		product.suspendedBy = agentId;
		product.suspensionReason = reason;
		product.lastModified = new Date();
		product.lastModifiedBy = agentId;

		// Add to admin history
		product.adminHistory.push({
			adminId: agentId,
			action: "suspended",
			timestamp: new Date(),
			details: {
				reason: reason,
				adminEmail: agent.email,
				previousStatus: previousStatus,
			},
		});

		// Add to agent review history
		const reviewHistory = new AgentReviewHistory({
			agentId: agentId,
			productId: productId,
			productTitle: product.title,
			action: "suspended",
			reason: reason,
			seller: {
				name: product.sellerInfo.name,
				farmName: product.sellerInfo.farmName || "",
				email: product.sellerInfo.email,
			},
			operationalArea: {
				region: product.sellerInfo.operationalArea.region,
				district: product.sellerInfo.operationalArea.district,
			},
			previousStatus: previousStatus,
			newStatus: "suspended",
		});

		await Promise.all([product.save(), reviewHistory.save()]);

		res.status(200).json({
			success: true,
			message: "Product suspended successfully",
			product: {
				id: product._id,
				status: product.status,
				suspendedAt: product.suspendedAt,
				suspendedBy: product.suspendedBy,
				suspensionReason: product.suspensionReason,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 7. Get Enhanced Product Details
export const getAgentProductDetails = async (req, res) => {
	try {
		const { productId } = req.params;
		const { includeSellerDetails } = req.query;

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
				error: { code: "NOT_FOUND", details: "Product not found" },
			});
		}

		// Enhanced product details response
		const productDetails = {
			id: product._id,
			title: product.title,
			description: product.description,
			category: product.cropType,
			price: product.pricePerUnit,
			unit: product.unit,
			stock: product.availableStock,
			minimumOrderQuantity: product.minimumOrderQuantity,
			qualityScore: product.qualityScore || 0,
			images: product.images || [],
			specifications: {
				variety: product.specifications?.variety || "",
				grade: product.specifications?.grade || "",
				harvestDate: product.specifications?.harvestDate || product.harvestedOn,
				processingMethod: product.specifications?.processingMethod || "",
			},
			status: product.status,
			seller: {
				id: product.sellerInfo._id,
				name: product.sellerInfo.name,
				farmName: product.sellerInfo.farmName || "",
				email: product.sellerInfo.email,
				phone: product.sellerInfo.phone,
				verificationStatus: product.sellerInfo.verificationStatus || "verified",
				rating: product.sellerInfo.rating || 0,
				totalProducts: product.sellerInfo.totalProducts || 0,
			},
			location: {
				region: product.sellerInfo.operationalArea.region,
				district: product.sellerInfo.operationalArea.district,
				upazila: product.sellerInfo.operationalArea.upazila || "",
				address: product.sellerInfo.operationalArea.address || "",
				coordinates: {
					lat: product.sellerInfo.operationalArea.coordinates?.lat || 0,
					lng: product.sellerInfo.operationalArea.coordinates?.lng || 0,
				},
			},
			timeline: {
				submittedAt: product.timeline?.submittedAt || product.createdAt,
				lastUpdated:
					product.timeline?.lastUpdated ||
					product.lastModified ||
					product.updatedAt,
				reviewDeadline:
					product.timeline?.reviewDeadline ||
					new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
			},
		};

		// Include additional seller details if requested
		if (includeSellerDetails === "true") {
			// Could fetch additional seller information here
			productDetails.seller.totalReviews = 25; // Example
			productDetails.seller.joinedDate = "2024-01-01"; // Example
		}

		res.status(200).json({
			success: true,
			message: "Product details retrieved successfully",
			product: productDetails,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 8. Get Agent Review History
export const getAgentReviewHistory = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			startDate,
			endDate,
			action,
			productId,
		} = req.query;

		const agentId = req.decoded.id;

		// Build query for review history
		let query = { agentId: agentId };

		if (startDate || endDate) {
			query.reviewedAt = {};
			if (startDate) query.reviewedAt.$gte = new Date(startDate);
			if (endDate) query.reviewedAt.$lte = new Date(endDate);
		}

		if (action) query.action = action;
		if (productId) query.productId = productId;

		const options = {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			sort: { reviewedAt: -1 },
		};

		const reviews = await AgentReviewHistory.find(query)
			.skip((options.page - 1) * options.limit)
			.limit(options.limit)
			.sort(options.sort);

		const total = await AgentReviewHistory.countDocuments(query);

		// Get summary statistics
		const [totalApproved, totalRejected, totalSuspended] = await Promise.all([
			AgentReviewHistory.countDocuments({
				agentId: agentId,
				action: "approved",
			}),
			AgentReviewHistory.countDocuments({
				agentId: agentId,
				action: "rejected",
			}),
			AgentReviewHistory.countDocuments({
				agentId: agentId,
				action: "suspended",
			}),
		]);

		// Format reviews
		const formattedReviews = reviews.map((review) => ({
			id: review._id,
			productId: review.productId,
			productTitle: review.productTitle,
			action: review.action,
			reason: review.reason,
			reviewedAt: review.reviewedAt,
			seller: {
				name: review.seller.name,
				farmName: review.seller.farmName,
			},
		}));

		res.status(200).json({
			success: true,
			message: "Review history retrieved successfully",
			reviews: formattedReviews,
			totalReviews: total,
			totalPages: Math.ceil(total / options.limit),
			currentPage: options.page,
			summary: {
				totalApproved,
				totalRejected,
				totalSuspended,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ============================
// ADMIN-SPECIFIC ROUTES
// ============================

// Get all products (any status) for admin
export const getAdminAllProducts = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			status,
			cropType,
			region,
			search,
		} = req.query;

		let query = {};

		if (status) query.status = status;
		if (cropType) query.cropType = cropType;
		if (region) query["sellerInfo.operationalArea.region"] = region;
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ cropType: { $regex: search, $options: "i" } },
				{ "sellerInfo.name": { $regex: search, $options: "i" } },
			];
		}

		const options = {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			sort: { createdAt: -1 },
		};

		const products = await Product.find(query)
			.skip((options.page - 1) * options.limit)
			.limit(options.limit)
			.sort(options.sort);

		const total = await Product.countDocuments(query);

		res.status(200).json({
			success: true,
			products,
			totalPages: Math.ceil(total / options.limit),
			currentPage: options.page,
			totalProducts: total,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get comprehensive product statistics for admin
export const getAdminProductStatistics = async (req, res) => {
	try {
		const [total, pending, approved, rejected] = await Promise.all([
			Product.countDocuments(),
			Product.countDocuments({ status: "pending" }),
			Product.countDocuments({ status: "approved" }),
			Product.countDocuments({ status: "rejected" }),
		]);

		// By region statistics
		const byRegionStats = await Product.aggregate([
			{
				$group: {
					_id: "$sellerInfo.operationalArea.region",
					count: { $sum: 1 },
				},
			},
		]);

		// By crop type statistics
		const byCropTypeStats = await Product.aggregate([
			{
				$group: {
					_id: "$cropType",
					count: { $sum: 1 },
				},
			},
		]);

		// By status statistics
		const byStatusStats = await Product.aggregate([
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
				},
			},
		]);

		res.status(200).json({
			success: true,
			statistics: {
				total,
				pending,
				approved,
				rejected,
				byRegion: byRegionStats.reduce((acc, item) => {
					acc[item._id || "Unknown"] = item.count;
					return acc;
				}, {}),
				byCropType: byCropTypeStats.reduce((acc, item) => {
					acc[item._id || "Unknown"] = item.count;
					return acc;
				}, {}),
				byStatus: byStatusStats.reduce((acc, item) => {
					acc[item._id || "Unknown"] = item.count;
					return acc;
				}, {}),
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Admin approve product
export const adminApproveProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const { reviewedBy } = req.body;
		const adminId = reviewedBy || req.decoded.id;

		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		const admin = await User.findById(adminId);

		product.status = "approved";
		product.approvedBy = {
			agentId: adminId,
			approvedAt: new Date(),
		};
		product.lastModified = new Date();
		product.lastModifiedBy = adminId;

		// Add to admin history
		product.adminHistory.push({
			adminId: adminId,
			action: "approved",
			timestamp: new Date(),
			details: {
				adminEmail: admin?.email,
				previousStatus: product.status,
			},
		});

		await product.save();

		res.status(200).json({
			success: true,
			message: "Product approved successfully",
			product,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Admin reject product
export const adminRejectProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason, reviewedBy } = req.body;
		const adminId = reviewedBy || req.decoded.id;

		if (!reason || reason.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Reason for rejection is required.",
			});
		}

		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		const admin = await User.findById(adminId);

		product.status = "rejected";
		product.statusReason = reason;
		product.lastModified = new Date();
		product.lastModifiedBy = adminId;

		// Add to admin history
		product.adminHistory.push({
			adminId: adminId,
			action: "rejected",
			timestamp: new Date(),
			details: {
				reason: reason,
				adminEmail: admin?.email,
				previousStatus: "pending",
			},
		});

		await product.save();

		res.status(200).json({
			success: true,
			message: "Product rejected successfully",
			product,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Bulk approve/reject products
export const bulkProductAction = async (req, res) => {
	try {
		const { productIds, action, reason, reviewedBy } = req.body;
		const adminId = reviewedBy || req.decoded.id;

		// Validate input
		if (!Array.isArray(productIds) || productIds.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Product IDs array is required",
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

		const admin = await User.findById(adminId);
		const results = {
			successful: [],
			failed: [],
			total: productIds.length,
		};

		// Process each product
		for (const productId of productIds) {
			try {
				const product = await Product.findById(productId);
				if (!product) {
					results.failed.push({
						productId: productId,
						error: "Product not found",
					});
					continue;
				}

				// Update product
				product.status = action === "approve" ? "approved" : "rejected";
				product.lastModified = new Date();
				product.lastModifiedBy = adminId;

				if (action === "approve") {
					product.approvedBy = {
						agentId: adminId,
						approvedAt: new Date(),
					};
				} else {
					product.statusReason = reason;
				}

				// Add to admin history
				product.adminHistory.push({
					adminId: adminId,
					action: action === "reject" ? "rejected" : "approved",
					timestamp: new Date(),
					details: {
						reason: action === "reject" ? reason : undefined,
						adminEmail: admin?.email,
						previousStatus: product.status,
					},
				});

				await product.save();
				results.successful.push(productId);
			} catch (error) {
				results.failed.push({
					productId: productId,
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
		res.status(500).json({
			success: false,
			message: "Server error while performing bulk action.",
			error: error.message,
		});
	}
};

// Product analytics for dashboard
export const getProductAnalytics = async (req, res) => {
	try {
		const { timeRange = "30d" } = req.query;

		// Calculate date range
		let startDate = new Date();
		switch (timeRange) {
			case "7d":
				startDate.setDate(startDate.getDate() - 7);
				break;
			case "30d":
				startDate.setDate(startDate.getDate() - 30);
				break;
			case "90d":
				startDate.setDate(startDate.getDate() - 90);
				break;
			case "1y":
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			default:
				startDate.setDate(startDate.getDate() - 30);
		}

		// Overview statistics
		const [total, pending, approved, rejected, recentProducts] =
			await Promise.all([
				Product.countDocuments(),
				Product.countDocuments({ status: "pending" }),
				Product.countDocuments({ status: "approved" }),
				Product.countDocuments({ status: "rejected" }),
				Product.countDocuments({ createdAt: { $gte: startDate } }),
			]);

		// Trends data - products created over time
		const trendsData = await Product.aggregate([
			{
				$match: { createdAt: { $gte: startDate } },
			},
			{
				$group: {
					_id: {
						year: { $year: "$createdAt" },
						month: { $month: "$createdAt" },
						day: { $dayOfMonth: "$createdAt" },
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
		]);

		// Region performance
		const regionPerformance = await Product.aggregate([
			{
				$group: {
					_id: "$sellerInfo.operationalArea.region",
					total: { $sum: 1 },
					approved: {
						$sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
					},
					pending: {
						$sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
					},
					rejected: {
						$sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
					},
				},
			},
			{
				$project: {
					region: "$_id",
					total: 1,
					approved: 1,
					pending: 1,
					rejected: 1,
					approvalRate: {
						$multiply: [{ $divide: ["$approved", "$total"] }, 100],
					},
				},
			},
		]);

		res.status(200).json({
			success: true,
			analytics: {
				overview: {
					total,
					pending,
					approved,
					rejected,
					recentProducts,
					approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
				},
				trends: trendsData.map((item) => ({
					date: `${item._id.year}-${String(item._id.month).padStart(
						2,
						"0"
					)}-${String(item._id.day).padStart(2, "0")}`,
					count: item.count,
				})),
				regionPerformance: regionPerformance.map((item) => ({
					region: item._id || "Unknown",
					total: item.total,
					approved: item.approved,
					pending: item.pending,
					rejected: item.rejected,
					approvalRate: item.approvalRate?.toFixed(2) || 0,
				})),
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
