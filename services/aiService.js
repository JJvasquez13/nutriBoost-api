const OpenAI = require("openai");
const Product = require("../models/Product");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function generateDescription(nombre, categoria) {
  const prompt = `
Escribe una breve descripción atractiva (máx 60 palabras) para un producto de ecommerce fitness.
Nombre: "${nombre}". Categoría: "${categoria}".
Devuelve SOLO el texto sin comillas ni markdown.
  `.trim();

  try {
    const r = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });
    return r.output_text?.trim() || "";
  } catch (error) {
    throw new Error("No se pudo generar la descripción con IA.");
  }
}

async function validateDescription(description) {
  const prompt = `
Valida la siguiente descripción de producto. Devuelve JSON {ok:boolean, msg:string}
Reglas:
- 30-80 palabras
- Sin promesas médicas
- Tono motivacional
Texto: """${description || ""}"""
  `.trim();

  try {
    const r = await openai.responses.create({
      model: MODEL,
      response_format: { type: "json_object" },
      input: prompt,
    });

    let out = { ok: false, msg: "Formato inválido" };
    try {
      out = JSON.parse(r.output_text || "{}");
    } catch {}
    return out;
  } catch (error) {
    throw new Error("No se pudo validar la descripción con IA.");
  }
}

async function getRecommendations({ slug, productId, productName, limit = 4 }) {
  // 1) Producto actual
  let current;
  if (productId) current = await Product.findById(productId).lean();
  else if (slug) current = await Product.findOne({ slug }).lean();
  else if (productName) current = await Product.findOne({ nombre: productName }).lean();

  if (!current) throw new Error("Producto no encontrado");

  // 2) Catálogo candidato
  const catalog = await Product.find({
    activo: true,
    stock: { $gt: 0 },
    _id: { $ne: current._id },
  })
    .select("_id slug nombre categoria precio descripcion imagen stock")
    .limit(60)
    .lean();

  // Si no hay productos recomendables, retorna vacío
  if (!catalog.length) return [];

  // 3) Prompt con reglas y salida JSON estricta
  const system = `
Eres un recomendador para un e-commerce de suplementos.
Responde SOLO un JSON: {"slugs": ["slug1","slug2",...]} (máx ${limit}).
Criterios:
1) Prioriza misma categoría que el producto actual.
2) Luego, complementarios (Pre-Entreno ↔ Intra-Entreno ↔ Snacks; Salud y Bienestar puede complementar a todos).
3) No repitas el producto actual. No inventes slugs.
  `.trim();

  const user = {
    current: {
      slug: current.slug,
      nombre: current.nombre,
      categoria: current.categoria,
      descripcion: current.descripcion || "",
      precio: current.precio,
    },
    catalog: catalog.map((p) => ({
      slug: p.slug,
      nombre: p.nombre,
      categoria: p.categoria,
      descripcion: (p.descripcion || "").slice(0, 300),
      precio: p.precio,
    })),
  };

  let slugs = [];
  try {
    const r = await openai.responses.create({
      model: MODEL,
      response_format: { type: "json_object" },
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            "Devuelve slugs recomendados SOLO como {\"slugs\":[...]}\n" +
            JSON.stringify(user),
        },
      ],
    });

    // 4) Parseo y fallback
    try {
      const parsed = JSON.parse(r.output_text || "{}");
      slugs = Array.isArray(parsed.slugs) ? parsed.slugs.slice(0, limit) : [];
    } catch {
      slugs = [];
    }
  } catch (error) {
    // Si OpenAI falla, usa fallback
    slugs = [];
  }

  if (!slugs.length) {
    // Fallback: misma categoría por orden natural
    slugs = catalog
      .filter((p) => p.categoria === current.categoria)
      .slice(0, limit)
      .map((p) => p.slug);
  }

  // 5) Traer productos en el orden propuesto
  const items = await Product.find({ slug: { $in: slugs } })
    .select("_id slug nombre precio imagen categoria stock")
    .lean();

  const bySlug = new Map(items.map((p) => [p.slug, p]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean);

  return ordered;
}

module.exports = {
  generateDescription,
  validateDescription,
  getRecommendations,
};