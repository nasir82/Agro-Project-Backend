import mongoose from "mongoose";

const agentReviewHistorySchema = new mongoose.Schema(
	{
		agentId: {
			type: String,
			ref: "User",
			required: true,
		},
		productId: {
			type: String,
			ref: "Product",
			required: true,
		},
		productTitle: {
			type: String,
			required: true,
		},
		action: {
			type: String,
			enum: ["approved", "rejected", "suspended"],
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
		reviewedAt: {
			type: Date,
			default: Date.now,
			required: true,
		},
		seller: {
			name: { type: String, required: true },
			farmName: { type: String, default: "" },
			email: { type: String, required: true },
		},
		operationalArea: {
			region: { type: String, required: true },
			district: { type: String, required: true },
		},
		previousStatus: {
			type: String,
			required: true,
		},
		newStatus: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

// Indexes for efficient querying
agentReviewHistorySchema.index({ agentId: 1 });
agentReviewHistorySchema.index({ productId: 1 });
agentReviewHistorySchema.index({ action: 1 });
agentReviewHistorySchema.index({ reviewedAt: -1 });
agentReviewHistorySchema.index({ "operationalArea.region": 1 });
agentReviewHistorySchema.index({ "operationalArea.district": 1 });

export default mongoose.model("AgentReviewHistory", agentReviewHistorySchema);
