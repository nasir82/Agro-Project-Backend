import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
	{
		// Basic user information
		userId: {
			type: String,
			ref: "User",
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		phoneNumber: {
			type: String,
			required: true,
			trim: true,
		},
		profilePicture: {
			type: String,
			default: "https://i.ibb.co/MBtjqXQ/no-avatar.gif",
		},
		fullAddress: {
			type: String,
			trim: true,
		},

		// Application reference
		applicationId: {
			type: String,
			ref: "Application",
			required: true,
		},
		operationalArea: {
			region: { type: String, required: true },
			district: { type: String, required: true },
		},
		formData: {
			type: mongoose.Schema.Types.Mixed, // Original application form data
			required: true,
		},

		// Admin-specific properties
		adminId: {
			type: String,
			unique: true,
			required: true, // Auto-generated admin ID
		},
		adminLevel: {
			type: String,
			enum: ["junior", "senior", "manager", "super-admin"],
			default: "junior",
		},
		department: {
			type: String,
			enum: [
				"operations",
				"quality_assurance",
				"customer_service",
				"finance",
				"technical",
				"management",
			],
			required: true,
		},

		// Simplified experience
		experience: {
			totalYears: { type: Number, required: true },
			description: String,
		},

		// Status and verification
		isActive: {
			type: Boolean,
			default: true,
		},
		verified: {
			type: Boolean,
			default: false,
		},

		// Application approval details
		approvedBy: {
			type: String,
			ref: "User",
			required: true,
		},
		approvedAt: {
			type: Date,
			required: true,
		},

		// Basic performance tracking
		performance: {
			totalApplicationsHandled: { type: Number, default: 0 },
			applicationsApproved: { type: Number, default: 0 },
			applicationsRejected: { type: Number, default: 0 },
			usersManaged: { type: Number, default: 0 },
		},

		// Access tracking
		lastLogin: {
			type: Date,
		},
	},
	{ timestamps: true }
);

// Essential indexes only
adminSchema.index({ userId: 1 });
adminSchema.index({ adminId: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ verified: 1 });
adminSchema.index({ adminLevel: 1 });
adminSchema.index({ department: 1 });

// Pre-save middleware to ensure userId is a string
adminSchema.pre("save", function (next) {
	if (this.userId && typeof this.userId !== "string") {
		this.userId = this.userId.toString();
	}
	next();
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
