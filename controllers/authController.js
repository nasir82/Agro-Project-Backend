import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateJWT, getCookieOptions } from "../middleware/auth.js";

// Register a new user
export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
        userId: existingUser._id,
      });
    }

    // Hash password
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create new user
    const newUser = new User({
      ...req.body,
      password: hashedPassword,
      verified: false,
      operationalArea: {
        region: "",
        district: "",
      },
      role: role || "consumer",
    });

    await newUser.save();

    // Generate JWT using consolidated function
    const token = generateJWT(newUser);

    // Set JWT as a cookie using consolidated options
    res.cookie("JWT_TOKEN_KEY", token, getCookieOptions());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, uid } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if password exists (for OAuth users)
    if (!user.password && password) {
      return res.status(400).json({
        success: false,
        message: "Please login with Google or Facebook",
      });
    }

    // Verify password
    const isMatch =
      user?.provider != "email-pass" ||
      (await bcrypt.compare(password, user.password));

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT using consolidated function
    const token = generateJWT(user);

    // Set JWT as a cookie using consolidated options
    res.cookie("JWT_TOKEN_KEY", token, getCookieOptions());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
export const logout = (req, res) => {
  res.clearCookie("JWT_TOKEN_KEY", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Get user data
export const getUserWithEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select(
      "-password"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify an user
export const verifyUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email });
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User verified successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user role
export const updateRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    // Validate role
    const validRoles = ["admin", "agent", "seller", "consumer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all agents
export const getAllAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "agent", verified: true }).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      agents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get agent by region
export const getAgentByRegion = async (req, res) => {
  try {
    const { region } = req.params;

    const agent = await User.findOne({
      role: "agent",
      region,
      verified: true,
    }).select("-password");

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "No agent found for this region",
      });
    }

    res.status(200).json({
      success: true,
      agent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;

    const user = await User.findOneAndUpdate({ email }, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user password
export const updatePassword = async (req, res) => {
  const { email } = req.params;
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid current password",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
