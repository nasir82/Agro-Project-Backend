import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Helper function to format cart response
const formatCartResponse = (cart) => ({
	items: cart.items.map((item) => ({
		_id: item.productId,
		title: item.title,
		price: item.price,
		quantity: item.quantity,
		unit: item.unit,
		image: item.image,
		minimumOrderQuantity: item.minimumOrderQuantity,
		seller: {
			sellerId: item.seller.sellerId,
			name: item.seller.name,
		},
		category: item.category,
	})),
	totalItems: cart.totalItems,
	subtotal: cart.subtotal,
	deliveryCharge: cart.deliveryCharge,
	totalAmount: cart.totalAmount,
});

// Helper function to verify user access
const verifyUserAccess = (req, email) => {
	return req.decoded.email === email || req.decoded.role === "admin";
};

// Helper function to validate item data
const validateItemData = (item) => {
	const errors = [];

	if (!item._id) errors.push("Product ID is required");
	if (!item.title) errors.push("Product title is required");
	if (!item.price || item.price <= 0)
		errors.push("Valid price is required (must be > 0)");
	if (!item.unit) errors.push("Product unit is required");
	if (!item.quantity || item.quantity <= 0)
		errors.push("Valid quantity is required (must be > 0)");
	if (item.minimumOrderQuantity && item.quantity < item.minimumOrderQuantity) {
		errors.push(
			`Quantity must be at least ${item.minimumOrderQuantity} (minimum order quantity)`
		);
	}

	return errors;
};

// Helper function to validate operation
const validateOperation = (operation, cart) => {
	const errors = [];
	const { type, productId, quantity, item } = operation;

	if (!type) {
		errors.push("Operation type is required");
		return errors;
	}

	if (type === "update") {
		if (!productId) errors.push("Product ID is required for update operation");
		if (!quantity || quantity <= 0)
			errors.push(
				"Valid quantity is required for update operation (must be > 0)"
			);

		// Check if item exists in cart
		const cartItem = cart.items.find(
			(cartItem) => cartItem.productId === productId
		);
		if (!cartItem) {
			errors.push(
				`Product ${productId} not found in cart for update operation`
			);
		} else if (quantity < cartItem.minimumOrderQuantity) {
			errors.push(
				`Quantity must be at least ${cartItem.minimumOrderQuantity} for product ${productId}`
			);
		}
	} else if (type === "remove") {
		if (!productId) errors.push("Product ID is required for remove operation");

		// Check if item exists in cart
		const cartItem = cart.items.find(
			(cartItem) => cartItem.productId === productId
		);
		if (!cartItem) {
			errors.push(
				`Product ${productId} not found in cart for remove operation`
			);
		}
	} else if (type === "add") {
		if (!item) {
			errors.push("Item data is required for add operation");
		} else {
			const itemErrors = validateItemData(item);
			errors.push(...itemErrors.map((err) => `Add operation: ${err}`));
		}
	} else {
		errors.push(
			`Invalid operation type: ${type}. Supported types are: update, remove, add`
		);
	}

	return errors;
};

// 1. GET /api/cart/:email - Get User Cart
export const getUserCart = async (req, res) => {
	try {
		const { email } = req.params;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only access your own cart.",
			});
		}

		let cart = await Cart.findOne({ userEmail: email });

		// If cart doesn't exist, create an empty one
		if (!cart) {
			cart = new Cart({
				userEmail: email,
				userId: req.decoded.id,
				items: [],
				totalItems: 0,
				subtotal: 0,
				deliveryCharge: 0,
				totalAmount: 0,
			});
			await cart.save();
		}

		res.status(200).json({
			success: true,
			cart: formatCartResponse(cart),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 2. POST /api/cart/add - Add Single Item
export const addSingleItem = async (req, res) => {
	try {
		const {
			email,
			_id,
			title,
			price,
			quantity = 1,
			unit,
			image,
			minimumOrderQuantity = 1,
			category,
			seller,
		} = req.body;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only add to your own cart.",
			});
		}

		// Validate item data
		const itemData = {
			_id,
			title,
			price,
			quantity,
			unit,
			minimumOrderQuantity,
		};
		const validationErrors = validateItemData(itemData);

		if (validationErrors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				error: validationErrors.join(", "),
			});
		}

		// Find or create cart
		let cart = await Cart.findOne({ userEmail: email });

		if (!cart) {
			cart = new Cart({
				userEmail: email,
				userId: req.decoded.id,
				items: [],
				deliveryCharge: 0,
			});
		}

		// Check if item already exists in cart (merge logic)
		const existingItemIndex = cart.items.findIndex(
			(item) => item.productId === _id
		);

		if (existingItemIndex !== -1) {
			// Merge: Add quantities together
			const newQuantity = cart.items[existingItemIndex].quantity + quantity;

			// Validate merged quantity against minimum order quantity
			if (newQuantity < cart.items[existingItemIndex].minimumOrderQuantity) {
				return res.status(400).json({
					success: false,
					message: "Validation failed",
					error: `Total quantity (${newQuantity}) must be at least ${cart.items[existingItemIndex].minimumOrderQuantity}`,
				});
			}

			cart.items[existingItemIndex].quantity = newQuantity;
		} else {
			// Add as new item
			const newItem = {
				productId: _id,
				title: title,
				price: price,
				unit: unit,
				quantity: quantity,
				minimumOrderQuantity: minimumOrderQuantity,
				image: image || "",
				seller: {
					sellerId: seller?.sellerId || "",
					name: seller?.name || "",
				},
				category: category || "",
				addedAt: new Date(),
			};
			cart.items.push(newItem);
		}

		await cart.save();

		res.status(200).json({
			success: true,
			message: "Item added to cart successfully",
			cart: formatCartResponse(cart),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 3. POST /api/cart/add-multiple - Add Multiple Items
export const addMultipleItems = async (req, res) => {
	try {
		const { email, items } = req.body;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only add to your own cart.",
			});
		}

		// Validate required fields
		if (!email || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Bad request/Invalid data",
				error: "Email and items array are required",
			});
		}

		// Validate all items before processing (fail fast approach)
		const allValidationErrors = [];
		items.forEach((item, index) => {
			const errors = validateItemData(item);
			if (errors.length > 0) {
				allValidationErrors.push(`Item ${index + 1}: ${errors.join(", ")}`);
			}
		});

		if (allValidationErrors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed for multiple items",
				error: allValidationErrors.join("; "),
			});
		}

		// Find or create cart
		let cart = await Cart.findOne({ userEmail: email });

		if (!cart) {
			cart = new Cart({
				userEmail: email,
				userId: req.decoded.id,
				items: [],
				deliveryCharge: 0,
			});
		}

		// Process each item with merge logic
		let mergedCount = 0;
		let addedCount = 0;

		for (const item of items) {
			const {
				_id,
				title,
				price,
				quantity,
				unit,
				image,
				category,
				seller,
				minimumOrderQuantity = 1,
			} = item;

			// Check if item already exists in cart (merge logic)
			const existingItemIndex = cart.items.findIndex(
				(cartItem) => cartItem.productId === _id
			);

			if (existingItemIndex !== -1) {
				// Merge: Add quantities together
				cart.items[existingItemIndex].quantity += quantity;
				mergedCount++;
			} else {
				// Add as new item
				const newItem = {
					productId: _id,
					title: title,
					price: price,
					unit: unit,
					quantity: quantity,
					minimumOrderQuantity: minimumOrderQuantity,
					image: image || "",
					seller: {
						sellerId: seller?.sellerId || "",
						name: seller?.name || "",
					},
					category: category || "",
					addedAt: new Date(),
				};
				cart.items.push(newItem);
				addedCount++;
			}
		}

		await cart.save();

		res.status(200).json({
			success: true,
			message: `Items added to cart successfully (${addedCount} new, ${mergedCount} merged)`,
			cart: formatCartResponse(cart),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 4. PUT /api/cart/update - Update Item Quantity
export const updateCartItem = async (req, res) => {
	try {
		const { email, productId, quantity } = req.body;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only update your own cart.",
			});
		}

		// Validate required fields
		if (!email || !productId || !quantity) {
			return res.status(400).json({
				success: false,
				message: "Bad request/Invalid data",
				error: "Email, productId, and quantity are required",
			});
		}

		// Validate quantity
		if (quantity <= 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				error: "Quantity must be greater than 0",
			});
		}

		const cart = await Cart.findOne({ userEmail: email });

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
				error: "Cart not found for this user",
			});
		}

		// Find the item to update
		const itemIndex = cart.items.findIndex(
			(item) => item.productId === productId
		);

		if (itemIndex === -1) {
			return res.status(404).json({
				success: false,
				message: "Item not found",
				error: `Product ${productId} not found in cart`,
			});
		}

		// Verify minimum order quantity (business rule)
		const item = cart.items[itemIndex];
		if (quantity < item.minimumOrderQuantity) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				error: `Quantity must be at least ${item.minimumOrderQuantity} (minimum order quantity for ${item.title})`,
			});
		}

		// Update quantity
		cart.items[itemIndex].quantity = quantity;
		await cart.save();

		res.status(200).json({
			success: true,
			message: "Cart updated successfully",
			cart: formatCartResponse(cart),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 5. DELETE /api/cart/remove - Remove Single Item
export const removeCartItem = async (req, res) => {
	try {
		const { email, productId } = req.body;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only modify your own cart.",
			});
		}

		// Validate required fields
		if (!email || !productId) {
			return res.status(400).json({
				success: false,
				message: "Bad request/Invalid data",
				error: "Email and productId are required",
			});
		}

		const cart = await Cart.findOne({ userEmail: email });

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
				error: "Cart not found for this user",
			});
		}

		// Find and remove the item
		const itemIndex = cart.items.findIndex(
			(item) => item.productId === productId
		);

		if (itemIndex === -1) {
			return res.status(404).json({
				success: false,
				message: "Item not found",
				error: `Product ${productId} not found in cart`,
			});
		}

		const removedItem = cart.items[itemIndex];
		cart.items.splice(itemIndex, 1);
		await cart.save();

		res.status(200).json({
			success: true,
			message: `Item "${removedItem.title}" removed from cart`,
			cart: formatCartResponse(cart),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 6. DELETE /api/cart/clear/:email - Clear Entire Cart
export const clearCart = async (req, res) => {
	try {
		const { email } = req.params;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only clear your own cart.",
			});
		}

		const cart = await Cart.findOne({ userEmail: email });

		if (!cart) {
			return res.status(404).json({
				success: false,
				message: "Cart not found",
				error: "Cart not found for this user",
			});
		}

		const itemCount = cart.items.length;

		// Clear all items
		cart.items = [];
		cart.deliveryCharge = 0;
		await cart.save();

		res.status(200).json({
			success: true,
			message: `Cart cleared successfully (${itemCount} items removed)`,
			cart: formatCartResponse(cart),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 7. POST /api/cart/batch-update - Batch Update Multiple Items (Atomic Processing)
export const batchUpdateCart = async (req, res) => {
	try {
		const { email, operations } = req.body;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only update your own cart.",
			});
		}

		// Validate required fields
		if (!email || !Array.isArray(operations) || operations.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Bad request/Invalid data",
				error: "Email and operations array are required",
			});
		}

		let cart = await Cart.findOne({ userEmail: email });

		if (!cart) {
			cart = new Cart({
				userEmail: email,
				userId: req.decoded.id,
				items: [],
				deliveryCharge: 0,
			});
		}

		// Create a deep copy of cart for atomic processing
		const originalCartItems = JSON.parse(JSON.stringify(cart.items));

		// Validate ALL operations before processing any (fail fast)
		const allValidationErrors = [];
		operations.forEach((operation, index) => {
			const errors = validateOperation(operation, cart);
			if (errors.length > 0) {
				allValidationErrors.push(
					`Operation ${index + 1}: ${errors.join(", ")}`
				);
			}
		});

		if (allValidationErrors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Batch operation validation failed",
				error: allValidationErrors.join("; "),
			});
		}

		// Process operations sequentially to maintain data integrity
		let processedCount = 0;
		const operationResults = [];

		try {
			for (let i = 0; i < operations.length; i++) {
				const operation = operations[i];
				const { type, productId, quantity, item } = operation;

				if (type === "update") {
					const itemIndex = cart.items.findIndex(
						(cartItem) => cartItem.productId === productId
					);
					if (itemIndex !== -1) {
						const oldQuantity = cart.items[itemIndex].quantity;
						cart.items[itemIndex].quantity = quantity;
						operationResults.push(
							`Updated ${cart.items[itemIndex].title}: ${oldQuantity} → ${quantity}`
						);
						processedCount++;
					}
				} else if (type === "remove") {
					const itemIndex = cart.items.findIndex(
						(cartItem) => cartItem.productId === productId
					);
					if (itemIndex !== -1) {
						const removedItem = cart.items[itemIndex];
						cart.items.splice(itemIndex, 1);
						operationResults.push(`Removed ${removedItem.title}`);
						processedCount++;
					}
				} else if (type === "add") {
					const {
						_id,
						title,
						price,
						quantity: itemQuantity,
						unit,
						image,
						category,
						seller,
						minimumOrderQuantity = 1,
					} = item;

					// Check if item already exists (merge logic)
					const existingItemIndex = cart.items.findIndex(
						(cartItem) => cartItem.productId === _id
					);

					if (existingItemIndex !== -1) {
						// Merge: Add quantities together
						const oldQuantity = cart.items[existingItemIndex].quantity;
						cart.items[existingItemIndex].quantity += itemQuantity;
						operationResults.push(
							`Merged ${title}: ${oldQuantity} + ${itemQuantity} = ${cart.items[existingItemIndex].quantity}`
						);
					} else {
						// Add new item to cart
						const newItem = {
							productId: _id,
							title: title,
							price: price,
							unit: unit,
							quantity: itemQuantity,
							minimumOrderQuantity: minimumOrderQuantity,
							image: image || "",
							seller: {
								sellerId: seller?.sellerId || "",
								name: seller?.name || "",
							},
							category: category || "",
							addedAt: new Date(),
						};
						cart.items.push(newItem);
						operationResults.push(`Added ${title} (qty: ${itemQuantity})`);
					}
					processedCount++;
				}
			}

			// All operations successful - save to database
			await cart.save();

			res.status(200).json({
				success: true,
				message: `Batch update completed successfully (${processedCount} operations processed)`,
				cart: formatCartResponse(cart),
				operationResults: operationResults,
			});
		} catch (operationError) {
			// Rollback: restore original cart items
			cart.items = originalCartItems;

			res.status(500).json({
				success: false,
				message: "Batch operation failed - all changes rolled back",
				error: `Operation failed at step ${processedCount + 1}: ${
					operationError.message
				}`,
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

// 8. POST /api/cart/preview-merge - Preview Cart Merge (Optional)
export const previewCartMerge = async (req, res) => {
	try {
		const { email, newItems } = req.body;

		// Verify user access
		if (!verifyUserAccess(req, email)) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
				error: "Access denied. You can only preview your own cart.",
			});
		}

		// Validate required fields
		if (!email || !Array.isArray(newItems)) {
			return res.status(400).json({
				success: false,
				message: "Bad request/Invalid data",
				error: "Email and newItems array are required",
			});
		}

		const cart = await Cart.findOne({ userEmail: email });
		const currentItems = cart ? cart.items.length : 0;

		let mergedItems = 0;
		let totalQuantityIncrease = 0;
		const mergeDetails = [];

		// Calculate merge preview with detailed information
		if (cart) {
			for (const newItem of newItems) {
				const existingItem = cart.items.find(
					(item) => item.productId === newItem._id
				);

				if (existingItem) {
					mergedItems++;
					totalQuantityIncrease += newItem.quantity;
					mergeDetails.push({
						productId: newItem._id,
						title: newItem.title,
						action: "merge",
						currentQuantity: existingItem.quantity,
						addingQuantity: newItem.quantity,
						finalQuantity: existingItem.quantity + newItem.quantity,
					});
				} else {
					totalQuantityIncrease += newItem.quantity;
					mergeDetails.push({
						productId: newItem._id,
						title: newItem.title,
						action: "add",
						quantity: newItem.quantity,
					});
				}
			}
		} else {
			totalQuantityIncrease = newItems.reduce(
				(total, item) => total + item.quantity,
				0
			);
			newItems.forEach((item) => {
				mergeDetails.push({
					productId: item._id,
					title: item.title,
					action: "add",
					quantity: item.quantity,
				});
			});
		}

		const finalItems = currentItems + newItems.length - mergedItems;

		res.status(200).json({
			success: true,
			preview: {
				currentItems,
				newItems: newItems.length,
				finalItems,
				mergedItems,
				totalQuantityIncrease,
				mergeDetails,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};
