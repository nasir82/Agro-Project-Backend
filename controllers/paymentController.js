import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51...", {
	apiVersion: "2023-10-16",
});

// Create Payment Intent Controller
export const createPaymentIntent = async (req, res) => {
	try {
		const { amount, userId, items = [], deliveryDetails = {} } = req.body;

		if (!amount || typeof amount !== "number" || amount < 50) {
			return res.status(400).json({
				success: false,
				message: "Invalid amount. Minimum allowed is 50 paisa (0.50 BDT).",
			});
		}

		if (!userId || typeof userId !== "string") {
			return res.status(400).json({
				success: false,
				message: "A valid User ID is required.",
			});
		}

		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(amount), // Amount in paisa
			currency: "bdt",
			metadata: {
				userId,
				itemCount: items.length,
				region: deliveryDetails.region || "unknown",
				district: deliveryDetails.district || "unknown",
			},
			automatic_payment_methods: { enabled: true },
		});

		return res.status(200).json({
			success: true,
			message: "Payment intent created successfully.",
			clientSecret: paymentIntent.client_secret,
			paymentIntentId: paymentIntent.id,
		});
	} catch (err) {
		console.error("Stripe payment intent error:", err);
		return res.status(500).json({
			success: false,
			message: "Failed to create payment intent.",
			error: err.message,
		});
	}
};
