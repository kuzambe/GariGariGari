import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/context/VehicleContext";
import { GarageIcon } from "@/components/ui/GarageIcon";
import { StatPill } from "@/components/ui/StatPill";
import { FeatureTile } from "@/components/ui/FeatureTile";
import { AlertStrip } from "@/components/ui/AlertStrip";
import { Header } from "@/components/layout/Header";
import { CarHero } from "@/components/car/CarHero";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { UploadDocumentModal } from "@/components/documents/UploadDocumentModal";
import { ExpenseList } from "@/components/finance/ExpenseList";
import { AddExpenseModal } from "@/components/finance/AddExpenseModal";
import { getDocumentsByVehicleId, Document } from "@/lib/api/documents";
import { getExpensesByVehicleId, Expense } from "@/lib/api/expenses";
import { useEffect } from "react";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="gari-pulse">
        <svg width="40" height="34" viewBox="0 0 28 24" fill="none">
          <rect x="1.5" y="1.5" width="25" height="21" rx="2.5" stroke="#EF9F27" strokeWidth="2" />
          <path d="M5 8.5C9.2 8.3 18.8 8.7 23 8.5" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 13C9.1 12.85 18.9 13.15 23 13" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 17.5C9.3 17.4 18.7 17.6 23 17.5" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

type Section = "home" | "documents" | "finances";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { vehicle, loading } = useVehicle();

  const [section, setSection] = useState<Section>("home");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    if (vehicle) {
      getDocumentsByVehicleId(vehicle.id).then(setDocuments).catch(() => {});
      getExpensesByVehicleId(vehicle.id).then(setExpenses).catch(() => {});
    }
  }, [vehicle]);

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GarageIcon width={40} height={34} stroke="#EF9F27" className="gari-pulse" />
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !vehicle) {
      navigate("/setup");
    }
  }, [loading, vehicle]);

  if (!vehicle) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", paddingBottom: 40 }}>
      {/* Header */}
      <Header vehicle={vehicle} />

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "16px 20px",
          scrollbarWidth: "none",
        }}
      >
        <StatPill
          value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} ${vehicle.mileage_unit}` : "—"}
          label="odometer"
        />
        <StatPill value={vehicle.year ? String(vehicle.year) : "—"} label="year" />
        <StatPill value="Good" label="health" valueColor="#639922" />
        {vehicle.make && <StatPill value={vehicle.make} label="make" />}
        {vehicle.model && <StatPill value={vehicle.model} label="model" />}
      </div>

      {/* Home section */}
      {section === "home" && (
        <>
          {/* Car hero */}
          <CarHero />

          {/* Feature tiles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              padding: "0 20px",
              marginBottom: 16,
            }}
          >
            <FeatureTile icon="📁" label="Documents" onClick={() => setSection("documents")} />
            <FeatureTile icon="💰" label="Finances" onClick={() => setSection("finances")} />
            <FeatureTile icon="🔩" label="Parts" comingSoon />
            <FeatureTile icon="🔧" label="Diagnostics" comingSoon />
          </div>

          {/* Alert strip */}
          <AlertStrip message="Keep your mileage up to date to get accurate insights." />
        </>
      )}

      {/* Documents section */}
      {section === "documents" && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setSection("home")}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#888888",
              cursor: "pointer",
              padding: "0 20px 12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back
          </button>
          <DocumentGrid
            documents={documents}
            onUpload={() => setShowUpload(true)}
          />
        </div>
      )}

      {/* Finances section */}
      {section === "finances" && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setSection("home")}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#888888",
              cursor: "pointer",
              padding: "0 20px 12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back
          </button>
          <ExpenseList expenses={expenses} onAdd={() => setShowAddExpense(true)} />
        </div>
      )}

      {/* Sign out */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <button
          onClick={handleSignOut}
          style={{
            background: "none",
            border: "none",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#888888",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Sign out
        </button>
      </div>

      {/* Modals */}
      {showUpload && user && vehicle && (
        <UploadDocumentModal
          userId={user.id}
          vehicleId={vehicle.id}
          onClose={() => setShowUpload(false)}
          onUploaded={() => getDocumentsByVehicleId(vehicle.id).then(setDocuments)}
        />
      )}
      {showAddExpense && user && vehicle && (
        <AddExpenseModal
          userId={user.id}
          vehicleId={vehicle.id}
          onClose={() => setShowAddExpense(false)}
          onAdded={() => getExpensesByVehicleId(vehicle.id).then(setExpenses)}
        />
      )}
    </div>
  );
}
