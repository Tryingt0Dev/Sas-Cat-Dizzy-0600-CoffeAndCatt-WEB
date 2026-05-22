import OpenAI from "openai";

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "missing-key",
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
});

export function hasDeepSeekKey() {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.startsWith("sk-") && !key.includes("pega-tu-api-key"));
}
