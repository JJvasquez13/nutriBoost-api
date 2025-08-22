const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    detalles: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        nombre: { type: String, required: true },
        cantidad: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "enviado", "cancelado"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
