import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		phoneNumber: {
			type: String,
			required: true,
			trim: true,
		},
		warehouseAddress: {
			street: {
				type: String,
				required: true,
			},
			district: {
				type: String,
				required: true,
			},
			region: {
				type: String,
				required: true,
			},
			postalCode: String,
			gpsCoordinates: {
				latitude: Number,
				longitude: Number,
			},
		},
		identificationDocument: {
			documentType: {
				type: String,
				enum: [
					"national_id",
					"passport",
					"driving_license",
					"business_license",
				],
				required: true,
			},
			documentNumber: {
				type: String,
				required: true,
			},
			documentImage: {
				type: String,
				required: true,
			},
		},
		warehouseCapacity: {
			type: Number,
			required: true,
			min: 0,
		},
		warehouseImages: {
			type: [String],
			validate: [
				(val) => val.length > 0,
				"At least one warehouse image is required",
			],
		},
		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
		membershipFee: {
			amount: {
				type: Number,
				required: true,
			},
			paid: {
				type: Boolean,
				default: false,
			},
			paymentDate: Date,
			transactionId: String,
		},
		sellerCount: {
			type: Number,
			default: 0,
		},
		reviewCount: {
			type: Number,
			default: 0,
		},
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		applicationDate: {
			type: Date,
			default: Date.now,
		},
		approvedBy: {
			adminId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			approvedAt: Date,
			notes: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// Indexing for faster search
agentSchema.index({ status: 1 });
agentSchema.index({ "warehouseAddress.region": 1 });
agentSchema.index({ "warehouseAddress.district": 1 });
agentSchema.index({ email: 1 });
agentSchema.index({ userId: 1 });

export default mongoose.model("Agent-detail", agentSchema);
