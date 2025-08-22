const express = require("express");
const {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const auth = require("../middleware/authMiddleware");
const csrfMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", auth, createProduct);
router.put("/:id", csrfMiddleware, updateProduct);
router.delete("/:id", csrfMiddleware, deleteProduct);

module.exports = router;
