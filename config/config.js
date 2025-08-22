const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  securityApiUrl: process.env.SECURITY_API_URL,
  securityApiKey: process.env.SECURITY_API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};
