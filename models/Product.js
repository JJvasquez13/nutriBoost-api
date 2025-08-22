// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, index: true },
    slug: { type: String, unique: true, index: true },
    precio: { type: Number, required: true, min: 0 },
    descripcion: { type: String, required: true },
    imagen: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^https?:\/\//i.test(v) || v.startsWith("/"),
        message:
          "imagen debe ser URL http(s) o ruta relativa que comience con /",
      },
    },
    categoria: {
      type: String,
      required: true,
      enum: ["Proteína", "Aminoácidos", "Vitaminas", "Pre-entreno", "Otros"],
      index: true,
    },
    stock: { type: Number, default: 0, min: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (!this.slug && this.nombre) {
    this.slug = this.nombre
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
