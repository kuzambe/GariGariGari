import { useState } from "react";
import { addExpense } from "@/lib/api/expenses";
import { AmberButton } from "@/components/ui/AmberButton";

interface AddExpenseModalProps {
  userId: string;
  vehicleId: string;
  onClose: () => void;
  onAdded: () => void;
}

const EXPENSE_TYPES = ["fuel", "service", "insurance", "parking", "repair", "other"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1.5px solid #E0DED8",
  borderRadius: 12,
  padding: "13px 16px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: "#1A1A1A",
  outline: "none",
  boxSizing: "border-box",
};

export function AddExpenseModal({ userId, vehicleId, onClose, onAdded }: AddExpenseModalProps) {
  const [type, setType] = useState("fuel");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!amount || isNaN(parseFloat(amount))) { setError("Enter a valid amount."); return; }
    setLoading(true);
    setError("");
    try {
      await addExpense({ user_id: userId, vehicle_id: vehicleId, type, amount: parseFloat(amount), description });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#FAFAF8", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 430 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: "#1A1A1A", marginBottom: 20 }}>
          Add Expense
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {EXPENSE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                background: type === t ? "#EF9F27" : "#F0EFE9",
                color: type === t ? "#fff" : "#1A1A1A",
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <input
            type="number"
            placeholder="Amount (e.g. 45.00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </div>
        {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E24B4A", marginBottom: 12 }}>{error}</p>}
        <AmberButton fullWidth onClick={handleAdd} disabled={loading}>
          {loading ? "SAVING..." : "ADD EXPENSE"}
        </AmberButton>
      </div>
    </div>
  );
}
