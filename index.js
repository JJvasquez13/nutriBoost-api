// index.js

// --- Importaciones ---
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");

// Módulos locales
const connectDB = require("./config/db");
const config = require("./config/config");
const logger = require("./utils/logger");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const aiRoutes = require("./routes/ai");

// --- Inicialización ---
const app = express();

// --- Middlewares ---

// Seguridad y Rendimiento
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

// CORS
app.use(cors({ origin: true, credentials: true }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parseo de peticiones
app.use(express.json());
app.use(cookieParser());

// --- Conexión a DB ---
connectDB();

// --- Rutas ---

// Servidor de archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Documentación de la API
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas de la aplicación
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/ai", aiRoutes);

// --- Manejo de Errores ---

// Ruta no encontrada (404)
app.use((req, res, next) => {
  res.status(404).json({ status: "error", message: "Ruta no encontrada" });
});

// Error general del servidor (500)
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.stack || err.message}`);
  res
    .status(500)
    .json({ status: "error", message: "Error interno del servidor" });
});

// --- Inicio del Servidor ---
app.listen(config.port, () => {
  logger.info(`API escuchando en el puerto ${config.port}`);
  logger.info(`Docs en http://localhost:${config.port}/docs`);
});
