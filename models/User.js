import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
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
		password: {
			type: String,
			required: false, // Not required for OAuth users
		},
		provider: {
			type: String,
			enum: ["email-pass", "google", "facebook", "github", "twitter"],
			default: "email-pass",
		},
		role: {
			type: String,
			enum: ["admin", "agent", "seller", "consumer"],
			default: "consumer",
		},
		phoneNumber: {
			type: String,
			required: false,
			trim: true,
		},
		address: {
			street: String,
			city: String,
			state: String,
			zip: String,
			country: { type: String, default: "Bangladesh" },
		},
		fullAddress: {
			type: String,
			required: false,
			trim: true,
		},
		profilePicture: {
			type: String,
			default: "https://i.ibb.co/MBtjqXQ/no-avatar.gif",
		},
		operationalArea: {
			region: { type: String, default: "" },
			district: { type: String, default: "" },
		},
		verified: {
			type: Boolean,
		},
		warehouseAddress: {
			type: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		firebaseUID: {
			type: String,
			required: false,
		},
		// Admin management tracking
		lastModified: {
			type: Date,
			default: Date.now,
		},
		lastModifiedBy: {
			type: String,
			ref: "User",
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
					enum: [
						"suspended",
						"activated",
						"edited",
						"verified",
						"role_changed",
						"deleted",
					],
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
					previousRole: String,
					newRole: String,
					updatedFields: [String],
					editReason: String,
					bulkAction: Boolean,
				},
			},
		],
	},
	{ timestamps: true }
);

// Useful indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ verified: 1 });
userSchema.index({ "adminHistory.timestamp": -1 });
userSchema.index({ lastModified: -1 });

export default mongoose.model("User", userSchema);
