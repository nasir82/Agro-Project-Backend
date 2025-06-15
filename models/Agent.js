import mongoose from "mongoose";


/**
 * Agent-detail Schema
 * -------------------
 * This schema defines the structure of the "Agent-detail" collection, used to store 
 * information about agents managing warehouse facilities in the system.
 *
 * Fields:
 * - userId (ObjectId): Reference to the associated user (required).
 * - name (String): Full name of the agent (required).
 * - email (String): Unique email address (required, lowercase, trimmed).
 * - phoneNumber (String): Contact phone number (required).
 *
 * - warehouseAddress (Object):
 *   - street (String): Street address (required).
 *   - district (String): District name (required).
 *   - region (String): Region name (required).
 *   - postalCode (String): Postal code (optional).
 *   - gpsCoordinates (Object): { latitude (Number), longitude (Number) } (optional).
 *
 * - identificationDocument (Object):
 *   - documentType (String): One of "national_id", "passport", "driving_license", "business_license" (required).
 *   - documentNumber (String): Unique document number (required).
 *   - documentImage (String): URL or path to image file (required).
 *
 * - warehouseCapacity (Number): Capacity of the warehouse in units (required, min: 0).
 * - warehouseImages (Array of String): At least one image URL is required.
 * - status (String): Agent application status - "pending", "approved", or "rejected" (default: "pending").
 *
 * - membershipFee (Object):
 *   - amount (Number): Membership fee amount (required).
 *   - paid (Boolean): Whether the fee has been paid (default: false).
 *   - paymentDate (Date): When the fee was paid (optional).
 *   - transactionId (String): Associated transaction ID (optional).
 *
 * - sellerCount (Number): Number of sellers associated with the agent (default: 0).
 * - reviewCount (Number): Number of reviews received (default: 0).
 * - averageRating (Number): Average rating out of 5 (default: 0, min: 0, max: 5).
 * - applicationDate (Date): Date of application submission (default: Date.now).
 *
 * - approvedBy (Object):
 *   - adminId (ObjectId): Reference to the admin who approved (optional).
 *   - approvedAt (Date): Date of approval (optional).
 *   - notes (String): Optional approval/rejection notes.
 *
 * - isActive (Boolean): Whether the agent is currently active (default: true).
 *
 * Timestamps:
 * - createdAt: Auto-generated.
 * - updatedAt: Auto-generated.
 *
 * Indexes:
 * - status
 * - warehouseAddress.region
 * - warehouseAddress.district
 * - email
 * - userId
 */

const agentSchema = new mongoose.Schema(
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

		// Agent-specific properties
		agentId: {
			type: String,
			unique: true,
			required: true, // Auto-generated agent ID
		},

		// Business information - extracted from formData for easier querying
		businessName: {
			type: String,
			required: true,
			trim: true,
		},
		businessType: {
			type: String,
			enum: [
				"Agricultural Trading",
				"Wholesale Distribution",
				"Logistics & Transportation",
				"Cold Storage",
				"Food Processing",
				"Import/Export",
				"Other",
			],
			required: true,
		},
		experience: {
			type: String,
			required: true,
		},
		warehouseAddress: {
			type: String,
			required: true,
		},
		warehouseSize: {
			type: String,
			required: true,
		},
		coverageAreas: {
			type: String,
			required: true,
		},
		businessLicense: {
			type: String, // URL
			default: "",
		},
		warehouseImages: {
			type: [String], // Array of URLs
			default: [],
		},

		// Location details
		region: {
			type: String,
			required: true,
		},
		district: {
			type: String,
			required: true,
		},

		// Financial and reference information
		bankAccountDetails: {
			type: String,
			default: "",
		},
		references: {
			type: String,
			default: "",
		},
		motivation: {
			type: String,
			required: true,
		},

		// Status and verification
		isActive: {
			type: Boolean,
			default: true,
		},
		verified: {
			type: Boolean,
			default: false, // Approved applications are verified
		},
		agentLevel: {
			type: String,
			enum: ["junior", "senior", "lead"],
			default: "junior",
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
			totalApplicationsReviewed: { type: Number, default: 0 },
			applicationsApproved: { type: Number, default: 0 },
			applicationsRejected: { type: Number, default: 0 },
		},
		rating: {
			average: { type: Number, default: 0, min: 0, max: 5 },
			count: { type: Number, default: 0 },
		},

		// Current workload
		assignedApplications: [
			{
				applicationId: { type: String, ref: "Application" },
				assignedAt: Date,
				status: {
					type: String,
					enum: ["assigned", "in-progress", "completed"],
					default: "assigned",
				},
			},
		],
		maxDailyApplications: {
			type: Number,
			default: 10,
		},
	},
	{ timestamps: true }
);

// Essential indexes
agentSchema.index({ userId: 1 });
agentSchema.index({ agentId: 1 });
agentSchema.index({ email: 1 });
agentSchema.index({ isActive: 1 });
agentSchema.index({ verified: 1 });
agentSchema.index({ "operationalArea.region": 1 });
agentSchema.index({ "operationalArea.district": 1 });
agentSchema.index({ businessType: 1 });
agentSchema.index({ region: 1, district: 1 });

// Pre-save middleware to ensure userId is a string
agentSchema.pre("save", function (next) {
	if (this.userId && typeof this.userId !== "string") {
		this.userId = this.userId.toString();
	}
	next();
});

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
