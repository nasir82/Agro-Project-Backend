import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import regionRoutes from "./routes/regionRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";

// Import DB connection
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
	cors({
		origin: [
			"*",
			"https://smartagroconnect-79578.web.app",
			"http://localhost:5173",
			"http://localhost:5000",
			"https://smart-agro-connect-server.vercel.app",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true, // Allow cookies to be sent with requests
	})
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/users", authRoutes);
app.use("/admin", adminRoutes);
app.use("/agents", agentRoutes);
app.use("/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/reviews", reviewRoutes);
app.use("/regions", regionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/", paymentRoutes); // Payment routes are at root level for /create-payment-intent
app.use("/applications", applicationRoutes);

// Base route
app.get("/", (req, res) => {
	res.send("Smart Agro Market API is running...");
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, "0.0.0.0", () => {
	console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.log(`Error: ${err.message}`);
	// Close server & exit process
	process.exit(1);
});
