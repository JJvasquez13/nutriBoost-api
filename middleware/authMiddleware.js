const axios = require("axios");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const config = require("../config/config");

const http = axios.create({
  baseURL: config.securityApiUrl,
  withCredentials: true,
  timeout: 8000,
});

module.exports = async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      logger.warn("No autorizado: sin token");
      return res
        .status(401)
        .json({ status: "error", message: "No autorizado" });
    }

    // 1) Lee XSRF del cliente
    const xsrfFromHeader = req.get("X-XSRF-TOKEN");
    const xsrfFromCookie = req.cookies?.["XSRF-TOKEN"];
    const xsrfToken = xsrfFromHeader || xsrfFromCookie;
    if (!xsrfToken) {
      return res
        .status(401)
        .json({ status: "error", message: "Falta XSRF-TOKEN" });
    }

    // 2) Valida contra API de seguridad re‐enviando cookie y header
    const response = await http.get("/users/profile", {
      headers: {
        Cookie: `token=${token}`,
        "X-XSRF-TOKEN": xsrfToken,
      },
    });

    const user = response.data?.data?.user || response.data?.user;
    const userId = user?._id || user?.id;
    if (!user || !userId) throw new Error("Perfil de usuario inválido");

    req.user = { id: new mongoose.Types.ObjectId(userId), ...user };
    logger.info(`Auth OK: ${req.user.id}`);
    next();
  } catch (error) {
    logger.error(
      `Auth error: ${error.response?.data?.message || error.message}`
    );
    res
      .status(401)
      .json({
        status: "error",
        message: "No autorizado",
        error: error.message,
      });
  }
};
