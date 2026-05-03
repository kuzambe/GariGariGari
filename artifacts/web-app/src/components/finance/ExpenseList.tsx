import { Expense } from "@/lib/api/expenses";

interface ExpenseListProps {
  expenses: Expense[];
  onAdd: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  fuel: "⛽",
  service: "🔧",
  insurance: "🛡️",
  parking: "🅿️",
  repair: "🔩",
  other: "💳",
};

export function ExpenseList({ expenses, onAdd }: ExpenseListProps) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: "#1A1A1A" }}>
            Finances
          </span>
          {expenses.length > 0 && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888888", display: "block" }}>
              Total: ${total.toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          style={{
            background: "#EF9F27",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "8px 16px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          + ADD
        </button>
      </div>
      {expenses.length === 0 ? (
        <div style={{ background: "#F0EFE9", borderRadius: 16, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888888", margin: 0 }}>
            No expenses yet. Track fuel, service, insurance and more.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {expenses.map((exp) => (
            <div
              key={exp.id}
              style={{
                background: "#F0EFE9",
                borderRadius: 16,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: 22 }}>{TYPE_ICONS[exp.type] ?? "💳"}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1A1A1A", fontWeight: 500, display: "block" }}>
                  {exp.description || exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888888" }}>
                  {new Date(exp.created_at).toLocaleDateString()}
                </span>
              </div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#1A1A1A" }}>
                ${exp.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
