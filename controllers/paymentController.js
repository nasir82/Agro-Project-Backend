import Stripe from "stripe";

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51...", {
	apiVersion: "2023-10-16",
});

// Create payment intent
export const createPaymentIntent = async (req, res) => {
	try {
		const { amount, userId, items, deliveryDetails } = req.body;

		if (!amount || amount < 50) {
			return res.status(400).json({
				success: false,
				message: "Amount must be at least 50 paisa (0.50 BDT)",
			});
		}

		if (!userId) {
			return res.status(400).json({
				success: false,
				message: "User ID is required",
			});
		}

		// Create payment intent
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(amount), // Amount in smallest currency unit (paisa)
			currency: "bdt",
			metadata: {
				userId,
				itemCount: items?.length || 0,
				region: deliveryDetails?.region || "",
				district: deliveryDetails?.district || "",
			},
			automatic_payment_methods: {
				enabled: true,
			},
		});

		res.status(200).json({
			success: true,
			clientSecret: paymentIntent.client_secret,
			paymentIntentId: paymentIntent.id,
		});
	} catch (error) {
		console.error("Payment intent creation error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
