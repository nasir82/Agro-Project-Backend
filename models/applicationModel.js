import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
	{
		applicantId: {
			type: String,
			ref: "User",
			required: true,
		},
		applicantName: {
			type: String,
			required: true,
		},
		applicantEmail: {
			type: String,
			required: true,
		},
		applicantImg: {
			type: String,
			required: true,
		},
		applicationType: {
			type: String,
			enum: ["seller-application", "agent-application", "admin-application"],
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "approved", "rejected", "in-review"],
			default: "pending",
			required: true,
		},
		formData: {
			type: mongoose.Schema.Types.Mixed, // Flexible structure
			required: true,
		},
		operationalArea: {
			region: { type: String, required: true },
			district: { type: String, required: true },
		},
		// Review fields
		reviewedAt: {
			type: Date,
		},
		reviewedBy: {
			type: String,
			ref: "User",
		},
		reviewNotes: {
			type: String,
		},
	},
	{ timestamps: true }
);

// indexes
applicationSchema.index({ applicantId: 1, applicationType: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 }); // Used `createdAt` from timestamps

const Application = mongoose.model("Application", applicationSchema);
export default Application;
