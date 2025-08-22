const Order = require("../models/Order");
const { z } = require("zod");

const createOrderSchema = z.object({
  detalles: z
    .array(
      z.object({
        productId: z.string(),
        nombre: z.string(),
        cantidad: z.number().int().min(1),
        subtotal: z.number().nonnegative(),
      })
    )
    .min(1),
  total: z.number().nonnegative(),
});

async function createOrder(req, res) {
  const data = createOrderSchema.parse(req.body);
  const order = await Order.create({
    ...data,
    userId: req.user?.id, // puede venir de auth
  });
  res.status(201).json(order);
}

async function getOrders(req, res) {
  const orders = await Order.find().populate("detalles.productId");
  res.json(orders);
}

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Order.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res
        .status(404)
        .json({ status: "error", message: "Orden no encontrada" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Eliminar orden
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ status: "error", message: "Orden no encontrada" });
    }

    res.json({ status: "success", message: "Orden eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = { createOrder, getOrders, updateOrder, deleteOrder };
