const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cors = require("cors");

const connectDB = require("./config/db");
const config = require("./config/config");
const logger = require("./utils/logger");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const aiRoutes = require("./routes/ai");
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");

const app = express();

const swaggerDocument = YAML.load("./swagger.yaml");

// Seguridad/Performance
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 120 })); // 120 req/min/ip
app.use(express.json());
app.use(cookieParser());

// DB
connectDB();

// Rutas
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/ai", aiRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handler final
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`);
  res.status(500).json({ status: "error", message: "Error del servidor" });
});

app.listen(config.port, () => {
  logger.info(
    `NutriBoost API en puerto ${config.port} | Docs http://localhost:${config.port}/docs`
  );
});
