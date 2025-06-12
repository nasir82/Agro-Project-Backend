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
