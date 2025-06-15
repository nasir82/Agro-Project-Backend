import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		cropType: {
			type: String,
			required: true,
			trim: true,
		},
		images: {
			type: [String],
			required: true,
			validate: [(val) => val.length > 0, "At least one image is required"],
		},
		pricePerUnit: {
			type: Number,
			required: true,
			min: 0,
		},
		unit: {
			type: String,
			required: true,
			enum: [
				"gram",
				"kg",
				"quintal",
				"liter",
				"piece",
				"dozen",
				"bundle",
				"feet",
			],
		},
		minimumOrderQuantity: {
			type: Number,
			required: true,
			min: 1,
		},
		availableStock: {
			type: Number,
			required: true,
			min: 0,
		},
		harvestedOn: {
			type: Date,
			required: true,
		},
		sellerInfo: {
			_id: { type: String, required: true },
			name: { type: String, required: true },
			farmName: { type: String, default: "" },
			email: { type: String, required: true },
			phone: { type: String, required: true },
			verificationStatus: { type: String, default: "verified" },
			rating: { type: Number, default: 0, min: 0, max: 5 },
			totalProducts: { type: Number, default: 0 },
			operationalArea: {
				region: { type: String, required: true },
				district: { type: String, required: true },
				upazila: { type: String, default: "" },
				address: { type: String, default: "" },
				coordinates: {
					lat: { type: Number, default: 0 },
					lng: { type: Number, default: 0 },
				},
			},
		},
		status: {
			type: String,
			enum: [
				"pending",
				"approved",
				"rejected",
				"suspended",
				"sold_out",
				"live",
			],
			default: "pending",
		},
		statusReason: {
			type: String,
			default: "",
		},
		// Enhanced tracking for agent operations
		approvalReason: {
			type: String,
			default: "",
		},
		rejectedAt: {
			type: Date,
		},
		rejectedBy: {
			type: String,
			ref: "User",
		},
		rejectionReason: {
			type: String,
			default: "",
		},
		suspendedAt: {
			type: Date,
		},
		suspendedBy: {
			type: String,
			ref: "User",
		},
		suspensionReason: {
			type: String,
			default: "",
		},
		qualityScore: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		// Product specifications
		specifications: {
			variety: { type: String, default: "" },
			grade: { type: String, default: "" },
			harvestDate: { type: Date },
			processingMethod: { type: String, default: "" },
		},
		// Timeline tracking
		timeline: {
			submittedAt: {
				type: Date,
				default: Date.now,
			},
			lastUpdated: {
				type: Date,
				default: Date.now,
			},
			reviewDeadline: {
				type: Date,
			},
		},
		quality: {
			type: String,
			enum: ["A", "B", "C", "D"],
			required: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		lastModified: {
			type: Date,
			default: Date.now,
		},
		lastModifiedBy: {
			type: String,
			ref: "User",
		},
		approvedBy: {
			agentId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			approvedAt: Date,
		},
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		// Admin history tracking
		adminHistory: [
			{
				adminId: {
					type: String,
					ref: "User",
					required: true,
				},
				action: {
					type: String,
					enum: ["approved", "rejected", "suspended", "edited"],
					required: true,
				},
				timestamp: {
					type: Date,
					default: Date.now,
					required: true,
				},
				details: {
					reason: String,
					adminEmail: String,
					previousStatus: String,
					updatedFields: [String],
					editReason: String,
				},
			},
		],
	},
	{ timestamps: true }
);

// Useful indexes
productSchema.index({ cropType: 1 });
productSchema.index({ "sellerInfo.operationalArea.region": 1 });
productSchema.index({ "sellerInfo.operationalArea.district": 1 });
productSchema.index({ "sellerInfo.operationalArea.upazila": 1 });
productSchema.index({ status: 1 });
productSchema.index({ pricePerUnit: 1 });
productSchema.index({ qualityScore: 1 });
productSchema.index({ "adminHistory.timestamp": -1 });
productSchema.index({ lastModified: -1 });
productSchema.index({ "timeline.submittedAt": -1 });
productSchema.index({ "timeline.reviewDeadline": 1 });
productSchema.index({ rejectedAt: -1 });
productSchema.index({ suspendedAt: -1 });

export default mongoose.model("Product", productSchema);
