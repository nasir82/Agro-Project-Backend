import mongoose from "mongoose";

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
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		items: [cartItemSchema],
		totalItems: {
			type: Number,
			default: 0,
		},
		subtotal: {
			type: Number,
			default: 0,
		},
		deliveryCharge: {
			type: Number,
			default: 0,
		},
		totalAmount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

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

	next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
