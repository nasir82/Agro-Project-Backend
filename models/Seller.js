import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
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

		// Farm information - extracted from formData for easier querying
		farmName: {
			type: String,
			required: true,
			trim: true,
		},
		farmType: {
			type: String,
			enum: [
				"Crop Farming",
				"Vegetable Farming",
				"Fruit Farming",
				"Dairy Farming",
				"Poultry Farming",
				"Fish Farming",
				"Livestock Farming",
				"Organic Farming",
				"Mixed Farming",
				"Other",
			],
			required: true,
		},
		farmSize: {
			type: String,
			required: true,
		},
		experience: {
			type: String,
			required: true,
		},
		farmAddress: {
			type: String,
			required: true,
		},
		specialization: {
			type: String,
			required: true,
		},
		certifications: {
			type: String,
			default: "",
		},
		nidNumber: {
			type: String,
			required: true,
		},
		nidCopy: {
			type: String, // URL
			default: "",
		},
		farmPhotos: {
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
		upazila: {
			type: String,
			required: true,
		},
		village: {
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

		// Basic performance metrics
		totalProducts: {
			type: Number,
			default: 0,
		},
		totalSales: {
			type: Number,
			default: 0,
		},
		rating: {
			average: { type: Number, default: 0, min: 0, max: 5 },
			count: { type: Number, default: 0 },
		},
	},
	{ timestamps: true }
);

// Essential indexes
sellerSchema.index({ userId: 1 });
sellerSchema.index({ email: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ verified: 1 });
sellerSchema.index({ "operationalArea.region": 1 });
sellerSchema.index({ "operationalArea.district": 1 });
sellerSchema.index({ farmType: 1 });
sellerSchema.index({ region: 1, district: 1 });

// Pre-save middleware to ensure userId is a string
sellerSchema.pre("save", function (next) {
	if (this.userId && typeof this.userId !== "string") {
		this.userId = this.userId.toString();
	}
	next();
});

const Seller = mongoose.model("Seller", sellerSchema);
export default Seller;
