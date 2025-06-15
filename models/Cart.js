import mongoose from "mongoose";

<<<<<<< HEAD
const cartItemSchema = new mongoose.Schema({
  _id: {
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
  },
  unit: {
    type: String,
    required: true,
  },
  minimumOrderQuantity: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  seller: {
    sellerId: {
      type: String,
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerEmail: {
      type: String,
      required: true,
    },
  },
});

const cartSchema = new mongoose.Schema(
	{
		email: {
=======
const cartSchema = new mongoose.Schema(
	{
		userEmail: {
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
			type: String,
			required: true,
			unique: true,
			index: true,
		},
<<<<<<< HEAD
		items: [cartItemSchema],
		totalItems: {
			type: Number,
			default: 0,
=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		},
		subtotal: {
			type: Number,
			default: 0,
<<<<<<< HEAD
=======
			min: 0,
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		},
		deliveryCharge: {
			type: Number,
			default: 0,
<<<<<<< HEAD
=======
			min: 0,
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		},
		totalAmount: {
			type: Number,
			default: 0,
<<<<<<< HEAD
=======
			min: 0,
		},
		lastUpdated: {
			type: Date,
			default: Date.now,
		},
		createdAt: {
			type: Date,
			default: Date.now,
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
		},
	},
	{
		timestamps: true,
	}
);

<<<<<<< HEAD
// Calculate totals before saving
cartSchema.pre("save", function (next) {
	let totalItems = 0;
	let subtotal = 0;

	this.items.forEach((item) => {
		totalItems += item.quantity;
		subtotal += item.price * item.quantity;
	});

	this.totalItems = totalItems;
	this.subtotal = subtotal;
	this.deliveryCharge = subtotal > 0 ? 300 : 0; // Fixed delivery charge
	this.totalAmount = subtotal + this.deliveryCharge;

=======
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
>>>>>>> e58444ef74640ad2af50b885f791a69e7ecd253d
	next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
