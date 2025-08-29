const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// Rutas IA
router.post("/generate-description", aiController.generateDescription);
router.post("/validate-description", aiController.validateDescription);
router.post("/recommendations", aiController.getRecommendations);

module.exports = router;