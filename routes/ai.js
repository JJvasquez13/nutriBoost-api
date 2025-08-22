const express = require("express");
const ai = require("../controllers/aiController");
const router = express.Router();

router.post("/description", ai.generateDescription);
router.post("/recommendations", ai.getRecommendations);
router.post("/validate", ai.validateDescription);

module.exports = router;
