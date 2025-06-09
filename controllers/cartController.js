import Cart from "../models/Cart.js";

// Get user cart
export const getUserCart = async (req, res) => {
	try {
		const { email } = req.params;

		let cart = await Cart.findOne({ email });

		if (!cart) {
			// Return empty cart if none exists
			cart = {
				items: [],
				totalItems: 0,
				subtotal: 0,
				deliveryCharge: 0,
				totalAmount: 0,
			};
		}

		res.status(200).json({
			success: true,
			cart,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Save/Update user cart
export const saveCart = async (req, res) => {
	try {
		const { email, items, totalItems, subtotal, deliveryCharge, totalAmount } =
			req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: "Email is required",
			});
		}

		const cartData = {
			email,
			items: items || [],
		};

		// Find existing cart or create new one
		let cart = await Cart.findOneAndUpdate({ email }, cartData, {
			new: true,
			upsert: true,
			runValidators: true,
		});

		res.status(200).json({
			success: true,
			message: "Cart saved successfully",
			cart,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
	try {
		const { email, itemId } = req.params;
		const { quantity } = req.body;

		if (!quantity || quantity < 1) {
			return res.status(400).json({
				success: false,
				message: "Quantity must be at least 1",
			});
		}

		const cart = await Cart.findOne({ email });

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		// Find and update the item
		const itemIndex = cart.items.findIndex((item) => item._id === itemId);

		if (itemIndex === -1) {
			return res.status(404).json({
				success: false,
				message: "Item not found in cart",
			});
		}

		cart.items[itemIndex].quantity = quantity;
		await cart.save();

		res.status(200).json({
			success: true,
			message: "Cart item updated successfully",
			cart,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Remove cart item
export const removeCartItem = async (req, res) => {
	try {
		const { email, itemId } = req.params;

		const cart = await Cart.findOne({ email });

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
			});
		}

		// Remove the item
		cart.items = cart.items.filter((item) => item._id !== itemId);
		await cart.save();

		res.status(200).json({
			success: true,
			message: "Item removed from cart",
			cart,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Clear user cart
export const clearCart = async (req, res) => {
	try {
		const { email } = req.params;

		await Cart.findOneAndUpdate(
			{ email },
			{ items: [] },
			{ new: true, upsert: true }
		);

		res.status(200).json({
			success: true,
			message: "Cart cleared successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
