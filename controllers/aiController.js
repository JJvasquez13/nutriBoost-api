const aiService = require("../services/aiService");

const generateDescription = async (req, res) => {
  const { nombre, categoria } = req.body;
  try {
    const description = await aiService.generateDescription(nombre, categoria);
    res.json({ description });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generando descripción", error: error.message });
  }
};

const getRecommendations = async (req, res) => {
  const { productName } = req.body;
  try {
    const recommendations = await aiService.getRecommendations(productName);
    res.json({ recommendations });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error generando recomendaciones",
        error: error.message,
      });
  }
};

const validateDescription = async (req, res) => {
  const { description } = req.body;
  try {
    const corrected = await aiService.validateDescription(description);
    res.json({ corrected });
  } catch (error) {
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
