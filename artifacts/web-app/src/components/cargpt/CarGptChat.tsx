import { useEffect, useRef, useState } from "react";
import { Vehicle, vehicleDisplayName } from "@/lib/api/vehicles";
import { getExpensesByVehicleId } from "@/lib/api/expenses";
import { getDocumentsByVehicleId } from "@/lib/api/documents";
import { getDiagnosticIssuesByVehicleId, type DiagnosticIssue } from "@/lib/api/diagnostics";
import { getReminders } from "@/lib/reminders";

/* Green and status colours stay constant across themes. */
const C = {
  bg:     "var(--gc-bg)",
  sage:   "var(--gc-sage)",
  text:   "var(--gc-text)",
  muted:  "var(--gc-muted)",
  green:  "#1F6B2E",
  border: "var(--gc-border)",
};

/* ── CARGPT DAILY LIMIT + HISTORY HELPERS ─────────────── */
const CARGPT_LIMIT = 20;
const CARGPT_LS_KEY = "cargpt_usage";
const CARGPT_HISTORY_KEY = "cargpt_history";
const CARGPT_HISTORY_LIMIT = 10;

export interface CarGptMessage {
  role: "user" | "model" | "loading";
  text: string;
}

function getCarGptHistory(vehicleId: string): CarGptMessage[] {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(`${CARGPT_HISTORY_KEY}_${vehicleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; messages: CarGptMessage[] };
    if (parsed.date !== today) return [];
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

function saveCarGptHistory(vehicleId: string, messages: CarGptMessage[]) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const trimmed = messages
      .filter((m) => m.role !== "loading")
      .slice(-CARGPT_HISTORY_LIMIT);
    localStorage.setItem(
      `${CARGPT_HISTORY_KEY}_${vehicleId}`,
      JSON.stringify({ date: today, messages: trimmed }),
    );
  } catch {
    /* ignore quota errors */
  }
}

function getCarGptUsage(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(CARGPT_LS_KEY);
    if (!raw) return { date: "", count: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: "", count: 0 };
  }
}

function incrementCarGptUsage(): number {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getCarGptUsage();
  const count = usage.date === today ? usage.count + 1 : 1;
  localStorage.setItem(CARGPT_LS_KEY, JSON.stringify({ date: today, count }));
  return count;
}

function getRemainingCarGptQuestions(): number {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getCarGptUsage();
  if (usage.date !== today) return CARGPT_LIMIT;
  return Math.max(0, CARGPT_LIMIT - usage.count);
}

/* Compact maintenance-status computation for context only (mirrors the
 * Diagnostics page heuristics, but produces plain status strings). */
function computeMaintenanceContext(
  expenses: { type: string; description?: string | null; created_at: string }[],
): { item: string; status: string }[] {
  const now = Date.now();
  const DAY = 86400000;
  const specs = [
    { label: "Oil Change", keyword: "oil change", good: 180, due: 270 },
    { label: "Tire Rotation", keyword: "tire rotation", good: 365, due: 450 },
    { label: "Brake Inspection", keyword: "brake", good: 730, due: 900 },
    { label: "Battery Check", keyword: "battery", good: 1095, due: 1460 },
  ];
  return specs.map((s) => {
    const matches = expenses.filter(
      (e) => e.type === "maintenance" && (e.description ?? "").toLowerCase().includes(s.keyword),
    );
    if (matches.length === 0) return { item: s.label, status: "overdue (no record)" };
    const latest = matches.reduce((a, b) =>
      new Date(a.created_at).getTime() > new Date(b.created_at).getTime() ? a : b,
    );
    const ageDays = (now - new Date(latest.created_at).getTime()) / DAY;
    const status = ageDays <= s.good ? "good" : ageDays <= s.due ? "due soon" : "overdue";
    return { item: s.label, status };
  });
}

/* ── Typing indicator ───────────────────────────────── */
function CarGptTyping() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%", background: C.muted,
            display: "inline-block", animation: "cargptPulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes cargptPulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.85); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

interface Props {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
}

/**
 * Unified CarGPT chat sheet. Rendered once at the Dashboard level so it can be
 * opened from any page (landing tile or the floating scan button). Daily limit
 * (20/day) and localStorage history behaviour are preserved unchanged.
 */
export function CarGptChat({ vehicle, open, onClose }: Props) {
  const [carGptInput, setCarGptInput] = useState("");
  const hydratedVehicleRef = useRef(vehicle.id);
  const [carGptMessages, setCarGptMessages] = useState<CarGptMessage[]>(() => {
    hydratedVehicleRef.current = vehicle.id;
    return getCarGptHistory(vehicle.id);
  });
  const [carGptLoading, setCarGptLoading] = useState(false);
  const [carGptRemaining, setCarGptRemaining] = useState(() => getRemainingCarGptQuestions());
  const carGptBottomRef = useRef<HTMLDivElement>(null);
  const carGptSheetRef = useRef<HTMLDivElement>(null);
  const carGptTouchStartY = useRef(0);

  const title = vehicleDisplayName(vehicle);

  // Save effect runs BEFORE the hydration effect so that on a vehicle.id change,
  // the guard below prevents the previous vehicle's messages from being written
  // under the new vehicle's key (hydratedVehicleRef is still the old id then).
  useEffect(() => {
    if (hydratedVehicleRef.current !== vehicle.id) return;
    saveCarGptHistory(vehicle.id, carGptMessages);
  }, [carGptMessages, vehicle.id]);

  useEffect(() => {
    hydratedVehicleRef.current = vehicle.id;
    setCarGptMessages(getCarGptHistory(vehicle.id));
  }, [vehicle.id]);

  // Keep counter fresh and clear history on day rollover.
  useEffect(() => {
    function refresh() {
      setCarGptRemaining(getRemainingCarGptQuestions());
      if (getCarGptHistory(vehicle.id).length === 0) {
        setCarGptMessages([]);
      }
    }
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60_000);
    return () => { document.removeEventListener("visibilitychange", refresh); clearInterval(timer); };
  }, [vehicle.id]);

  useEffect(() => {
    if (open) carGptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [carGptMessages, open]);

  async function handleCarGptSubmit() {
    const message = carGptInput.trim();
    if (!message || carGptLoading) return;

    if (getRemainingCarGptQuestions() <= 0) {
      setCarGptMessages((prev) => [
        ...prev,
        { role: "user", text: message },
        { role: "model", text: "You've used all your CarGPT questions for today. Come back tomorrow." },
      ]);
      setCarGptInput("");
      return;
    }

    incrementCarGptUsage();
    setCarGptRemaining(getRemainingCarGptQuestions());

    const history: { role: "user" | "model"; text: string }[] = carGptMessages
      .filter((m) => m.role !== "loading")
      .slice(-6)
      .map((m) => ({ role: m.role as "user" | "model", text: m.text }));

    setCarGptMessages((prev) => [...prev, { role: "user", text: message }, { role: "loading", text: "" }]);
    setCarGptInput("");
    setCarGptLoading(true);

    try {
      const [expenses, documents, issues] = await Promise.all([
        vehicle.id ? getExpensesByVehicleId(vehicle.id) : Promise.resolve([]),
        vehicle.id ? getDocumentsByVehicleId(vehicle.id) : Promise.resolve([]),
        vehicle.id
          ? getDiagnosticIssuesByVehicleId(vehicle.id).catch((): DiagnosticIssue[] => [])
          : Promise.resolve([] as DiagnosticIssue[]),
      ]);

      const reminders = getReminders(vehicle.id)
        .slice()
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 10)
        .map((r) => ({ title: r.title, due_date: r.due_date, source: r.source }));

      const diagnostics = issues
        .filter((i) => i.status !== "resolved")
        .slice(0, 10)
        .map((i) => ({ title: i.title, severity: i.severity, status: i.status }));

      const maintenance = computeMaintenanceContext(expenses);

      const base = import.meta.env.BASE_URL as string;
      const apiBase = base.replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/cargpt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleContext: {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            engine: vehicle.engine,
            fuel_type: vehicle.fuel_type,
            mileage: vehicle.mileage,
            mileage_unit: vehicle.mileage_unit,
            expenses: expenses.slice(0, 20),
            documents: documents.slice(0, 10),
            reminders,
            diagnostics,
            maintenance,
          },
          userMessage: message,
          history,
        }),
      });

      const data = await response.json() as { text?: string; error?: string };
      const replyText = response.status === 429
        ? "You've used all your CarGPT questions for today. Come back tomorrow."
        : (data.text || data.error || "CarGPT is unavailable right now. Try again in a moment.");

      setCarGptMessages((prev) =>
        prev.map((m, i) => (i === prev.length - 1 && m.role === "loading" ? { role: "model", text: replyText } : m)),
      );
    } catch {
      setCarGptMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === "loading"
            ? { role: "model", text: "CarGPT is unavailable right now. Try again in a moment." }
            : m,
        ),
      );
    } finally {
      setCarGptLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div
        ref={carGptSheetRef}
        style={{
          position: "relative",
          background: C.bg,
          borderRadius: "22px 22px 0 0",
          padding: "12px 20px 28px",
          maxWidth: 430,
          width: "100%",
          margin: "0 auto",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
          height: "58vh",
          display: "flex",
          flexDirection: "column",
          animation: "gariSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)",
          transition: "transform 0.18s ease",
          willChange: "transform",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { carGptTouchStartY.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          const dy = e.touches[0].clientY - carGptTouchStartY.current;
          if (dy > 0 && carGptSheetRef.current) {
            carGptSheetRef.current.style.transform = `translateY(${dy}px)`;
          }
        }}
        onTouchEnd={(e) => {
          const dy = e.changedTouches[0].clientY - carGptTouchStartY.current;
          if (dy > 90) {
            onClose();
          } else if (carGptSheetRef.current) {
            carGptSheetRef.current.style.transform = "translateY(0)";
          }
        }}
      >
        {/* Drag handle — also acts as swipe hint */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 14px", flexShrink: 0, cursor: "grab" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, margin: 0 }}>
            Car-GPT
          </p>
          <button
            onClick={onClose}
            aria-label="Close chat"
            style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: C.muted }}
          >
            Close
          </button>
        </div>

        {/* Conversation — scrolls */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 2, marginBottom: 10 }}>
          {carGptMessages.length === 0 ? (
            <p style={{ textAlign: "center", color: C.muted, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, margin: "auto 0" }}>
              Ask anything about {title}.
            </p>
          ) : (
            carGptMessages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isLoading = msg.role === "loading";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isUser ? "#1F6B2E" : C.sage,
                    color: isUser ? "#FFFFFF" : C.text,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 13,
                    lineHeight: 1.5,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    {isLoading ? <CarGptTyping /> : (
                      <div style={{ padding: "10px 14px", whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={carGptBottomRef} />
        </div>

        {/* Input — pinned to bottom */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <input
            placeholder={carGptRemaining === 0 ? "Daily limit reached. Come back tomorrow." : `Ask anything about ${title}…`}
            value={carGptInput}
            onChange={(e) => setCarGptInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCarGptSubmit(); }}
            disabled={carGptLoading || carGptRemaining === 0}
            autoFocus
            style={{
              width: "100%",
              background: C.sage,
              border: `1.5px solid ${C.border}`,
              borderRadius: 14,
              padding: "13px 48px 13px 16px",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
              color: C.text,
              outline: "none",
              boxSizing: "border-box",
              opacity: carGptLoading || carGptRemaining === 0 ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleCarGptSubmit}
            disabled={carGptLoading || !carGptInput.trim() || carGptRemaining === 0}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: carGptInput.trim() && !carGptLoading && carGptRemaining > 0 ? "#1F6B2E" : "transparent",
              border: "none", borderRadius: 8, width: 30, height: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: carGptInput.trim() && !carGptLoading && carGptRemaining > 0 ? "pointer" : "default",
              transition: "background 0.2s", padding: 0,
            }}
          >
            <span style={{ fontSize: 16, color: carGptInput.trim() && !carGptLoading && carGptRemaining > 0 ? "#FFFFFF" : C.muted, lineHeight: 1 }}>↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { getCarGptHistory };
