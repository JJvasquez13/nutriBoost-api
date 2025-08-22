const express = require("express");
const {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");
const csrfMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", auth, createOrder);
router.get("/", auth, getOrders);
router.put("/:id", csrfMiddleware, updateOrder);
router.delete("/:id", csrfMiddleware, deleteOrder);

module.exports = router;
