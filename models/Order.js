import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
	productId: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		min: 1,
	},
	price: {
		type: Number,
		required: true,
		min: 0,
	},
	totalPrice: {
		type: Number,
		required: true,
		min: 0,
	},
	sellerId: {
		type: String,
		required: true,
	},
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
		type: String,
		required: true,
	},
	phone: {
		type: String,
		required: true,
	},
	orderNote: {
		type: String,
		default: "",
	},
	totalAmount: {
		type: Number,
		required: true,
	},
});

const orderSchema = new mongoose.Schema(
	{
		orderNumber: {
			type: String,
			required: true,
			unique: true,
		},
		userId: {
			type: String, // Firebase UID
			required: true,
		},
		items: [orderItemSchema],
		deliveryDetails: deliveryDetailsSchema,
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		advancePaymentAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		paymentIntentId: {
			type: String,
			required: false,
		},
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
	},
	{ timestamps: true }
);

// Indexing for faster search
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ "deliveryDetails.region": 1 });

export default mongoose.model("Order", orderSchema);
