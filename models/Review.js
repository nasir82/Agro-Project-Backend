import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		orderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			required: true,
		},
		reviewer: {
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			name: String,
			email: String,
			role: {
				type: String,
				default: "consumer",
			},
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		comment: {
			type: String,
			required: true,
			trim: true,
		},
		images: {
			type: [String],
			default: [],
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		isVerifiedPurchase: {
			type: Boolean,
			default: true,
		},
		isHelpful: {
			count: {
				type: Number,
				default: 0,
			},
			users: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			],
		},
	},
	{ timestamps: true }
);

// Indexing for faster search
reviewSchema.index({ productId: 1 });
reviewSchema.index({ "reviewer.userId": 1 });
reviewSchema.index({ rating: 1 });

export default mongoose.model("Review", reviewSchema);
