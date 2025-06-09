import Review from "../models/Review.js";
import Order from "../models/Order.js";

// Create a new review
export const createReview = async (req, res) => {
	try {
		const { orderId, productId, rating, comment } = req.body;
		const consumerId = req.decoded.id;

		// Check if order exists and is delivered
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		if (order.status !== "completed" || order.deliveryStatus !== "delivered") {
			return res.status(400).json({
				success: false,
				message: "Can only review products from completed orders",
			});
		}

		// Check if consumer is the one who placed the order
		if (order.consumerId.toString() !== consumerId) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to review this order",
			});
		}

		// Check if product is in the order
		const orderProduct = order.products.find(
			(p) => p.productId.toString() === productId
		);

		if (!orderProduct) {
			return res.status(400).json({
				success: false,
				message: "Product not found in this order",
			});
		}

		// Check if review already exists
		const existingReview = await Review.findOne({
			orderId,
			productId,
			consumerId,
		});

		if (existingReview) {
			return res.status(400).json({
				success: false,
				message: "You have already reviewed this product",
			});
		}

		// Create new review
		const newReview = new Review({
			orderId,
			productId,
			consumerId,
			rating,
			comment,
		});

		await newReview.save();

		res.status(201).json({
			success: true,
			review: newReview,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
	try {
		const { id } = req.params;

		const reviews = await Review.find({ productId: id })
			.populate("consumerId", "name profilePicture")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			reviews,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
