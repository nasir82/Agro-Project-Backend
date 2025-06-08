import Product from "../models/Product.js";

// Add a new product
export const addProduct = async (req, res) => {
  try {
    const { sellerInfo } = req.body;

    // Check if seller is verified
    const seller = await User.findById(sellerInfo?._id).exec();

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "User data not found",
      });
    } else if (!seller?.verified) {
      return res.status(403).json({
        success: false,
        message: "Seller is not verified",
      });
    }

    const newProduct = new Product({
      ...req.body,
      quality: "D",
      approvedBy: { agentId: null, approvedAt: null },
      averageRating: 0,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all approved products
export const getAllProducts = async (req, res) => {
  try {
    const {
      cropType,
      region,
      district,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let query = { status: "approved" };

    if (cropType) query.cropType = cropType;
    if (region) query["sellerInfo.operationalArea.region"] = region;
    if (district) query["sellerInfo.operationalArea.district"] = district;

    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
    }

    const maxPriceResult = await Product.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, maxPrice: { $max: "$pricePerUnit" } } },
    ]);

    const existingMaxPrice =
      maxPriceResult.length > 0 ? maxPriceResult[0].maxPrice : 0;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const products = await Product.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      totalProducts: total,
      maxPrice: existingMaxPrice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const {
      cropType,
      region,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let query = { status: "approved" };

    if (cropType) query.cropType = cropType;
    if (region) query["sellerInfo.operationalArea.region"] = region;

    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const products = await Product.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.decoded.id;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      product.sellerInfo._id.toString() !== userId &&
      req.decoded.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
