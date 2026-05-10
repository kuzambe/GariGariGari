/* ──────────────────────────────────────────────────────────────
 * Rule-based document parser for Gari.
 * Pure JS — no AI, no external API calls.
 * Input: raw OCR text. Output: detected type + extracted fields.
 * ────────────────────────────────────────────────────────────── */

export type DocType =
  | "mechanic_invoice"
  | "insurance"
  | "registration"
  | "receipt"
  | "unknown";

export interface ParsedFields {
  // Common
  date?: string;          // ISO yyyy-mm-dd if we can normalise, else original string
  rawDate?: string;       // original matched string
  amount?: number;        // total in dollars
  // Mechanic / receipt
  shopName?: string;
  merchant?: string;
  services?: string[];
  category?: string;      // for receipts: Fuel | Maintenance | Parts | Other
  // Insurance
  provider?: string;
  policyNumber?: string;
  expiryDate?: string;
  rawExpiryDate?: string;
  coverage?: string[];
  // Registration
  plateNumber?: string;
  ownerName?: string;
}

export interface ParseResult {
  type: DocType;
  fields: ParsedFields;
  confidence: "detected" | "unknown";
}

/* ── 1. Document type detection ───────────────────────────── */

const KEYWORDS: Record<Exclude<DocType, "unknown">, RegExp[]> = {
  mechanic_invoice: [
    /\binvoice\b/i, /\brepair order\b/i, /\bwork order\b/i,
    /\blabou?r\b/i, /\bparts?\b/i, /\bmechanic\b/i,
    /\bservice (centre|center)\b/i, /\btotal due\b/i, /\bamount due\b/i,
    /\bauto(motive)?\b/i, /\bgarage\b/i,
  ],
  insurance: [
    /\binsurance\b/i, /\bpolicy\b/i, /\binsured\b/i, /\bcoverage\b/i,
    /\bpremium\b/i, /\bexpiry\b/i, /\beffective date\b/i, /\bbroker\b/i,
    /\bdeductible\b/i, /\bunderwritten\b/i,
  ],
  registration: [
    /\bregistration\b/i, /\bvehicle permit\b/i, /\bpermit\b/i,
    /\blicen[cs]e plate\b/i, /\bregistered owner\b/i,
    /\bministry of transportation\b/i, /\bMTO\b/,
  ],
  receipt: [
    /\breceipt\b/i, /\bthank you for your (purchase|order)\b/i,
    /\bsubtotal\b/i, /\bHST\b/, /\bGST\b/, /\bchange due\b/i,
    /\bpayment\b/i, /\bvisa\b/i, /\bmastercard\b/i, /\bdebit\b/i,
  ],
};

function scoreType(text: string, type: Exclude<DocType, "unknown">): number {
  return KEYWORDS[type].reduce((n, re) => (re.test(text) ? n + 1 : n), 0);
}

export function detectDocumentType(text: string): DocType {
  if (!text || text.trim().length < 10) return "unknown";
  // Ordered evaluation per spec — first matching category wins.
  const order: Exclude<DocType, "unknown">[] = [
    "mechanic_invoice", "insurance", "registration", "receipt",
  ];
  for (const t of order) {
    if (scoreType(text, t) >= 1) return t;
  }
  return "unknown";
}

/* ── 2. Date extraction & normalisation ───────────────────── */

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

const DATE_PATTERNS: RegExp[] = [
  /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g,                  // 12/05/2026
  /\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/g,                      // Jan 12, 2026
  /\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/g,                        // 12 Jan 2026
  /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g,                    // 2026-01-12
];

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function normaliseYear(y: number): number {
  if (y < 100) return y >= 70 ? 1900 + y : 2000 + y;
  return y;
}

function tryNormaliseDate(raw: string): string | undefined {
  for (const re of DATE_PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(raw);
    if (!m) continue;
    // 2026-01-12
    if (/^\d{4}$/.test(m[1])) {
      const y = +m[1], mo = +m[2], d = +m[3];
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${pad(mo)}-${pad(d)}`;
    }
    // Numeric DD/MM/YYYY (assume DD/MM since Canadian context; fall back if first > 12)
    if (/^\d{1,2}$/.test(m[1]) && /^\d{1,2}$/.test(m[2])) {
      let d = +m[1], mo = +m[2];
      const y = normaliseYear(+m[3]);
      if (mo > 12 && d <= 12) { const t = d; d = mo; mo = t; }
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${pad(mo)}-${pad(d)}`;
    }
    // Month name forms
    const monthName = (m[1] && /^[A-Za-z]+$/.test(m[1])) ? m[1] : m[2];
    const dayStr = (m[1] && /^[A-Za-z]+$/.test(m[1])) ? m[2] : m[1];
    const yearStr = m[3];
    const mo = MONTHS[monthName?.toLowerCase()];
    if (mo) {
      const d = +dayStr;
      const y = normaliseYear(+yearStr);
      if (d >= 1 && d <= 31) return `${y}-${pad(mo)}-${pad(d)}`;
    }
  }
  return undefined;
}

function extractDates(text: string): { raw: string; iso?: string; index: number }[] {
  const found: { raw: string; iso?: string; index: number }[] = [];
  const seenAt = new Set<number>();
  for (const re of DATE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      // De-duplicate matches that overlap at the same position
      if (seenAt.has(m.index)) continue;
      seenAt.add(m.index);
      found.push({ raw: m[0], iso: tryNormaliseDate(m[0]), index: m.index });
    }
  }
  // Sort by document position so "first date" / "second date" heuristics are stable.
  found.sort((a, b) => a.index - b.index);
  return found;
}

/* ── 3. Amount extraction ─────────────────────────────────── */

const TOTAL_KEYWORDS = /(grand\s+total|total\s+due|amount\s+due|balance\s+due|balance|total)/i;

function parseMoney(s: string): number | undefined {
  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function extractTotal(text: string): number | undefined {
  // Prefer amounts on lines containing total keywords.
  const lines = text.split(/\r?\n/);
  let best: number | undefined;
  for (const line of lines) {
    if (!TOTAL_KEYWORDS.test(line)) continue;
    const amounts = [...line.matchAll(/\$?\s*([\d,]+\.\d{2})/g)]
      .map((m) => parseMoney(m[1]))
      .filter((n): n is number => n !== undefined);
    if (amounts.length) {
      const candidate = amounts[amounts.length - 1];
      if (best === undefined || candidate > best) best = candidate;
    }
  }
  if (best !== undefined) return best;

  // Fallback: largest dollar amount in the document.
  const all = [...text.matchAll(/\$?\s*([\d,]+\.\d{2})/g)]
    .map((m) => parseMoney(m[1]))
    .filter((n): n is number => n !== undefined);
  if (all.length) return Math.max(...all);
  return undefined;
}

/* ── 4. Shop / merchant name (top-of-document heuristic) ──── */

const NAME_TAIL_HINTS = /(auto|motors?|garage|service|automotive|repair|tire|oil|lube|brake)/i;

function topNameLine(text: string, hint = false): string | undefined {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return undefined;

  // First, look for a line with a hint word like "Auto", "Motors", "Garage"
  if (hint) {
    for (const line of lines.slice(0, 8)) {
      if (NAME_TAIL_HINTS.test(line) && line.length < 60 && !/\d{3,}/.test(line)) {
        return line;
      }
    }
  }

  // Otherwise, the first non-numeric, non-address-looking line in the top 5
  for (const line of lines.slice(0, 5)) {
    if (line.length < 4 || line.length > 60) continue;
    if (/^\d+/.test(line)) continue;          // street address
    if (/^[\d\W]+$/.test(line)) continue;     // numbers only
    return line;
  }
  return lines[0];
}

/* ── 5. Mechanic invoice parser ───────────────────────────── */

const SERVICE_KEYWORDS = [
  "oil change", "oil filter", "brake", "brake pad", "brake fluid",
  "tire", "tyre", "rotation", "wheel alignment", "alignment",
  "filter", "air filter", "cabin filter", "fuel filter",
  "flush", "coolant", "transmission", "fluid", "battery",
  "belt", "timing belt", "serpentine", "spark plug",
  "inspection", "diagnostic", "wiper", "shock", "strut",
  "exhaust", "muffler", "radiator", "alternator", "starter",
  "repair", "replace", "install", "tune up", "tune-up",
];

function extractServices(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.length > 80) continue;
    if (TOTAL_KEYWORDS.test(line)) continue;       // skip totals lines
    if (SERVICE_KEYWORDS.some((k) => lower.includes(k))) {
      // Strip leading qty/sku/price columns
      const cleaned = line.replace(/\s*\$?\d+(\.\d{2})?\s*$/, "").trim();
      const key = cleaned.toLowerCase();
      if (cleaned && !seen.has(key)) {
        out.push(cleaned);
        seen.add(key);
      }
    }
  }
  return out.slice(0, 8);
}

function parseMechanicInvoice(text: string): ParsedFields {
  const dates = extractDates(text);
  const primary = dates[0];
  return {
    shopName: topNameLine(text, true),
    rawDate: primary?.raw,
    date: primary?.iso ?? primary?.raw,
    amount: extractTotal(text),
    services: extractServices(text),
  };
}

/* ── 6. Insurance parser ──────────────────────────────────── */

const INSURANCE_PROVIDERS = [
  "Intact", "Aviva", "Wawanesa", "Co-operators", "Cooperators", "Desjardins",
  "TD Insurance", "TD Meloche Monnex", "Belair", "Belairdirect",
  "Economical", "Gore Mutual", "Allstate", "State Farm",
  "CAA Insurance", "CAA", "Sonnet", "RBC Insurance", "Square One",
];

function extractProvider(text: string): string | undefined {
  for (const p of INSURANCE_PROVIDERS) {
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) return p;
  }
  // Fallback: text after "underwritten by" / "insured by"
  const m = text.match(/(?:underwritten|insured)\s+by\s+([A-Za-z][A-Za-z &.'\-]{2,40})/i);
  if (m) return m[1].trim();
  return undefined;
}

function extractPolicyNumber(text: string): string | undefined {
  const m = text.match(/policy\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9\-]{6,20})/i);
  return m ? m[1].toUpperCase() : undefined;
}

function extractExpiry(text: string): { iso?: string; raw?: string } {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!/\b(expir|expires|expiration|valid\s+until|effective\s+until|renewal\s+date)\b/i.test(line)) continue;
    const dates = extractDates(line);
    if (dates.length) return { iso: dates[0].iso, raw: dates[0].raw };
  }
  // Fallback — the second date in the document (first is often issue date).
  const all = extractDates(text);
  if (all.length >= 2) return { iso: all[1].iso, raw: all[1].raw };
  return {};
}

const COVERAGE_KEYWORDS = ["liability", "collision", "comprehensive", "accident benefits", "uninsured"];

function extractCoverage(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  for (const k of COVERAGE_KEYWORDS) {
    if (lower.includes(k)) out.push(k.replace(/\b\w/g, (c) => c.toUpperCase()));
  }
  return out;
}

function parseInsurance(text: string): ParsedFields {
  const exp = extractExpiry(text);
  return {
    provider: extractProvider(text),
    policyNumber: extractPolicyNumber(text),
    expiryDate: exp.iso ?? exp.raw,
    rawExpiryDate: exp.raw,
    coverage: extractCoverage(text),
  };
}

/* ── 7. Registration parser ───────────────────────────────── */

function extractPlate(text: string): string | undefined {
  // Look near "plate" / "permit number"
  const near = text.match(/(?:licen[cs]e\s+plate|plate(?:\s*number)?|permit\s*(?:number|no\.?)?)\s*[:#-]?\s*([A-Z0-9\- ]{4,10})/i);
  if (near) return near[1].replace(/\s+/g, "").toUpperCase();
  // Generic Canadian plate patterns
  const generic = text.match(/\b([A-Z]{4}\s?\d{3})\b|\b([A-Z]{3}\s?\d{3,4})\b|\b(\d{3}\s?[A-Z]{3})\b/);
  if (generic) return (generic[1] || generic[2] || generic[3]).replace(/\s+/g, "").toUpperCase();
  return undefined;
}

function extractOwner(text: string): string | undefined {
  const m = text.match(/(?:registered\s+owner|owner|name)\s*[:#-]?\s*([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){1,3})/);
  return m ? m[1].trim() : undefined;
}

function parseRegistration(text: string): ParsedFields {
  const exp = extractExpiry(text);
  return {
    plateNumber: extractPlate(text),
    expiryDate: exp.iso ?? exp.raw,
    rawExpiryDate: exp.raw,
    ownerName: extractOwner(text),
  };
}

/* ── 8. Receipt parser ────────────────────────────────────── */

const FUEL_HINTS = ["shell", "esso", "petro", "pioneer", "ultramar", "husky", "mobil", "chevron", "gas", "fuel", "petrol"];
const MAINT_HINTS = ["canadian tire", "napa", "autozone", "parts source", "lordco", "midas", "jiffy lube", "oil change", "brake"];
const PARTS_HINTS = ["carquest", "autoparts", "rockauto", "advance auto"];

function guessReceiptCategory(merchant: string): string {
  const m = merchant.toLowerCase();
  if (FUEL_HINTS.some((h) => m.includes(h))) return "Fuel";
  if (MAINT_HINTS.some((h) => m.includes(h))) return "Maintenance";
  if (PARTS_HINTS.some((h) => m.includes(h))) return "Parts";
  return "Other";
}

function parseReceipt(text: string): ParsedFields {
  const merchant = topNameLine(text) ?? "";
  const dates = extractDates(text);
  const primary = dates[0];
  return {
    merchant,
    rawDate: primary?.raw,
    date: primary?.iso ?? primary?.raw,
    amount: extractTotal(text),
    category: guessReceiptCategory(merchant),
  };
}

/* ── 9. Public API ────────────────────────────────────────── */

export function parseDocument(text: string): ParseResult {
  const type = detectDocumentType(text);
  let fields: ParsedFields = {};
  switch (type) {
    case "mechanic_invoice": fields = parseMechanicInvoice(text); break;
    case "insurance":        fields = parseInsurance(text); break;
    case "registration":     fields = parseRegistration(text); break;
    case "receipt":          fields = parseReceipt(text); break;
    case "unknown":          fields = {}; break;
  }
  return {
    type,
    fields,
    confidence: type === "unknown" ? "unknown" : "detected",
  };
}

/* ── 10. Helpers exposed for UI / actions ─────────────────── */

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  mechanic_invoice: "Mechanic Invoice",
  insurance:        "Insurance",
  registration:     "Registration",
  receipt:          "Receipt",
  unknown:          "Document",
};

/** Map our parser type to the existing Supabase `documents.type` value. */
export function docTypeToStorageType(t: DocType): string {
  switch (t) {
    case "mechanic_invoice": return "service";
    case "insurance":        return "insurance";
    case "registration":     return "registration";
    case "receipt":          return "service";   // receipts live with maintenance docs
    case "unknown":          return "other";
  }
}

/** Convert ISO yyyy-mm-dd → human "Jun 15 2026" for display. */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m[2]-1]} ${+m[3]} ${m[1]}`;
}

/** Add days to an ISO date and return ISO. */
export function addDays(iso: string, days: number): string | undefined {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  const d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3]));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
}
