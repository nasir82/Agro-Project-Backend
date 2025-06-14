import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
	productId: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
		min: 0,
	},
	quantity: {
		type: Number,
		required: true,
		min: 1,
	},
	unit: {
		type: String,
		required: true,
	},
	image: {
		type: String,
	},
	sellerId: {
		type: String,
		required: true,
	},
	sellerName: {
		type: String,
		required: true,
	},
	totalPrice: {
		type: Number,
		required: true,
		min: 0,
	},
});

const shippingAddressSchema = new mongoose.Schema({
	fullName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	phone: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	city: {
		type: String,
		required: true,
	},
	state: {
		type: String,
		required: true,
	},
	zipCode: {
		type: String,
		required: true,
	},
});

const paymentDetailsSchema = new mongoose.Schema({
	transactionId: {
		type: String,
	},
	cardType: {
		type: String,
	},
	last4: {
		type: String,
	},
	paymentDate: {
		type: Date,
	},
});

const orderSchema = new mongoose.Schema(
	{
		// Order Identification
		orderNumber: {
			type: String,
			required: true,
			unique: true,
		},

		// User Information
		userId: {
			type: String, // Firebase UID
			required: true,
		},
		userEmail: {
			type: String,
			required: true,
		},

		// Order Items
		items: [orderItemSchema],

		// Order Totals
		subtotal: {
			type: Number,
			required: true,
			min: 0,
		},
		shippingCost: {
			type: Number,
			default: 0,
			min: 0,
		},
		tax: {
			type: Number,
			default: 0,
			min: 0,
		},
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},

		// Shipping Information
		shippingAddress: shippingAddressSchema,

		// Payment Information
		paymentMethod: {
			type: String,
			required: true,
			enum: ["cod", "online"],
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed", "refunded"],
			default: "pending",
		},
		paymentDetails: paymentDetailsSchema,

		// Order Status
		status: {
			type: String,
			enum: [
				"pending",
				"confirmed",
				"processing",
				"shipped",
				"delivered",
				"cancelled",
			],
			default: "pending",
		},

		// Order Tracking
		trackingNumber: {
			type: String,
		},
		estimatedDelivery: {
			type: Date,
		},
		actualDelivery: {
			type: Date,
		},

		// Additional Information
		notes: {
			type: String,
		},

		// Timestamps
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: false, // We're handling timestamps manually
	}
);

// Pre-save middleware to update updatedAt
orderSchema.pre("save", function (next) {
	this.updatedAt = new Date();
	next();
});

// Indexing for faster search
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ "items.sellerId": 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
