import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
	productId: {
		type: String,
		required: true,
	},
<<<<<<< HEAD
	title: {
		type: String,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		min: 1,
	},
=======
	name: {
		type: String,
		required: true,
	},
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
	price: {
		type: Number,
		required: true,
		min: 0,
	},
<<<<<<< HEAD
	totalPrice: {
		type: Number,
		required: true,
		min: 0,
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
	},
	sellerId: {
		type: String,
		required: true,
	},
<<<<<<< HEAD
});

const deliveryDetailsSchema = new mongoose.Schema({
	region: {
		type: String,
		required: true,
	},
	district: {
		type: String,
		required: true,
	},
	address: {
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		type: String,
		required: true,
	},
	phone: {
		type: String,
		required: true,
	},
<<<<<<< HEAD
	orderNote: {
		type: String,
		default: "",
	},
	totalAmount: {
		type: Number,
		required: true,
	},
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
});

const orderSchema = new mongoose.Schema(
	{
<<<<<<< HEAD
=======
		// Order Identification
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		orderNumber: {
			type: String,
			required: true,
			unique: true,
		},
<<<<<<< HEAD
=======

		// User Information
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		userId: {
			type: String, // Firebase UID
			required: true,
		},
<<<<<<< HEAD
		items: [orderItemSchema],
		deliveryDetails: deliveryDetailsSchema,
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
<<<<<<< HEAD
		advancePaymentAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		paymentIntentId: {
			type: String,
			required: false,
		},
=======

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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
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
<<<<<<< HEAD
	},
	{ timestamps: true }
);

=======

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

>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
// Indexing for faster search
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
<<<<<<< HEAD
orderSchema.index({ "deliveryDetails.region": 1 });
=======
orderSchema.index({ "items.sellerId": 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d

export default mongoose.model("Order", orderSchema);
