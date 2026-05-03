import { Router, type IRouter } from "express";

const router: IRouter = Router();

/* ── Server-side daily rate limiter ──────────────────── */
const RATE_LIMIT = 20;
const rateLimitStore = new Map<string, { date: string; count: number }>();

function getClientKey(req: Parameters<Parameters<IRouter["post"]>[1]>[0]): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ?? req.ip ?? "unknown";
  return ip.trim();
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split("T")[0];
  const entry = rateLimitStore.get(key);
  if (!entry || entry.date !== today) {
    rateLimitStore.set(key, { date: today, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

interface HistoryMessage {
  role: "user" | "model";
  text: string;
}

interface VehicleContext {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  engine?: string | null;
  fuel_type?: string | null;
  mileage?: number | null;
  mileage_unit?: string | null;
  expenses?: Array<{ type: string; amount: number; description?: string | null; created_at: string }>;
  documents?: Array<{ type: string; created_at: string }>;
}

router.post("/cargpt", async (req, res) => {
  const { vehicleContext, userMessage, history } = req.body as {
    vehicleContext: VehicleContext;
    userMessage: string;
    history: HistoryMessage[];
  };

  if (!userMessage || typeof userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const clientKey = getClientKey(req);
  const { allowed, remaining } = checkRateLimit(clientKey);
  if (!allowed) {
    res.status(429).json({ error: "You've used all your CarGPT questions for today. Come back tomorrow." });
    return;
  }
  res.setHeader("X-CarGPT-Remaining", String(remaining));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not set");
    res.status(500).json({ error: "CarGPT is unavailable right now. Try again in a moment." });
    return;
  }

  const vc = vehicleContext ?? {};
  const vehicleLine = [vc.year, vc.make, vc.model, vc.trim].filter(Boolean).join(" ");
  const engineLine = [vc.engine, vc.fuel_type].filter(Boolean).join(", ");
  const mileageLine = vc.mileage != null ? `${vc.mileage.toLocaleString()} ${vc.mileage_unit ?? ""}`.trim() : null;

  const expenseSummary =
    vc.expenses && vc.expenses.length > 0
      ? vc.expenses
          .slice(0, 20)
          .map((e) => `- ${e.type}: $${e.amount}${e.description ? ` (${e.description})` : ""} on ${e.created_at.split("T")[0]}`)
          .join("\n")
      : "No recorded expenses.";

  const documentSummary =
    vc.documents && vc.documents.length > 0
      ? vc.documents
          .slice(0, 10)
          .map((d) => `- ${d.type} on ${d.created_at.split("T")[0]}`)
          .join("\n")
      : "No recorded documents.";

  const systemInstruction = [
    "You are CarGPT, a knowledgeable and friendly automotive assistant built into the Gari vehicle management app.",
    "You help users with questions about their specific vehicle.",
    "",
    "Vehicle information:",
    vehicleLine ? `- Vehicle: ${vehicleLine}` : null,
    engineLine ? `- Engine / Fuel: ${engineLine}` : null,
    mileageLine ? `- Current mileage: ${mileageLine}` : null,
    "",
    "Recent expense history:",
    expenseSummary,
    "",
    "Recorded documents:",
    documentSummary,
    "",
    "Guidelines:",
    "- Keep answers concise and practical.",
    "- If unsure, say so rather than guessing.",
    "- Focus on the user's specific vehicle when relevant.",
    "- Do not make up expense or document data not shown above.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const safeHistory: HistoryMessage[] = Array.isArray(history) ? history.slice(-6) : [];

  const contents = [
    ...safeHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "Gemini API error");
      res.status(502).json({ error: "CarGPT is unavailable right now. Try again in a moment." });
      return;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) {
      res.status(502).json({ error: "CarGPT is unavailable right now. Try again in a moment." });
      return;
    }

    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "Failed to call Gemini API");
    res.status(502).json({ error: "CarGPT is unavailable right now. Try again in a moment." });
  }
});

export default router;
