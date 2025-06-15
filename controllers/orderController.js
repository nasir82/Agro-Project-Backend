import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Helper function to generate order number
const generateOrderNumber = async () => {
	const currentYear = new Date().getFullYear();
	const orderCount = await Order.countDocuments();
	return `SAC-${currentYear}-${String(orderCount + 1).padStart(3, "0")}`;
};

// Helper function to calculate order totals
const calculateOrderTotals = (items, shippingCost = 0, tax = 0) => {
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
	const totalAmount = subtotal + shippingCost + tax;
	return { subtotal, totalAmount };
};

// 📦 CREATE ORDER
export const createOrder = async (req, res) => {
	try {
		const { items, shippingAddress, paymentMethod, paymentDetails, notes } =
			req.body;

		const userId = req.decoded.id;
		const userEmail = req.decoded.email;

		// Validate required fields
		if (!items || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No items in order",
			});
		}

		if (!shippingAddress) {
			return res.status(400).json({
				success: false,
				message: "Shipping address is required",
			});
		}

		if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
			return res.status(400).json({
				success: false,
				message: "Valid payment method is required (cod or online)",
			});
		}

		// Calculate item totals
		const processedItems = items.map((item) => ({
			...item,
			totalPrice: item.price * item.quantity,
		}));

		// Calculate order totals
		const { subtotal, totalAmount } = calculateOrderTotals(processedItems);

		// Generate order number
		const orderNumber = await generateOrderNumber();

		// Set payment status based on method
		let paymentStatus = "pending";
		if (paymentMethod === "online" && paymentDetails?.transactionId) {
			paymentStatus = "paid";
		}

		// Create new order
		const newOrder = new Order({
			orderNumber,
			userId,
			userEmail,
			items: processedItems,
			subtotal,
			shippingCost: 0, // Default to 0, can be calculated based on location
			tax: 0, // Default to 0, can be calculated based on location
			totalAmount,
			shippingAddress,
			paymentMethod,
			paymentStatus,
			paymentDetails: paymentDetails || {},
			notes: notes || "",
		});

		await newOrder.save();

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			order: {
				orderNumber: newOrder.orderNumber,
				orderId: newOrder._id,
				totalAmount: newOrder.totalAmount,
				items: newOrder.items,
				shippingAddress: newOrder.shippingAddress,
				paymentMethod: newOrder.paymentMethod,
				status: newOrder.status,
				createdAt: newOrder.createdAt,
			},
		});
	} catch (error) {
		console.error("Create order error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 📋 GET USER ORDERS
export const getUserOrders = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10, status = "all" } = req.query;

		// Verify user can access these orders
		if (req.decoded.id !== userId && req.decoded.role !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		// Build query
		let query = { userId };
		if (status !== "all") {
			query.status = status;
		}

		// Calculate pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);
		const total = await Order.countDocuments(query);
		const totalPages = Math.ceil(total / parseInt(limit));

		// Get orders
		const orders = await Order.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		res.status(200).json({
			success: true,
			orders,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				totalPages,
			},
		});
	} catch (error) {
		console.error("Get user orders error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 📄 GET SPECIFIC ORDER
export const getOrderById = async (req, res) => {
	try {
		const { orderId } = req.params;
		const userId = req.decoded.id;
		const userRole = req.decoded.role;

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Check access permissions
		const canAccess =
			order.userId === userId || // User's own order
			userRole === "admin" || // Admin can see all
			(userRole === "seller" &&
				order.items.some((item) => item.sellerId === userId)); // Seller can see orders containing their products

		if (!canAccess) {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		res.status(200).json({
			success: true,
			order,
		});
	} catch (error) {
		console.error("Get order by ID error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 🔄 UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { status, notes } = req.body;
		const userId = req.decoded.id;
		const userRole = req.decoded.role;

		// Validate status
		const validStatuses = [
			"pending",
			"confirmed",
			"processing",
			"shipped",
			"delivered",
			"cancelled",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: "Invalid status",
			});
		}

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Check permissions based on role and status
		let canUpdate = false;

		if (userRole === "admin") {
			canUpdate = true;
		} else if (userRole === "seller") {
			// Sellers can update orders containing their products
			const hasSellerItems = order.items.some(
				(item) => item.sellerId === userId
			);
			if (
				hasSellerItems &&
				["confirmed", "processing", "shipped"].includes(status)
			) {
				canUpdate = true;
			}
		} else if (userRole === "consumer" && order.userId === userId) {
			// Consumers can only mark as delivered or cancel pending orders
			if (
				status === "delivered" ||
				(status === "cancelled" && order.status === "pending")
			) {
				canUpdate = true;
			}
		}

		if (!canUpdate) {
			return res.status(403).json({
				success: false,
				message: "You don't have permission to update this order status",
			});
		}

		// Update order
		order.status = status;
		if (notes) {
			order.notes = notes;
		}

		// Set delivery date if delivered
		if (status === "delivered") {
			order.actualDelivery = new Date();
		}

		await order.save();

		res.status(200).json({
			success: true,
			message: "Order status updated successfully",
			order,
		});
	} catch (error) {
		console.error("Update order status error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 📊 SELLER ORDERS
export const getSellerOrders = async (req, res) => {
	try {
		const { sellerId } = req.params;
		const { page = 1, limit = 10, status = "all" } = req.query;
		const userId = req.decoded.id;
		const userRole = req.decoded.role;

		// Verify access
		if (userId !== sellerId && userRole !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		// Build query to find orders containing seller's products
		let query = { "items.sellerId": sellerId };
		if (status !== "all") {
			query.status = status;
		}

		// Calculate pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);
		const total = await Order.countDocuments(query);
		const totalPages = Math.ceil(total / parseInt(limit));

		// Get orders
		const orders = await Order.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		res.status(200).json({
			success: true,
			orders,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				totalPages,
			},
		});
	} catch (error) {
		console.error("Get seller orders error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// 🛡️ ADMIN ORDERS
export const getAdminOrders = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			status = "all",
			userId,
			sellerId,
		} = req.query;

		// Build query
		let query = {};
		if (status !== "all") {
			query.status = status;
		}
		if (userId) {
			query.userId = userId;
		}
		if (sellerId) {
			query["items.sellerId"] = sellerId;
		}

		// Calculate pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);
		const total = await Order.countDocuments(query);
		const totalPages = Math.ceil(total / parseInt(limit));

		// Get orders
		const orders = await Order.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		res.status(200).json({
			success: true,
			orders,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				totalPages,
			},
		});
	} catch (error) {
		console.error("Get admin orders error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
