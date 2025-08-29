const aiService = require("../services/aiService");

/** IA: generar descripción */
const generateDescription = async (req, res) => {
  const { nombre, categoria } = req.body;
  try {
    const description = await aiService.generateDescription(nombre, categoria);
    res.json({ description });
  } catch (error) {
    console.error("Error generando descripción:", error);
    res
      .status(500)
      .json({ message: "Error generando descripción", error: error.message });
  }
};

/** IA: recomendaciones (acepta slug, productId o productName como fallback) */
const getRecommendations = async (req, res) => {
  const { slug, productId, productName, limit } = req.body || {};
  try {
    console.log("IA input:", { slug, productId, productName, limit });
    const recommendations = await aiService.getRecommendations({
      slug,
      productId,
      productName,
      limit,
    });
    console.log("IA output:", recommendations);
    res.json({ recommendations });
  } catch (error) {
    console.error("Error IA recomendaciones:", error);
    res.status(500).json({
      message: error.message || "Error generando recomendaciones",
      error: error.message,
    });
  }
};

/** IA: validar/corregir descripción */
const validateDescription = async (req, res) => {
  const { description } = req.body;
  try {
    const corrected = await aiService.validateDescription(description);
    res.json({ corrected });
  } catch (error) {
    console.error("Error validando descripción:", error);
    res
      .status(500)
      .json({ message: "Error validando descripción", error: error.message });
  }
};

module.exports = {
  generateDescription,
  getRecommendations,
  validateDescription,
};