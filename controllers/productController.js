const Product = require("../models/Product");
const aiService = require("../services/aiService");
const { z, ZodError } = require("zod");
const fs = require("fs").promises;

// Acepta URL http(s) o ruta relativa que empiece con "/"
const imageValidator = z.string().refine(
  (v) => {
    return /^https?:\/\/[^\s]+$/i.test(v) || /^\/[^\s]+$/.test(v);
  },
  {
    message:
      "imagen debe ser una URL http(s) o una ruta relativa que comience con /",
  }
);

const createSchema = z.object({
  nombre: z.string().min(2),
  precio: z.coerce.number().nonnegative(),
  imagen: imageValidator,
  categoria: z.string().min(3),
  descripcion: z.string().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  categoria: z.string().optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
  includeInactive: z.coerce.boolean().optional(),
});

async function getProducts(req, res, next) {
  try {
    const { page, limit, q, categoria, sort, includeInactive } =
      listSchema.parse(req.query);

    let filter = {};
    if (!includeInactive) {
      filter = { $or: [{ activo: true }, { activo: { $exists: false } }] };
    }
    if (q) filter.nombre = { $regex: q, $options: "i" };
    if (categoria) filter.categoria = categoria;

    let sortObj = { createdAt: -1 };
    if (sort === "price_asc") sortObj = { precio: 1 };
    if (sort === "price_desc") sortObj = { precio: -1 };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Query inválida",
        errors: err.errors,
      });
    }
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { nombre, precio, categoria, descripcion, stock } = req.body;
    let data;

    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      data = createSchema.parse({
        nombre,
        precio,
        categoria,
        descripcion,
        stock,
        imagen: imageUrl,
      });
    } else {
      data = createSchema.parse(req.body);
    }

    let productDescription = data.descripcion;
    if (!productDescription) {
      try {
        productDescription = await aiService.generateDescription(
          data.nombre,
          data.categoria
        );
      } catch (err) {
        console.error("Error al generar la descripción con IA:", err.message);
        productDescription = `Suplemento ${data.nombre} de la categoría ${data.categoria}.`;
      }
    }

    const product = await Product.create({
      ...data,
      descripcion: productDescription,
    });
    res.status(201).json(product);
  } catch (err) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    if (err instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Payload inválido",
        errors: err.errors,
      });
    }
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// Nuevo: obtener producto por slug
async function getProductBySlug(req, res, next) {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ status: "error", message: "Producto no encontrado" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ status: "error", message: "Producto no encontrado" });
    }

    res.json({
      status: "success",
      message: "Producto eliminado correctamente",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};