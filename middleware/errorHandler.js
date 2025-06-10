// middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
	console.error(err.stack);
	res.status(err.statusCode || 500).json({
		success: false,
		message: err.message || "Server Error",
		stack: process.env.NODE_ENV === "production" ? null : err.stack,
	});
};
