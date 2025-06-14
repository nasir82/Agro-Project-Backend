import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
	{
		userEmail: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		userId: {
			type: String,
			required: true,
			index: true,
		},
		items: [
			{
				productId: {
					type: String,
					required: true,
				},
				title: {
					type: String,
					required: true,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
				unit: {
					type: String,
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				minimumOrderQuantity: {
					type: Number,
					default: 1,
					min: 1,
				},
				image: {
					type: String,
				},
				seller: {
					sellerId: String,
					name: String,
				},
				category: {
					type: String,
				},
				addedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		totalItems: {
			type: Number,
			default: 0,
			min: 0,
		},
		subtotal: {
			type: Number,
			default: 0,
			min: 0,
		},
		deliveryCharge: {
			type: Number,
			default: 0,
			min: 0,
		},
		totalAmount: {
			type: Number,
			default: 0,
			min: 0,
		},
		lastUpdated: {
			type: Date,
			default: Date.now,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for better performance
cartSchema.index({ userEmail: 1 });
cartSchema.index({ userId: 1 });
cartSchema.index({ "items.productId": 1 });

// Pre-save middleware to calculate totals
cartSchema.pre("save", function (next) {
	this.totalItems = this.items.reduce(
		(total, item) => total + item.quantity,
		0
	);
	this.subtotal = this.items.reduce(
		(total, item) => total + item.price * item.quantity,
		0
	);
	this.totalAmount = this.subtotal + this.deliveryCharge;
	this.lastUpdated = new Date();
	next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
