import jwt from "jsonwebtoken";

const JWT_SECRET =
	process.env.JWT_SECRET || "smart_agro_connect_jwt_super_secret_key";
const JWT_EXPIRES = "1d";

export const generateJWT = (user) => {
	return jwt.sign(
		{
			id: user._id || user.id,
			email: user.email,
			role: user.role || "consumer",
		},
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES }
	);
};

export const getCookieOptions = () => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	maxAge: 24 * 60 * 60 * 1000, // 1 day
	sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
	partitioned: true,
	path: "/",
});

export const verifyJWT = (req, res, next) => {
	const token =
		req.cookies.JWT_TOKEN_KEY || req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Unauthorized access" });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.decoded = decoded;
		next();
	} catch (err) {
		return res.status(403).json({ message: "Forbidden access" });
	}
};

export const verifyRole = (roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.decoded.role)) {
			return res.status(403).json({ message: "Forbidden access" });
		}
		next();
	};
};

export const verifyUserEmail = (req, res, next) => {
	const emailFromParams = req.params.email;
	const emailFromToken = req.decoded.email;

	// Allow if user is accessing their own data or if user is admin
	if (emailFromParams === emailFromToken || req.decoded.role === "admin") {
		next();
	} else {
		return res.status(403).json({
			message: "Access denied: You can only access your own data",
		});
	}
};
