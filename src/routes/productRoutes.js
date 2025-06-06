import express from "express";
import {
    addProduct,
    getAllProducts,
    searchProducts,
    getProductById,
    deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Public routes
// GET /products – get all approved listings
router.get("/", getAllProducts);

// GET /products/search – filtered search (by region/type/price)
router.get("/search", searchProducts);

// GET /products/:id – product details
router.get("/:id", getProductById);



// Protected routes
// POST /products – seller adds product (agentVerified required)
router.post("/add-product",  addProduct);

// DELETE /products/:id – seller deletes their product
router.delete("/:id",  deleteProduct);

export default router;
