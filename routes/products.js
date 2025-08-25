// routes/products.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController"); // Importa el controlador
const upload = require("../middleware/uploader"); // Importa el middleware de subida

// Obtener todos los productos
router.get("/", productController.getProducts);
// Crear un nuevo producto (con subida de imagen)
router.post("/", upload.single("imagen"), productController.createProduct);
// Obtener un producto por ID
router.get("/:id", productController.getProductById);
// Actualizar un producto por ID
router.put("/:id", productController.updateProduct);
// Eliminar un producto por ID
router.delete("/:id", productController.deleteProduct);

module.exports = router;
