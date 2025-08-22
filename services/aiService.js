const OpenAI = require("openai");
const config = require("../config/config");
const logger = require("../utils/logger");

if (!config.openaiApiKey) {
  throw new Error("Falta OPENAI_API_KEY en variables de entorno");
}

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: config.openaiBaseUrl, // opcional
  timeout: 20_000,
});

async function withRetry(fn, { retries = 2, delayMs = 600 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.response?.status;
      // Reintentar en 429/5xx/timeouts
      if (
        i < retries &&
        (status === 429 ||
          (status >= 500 && status < 600) ||
          err.code === "ETIMEDOUT")
      ) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

// --- Descripción corta, max ~100 palabras
async function generateDescription(nombre, categoria) {
  const prompt = [
    {
      role: "system",
      content:
        "Eres copywriter de suplementos. Redacta descripciones precisas, atractivas y responsables (sin claims médicos). Máx. 100 palabras.",
    },
    {
      role: "user",
      content: `Producto: "${nombre}"\nCategoría: "${categoria}"\nIncluye beneficios, ingredientes clave si son comunes, y cómo usarlo. Tono profesional y claro.`,
    },
  ];

  const res = await withRetry(() =>
    openai.chat.completions.create({
      model: config.openaiModel,
      messages: prompt,
      max_tokens: 180,
      temperature: 0.7,
    })
  );

  const txt = res.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error("Respuesta vacía de OpenAI");
  logger.info({ msg: "Descripción generada", nombre });
  return txt;
}

// --- Recomendaciones en JSON seguro
async function getRecommendations(productName) {
  const prompt = [
    {
      role: "system",
      content:
        'Devuelve exclusivamente un JSON con el esquema {"items":[{"name":string}...]}. No escribas texto adicional.',
    },
    {
      role: "user",
      content: `Recomienda 3 suplementos similares a "${productName}" vendidos en tiendas fitness. Solo nombres genéricos (sin marcas) y evita claims no verificados.`,
    },
  ];

  const res = await withRetry(() =>
    openai.chat.completions.create({
      model: config.openaiModel,
      messages: prompt,
      max_tokens: 150,
      temperature: 0.4,
      response_format: { type: "json_object" }, // fuerza JSON
    })
  );

  const raw = res.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Respuesta vacía de OpenAI");
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("JSON inválido en recomendaciones");
  }
  const list = Array.isArray(json.items)
    ? json.items.map((i) => i.name).filter(Boolean)
    : [];
  if (list.length === 0) throw new Error("Recomendaciones vacías");
  logger.info({ msg: "Recomendaciones generadas", productName, list });
  return list;
}

// --- Validación/edición (clara y corta)
async function validateDescription(description) {
  const prompt = [
    {
      role: "system",
      content:
        "Edita el texto para claridad, precisión y cumplimiento (sin promesas médicas). Mantén ≤100 palabras.",
    },
    {
      role: "user",
      content: `Texto:\n"""${description}"""`,
    },
  ];

  const res = await withRetry(() =>
    openai.chat.completions.create({
      model: config.openaiModel,
      messages: prompt,
      max_tokens: 180,
      temperature: 0.3,
    })
  );

  const txt = res.choices?.[0]?.message?.content?.trim();
  if (!txt) throw new Error("Respuesta vacía de OpenAI");
  logger.info({ msg: "Descripción validada" });
  return txt;
}

module.exports = {
  generateDescription,
  getRecommendations,
  validateDescription,
};
