import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.AI_PORT || 8787);
const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(".env.local");
loadEnvFile(".env");

function loadEnvFile(file) {
  const fullPath = path.resolve(APP_DIR, file);
  if (!fs.existsSync(fullPath)) return;
  for (const line of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function send(res, status, body) {
  const origin = res.req?.headers.origin;
  const allowedOrigin = ["http://127.0.0.1:5173", "http://localhost:5173"].includes(origin) ? origin : "http://127.0.0.1:5173";
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_500_000) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });
    req.on("end", () => resolve(JSON.parse(data || "{}")));
    req.on("error", reject);
  });
}

function outputText(response) {
  if (response.output_text) return response.output_text;
  return (response.output || []).flatMap((item) => item.content || []).filter((part) => part.type === "output_text").map((part) => part.text).join("\n");
}

function jsonFromText(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/api/health") return send(res, 200, {
    ok: true,
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5.2"
  });
  if (req.method !== "POST" || req.url !== "/api/ai") return send(res, 404, { error: "Not found" });
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return send(res, 500, { error: "OPENAI_API_KEY missing. Add it to granula_dummy/.env.local." });
    const { instruction, context } = await readJson(req);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        instructions: [
          "You control a local-first household finance app.",
          "Return JSON only. No markdown.",
          "Choose one action: search_items, search_receipts, set_budget, set_income, tag_item, explain, navigate.",
          "Schema: {\"action\":\"...\",\"query\":\"\",\"year\":0,\"category\":\"\",\"amount\":0,\"itemId\":\"\",\"tag\":\"\",\"route\":\"\",\"answer\":\"\"}.",
          "For retailer searches like Tesco, set action search_items and query exactly to the retailer.",
          "For searches, be extensive. If the user states a year, include that year as a number. If the user does not state a date or year, omit year so the app searches the selected whole year.",
          "For budget edits, set action set_budget, category to the closest existing category, amount to annual GBP.",
          "For income changes, set action set_income and amount to monthly household income in GBP.",
          "For tagging, set action tag_item with itemId and tag.",
          "Do not invent records. Use only the supplied context."
        ].join("\n"),
        input: JSON.stringify({ instruction, context })
      })
    });
    const body = await response.json();
    if (!response.ok) return send(res, response.status, { error: body.error?.message || "OpenAI request failed" });
    send(res, 200, jsonFromText(outputText(body)));
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`AI proxy ready: http://127.0.0.1:${PORT}/api/ai`);
});
