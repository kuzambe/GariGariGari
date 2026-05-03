import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/context/VehicleContext";
import { createVehicle } from "@/lib/api/vehicles";
import { GarageIcon } from "@/components/ui/GarageIcon";
import { AmberButton } from "@/components/ui/AmberButton";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1.5px solid #E0DED8",
  borderRadius: 12,
  padding: "14px 16px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: "#1A1A1A",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

function GariInput({
  type = "text",
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      maxLength={maxLength}
      style={{
        ...inputStyle,
        borderColor: focused ? "#EF9F27" : "#E0DED8",
        boxShadow: focused ? "0 0 0 3px rgba(239,159,39,0.12)" : "none",
      }}
    />
  );
}

interface VinData {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  fuel_type: string;
  body_style: string;
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: step >= s ? "#EF9F27" : "#E0DED8",
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  );
}

export default function VehicleSetup() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { refetch } = useVehicle();

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [vin, setVin] = useState("");
  const [vinData, setVinData] = useState<VinData | null>(null);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ make: "", model: "", year: "", trim: "" });
  const [mileage, setMileage] = useState("");
  const [plate, setPlate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

  async function lookupVin() {
    const cleaned = vin.trim().toUpperCase();
    if (cleaned.length !== 17) { setVinError("VIN must be exactly 17 characters."); return; }
    if (/[IOQ]/i.test(cleaned)) { setVinError("VIN cannot contain the letters I, O, or Q."); return; }
    if (!VIN_REGEX.test(cleaned)) { setVinError("Invalid VIN format."); return; }

    setVinError("");
    setVinLoading(true);
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleaned}?format=json`);
      const json = await res.json();
      const results: { Variable: string; Value: string }[] = json.Results;
      const get = (name: string) => results.find((r) => r.Variable === name)?.Value || "";
      const data: VinData = {
        make: get("Make"),
        model: get("Model"),
        year: get("Model Year"),
        trim: get("Trim"),
        engine: get("Displacement (L)") ? `${get("Displacement (L)")}L` : "",
        fuel_type: get("Fuel Type - Primary"),
        body_style: get("Body Class"),
      };
      const hasData = data.make || data.model || data.year;
      if (!hasData) { setManualMode(true); }
      else { setVinData(data); }
    } catch {
      setVinError("Could not look up VIN. Enter details manually.");
      setManualMode(true);
    } finally {
      setVinLoading(false);
    }
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const carData = vinData ?? {
        make: manual.make,
        model: manual.model,
        year: manual.year,
        trim: manual.trim,
        engine: "",
        fuel_type: "",
        body_style: "",
      };
      await createVehicle({
        user_id: user.id,
        nickname,
        vin: vin.trim().toUpperCase() || undefined,
        make: carData.make || undefined,
        model: carData.model || undefined,
        year: carData.year ? parseInt(String(carData.year)) : undefined,
        trim: carData.trim || undefined,
        engine: carData.engine || undefined,
        fuel_type: carData.fuel_type || undefined,
        body_style: carData.body_style || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
        license_plate: plate || undefined,
        mileage_unit: "km",
      });
      await refetch();
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("createVehicle error:", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : typeof err === "string"
          ? err
          : "Failed to save vehicle. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        padding: "32px 24px",
      }}
    >
      {/* Top brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <GarageIcon width={24} height={20} stroke="#1A1A1A" />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: "#1A1A1A" }}>
          GARI
        </span>
      </div>

      <ProgressDots step={step} />

      {/* Step 1 — Nickname */}
      {step === 1 && (
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 32, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.1 }}>
            What do you call your car?
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888888", marginBottom: 28 }}>
            This is how Gari will refer to your vehicle.
          </p>
          <GariInput
            placeholder="Blue Thunder, Rana's Civic..."
            value={nickname}
            onChange={setNickname}
          />
          <div style={{ marginTop: 24 }}>
            <AmberButton
              fullWidth
              onClick={() => { if (nickname.trim()) setStep(2); }}
              disabled={!nickname.trim()}
            >
              CONTINUE
            </AmberButton>
          </div>
        </div>
      )}

      {/* Step 2 — VIN */}
      {step === 2 && (
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 32, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.1 }}>
            What's your VIN?
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888888", marginBottom: 28 }}>
            Found on your dashboard or door frame. 17 characters.
          </p>

          {!manualMode && !vinData && (
            <>
              <div style={{ position: "relative" }}>
                <GariInput
                  placeholder="Enter your 17-character VIN"
                  value={vin}
                  onChange={(v) => { setVin(v.toUpperCase()); setVinError(""); }}
                  maxLength={17}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: vin.length === 17 ? "#EF9F27" : "#888888",
                    fontWeight: vin.length === 17 ? 600 : 400,
                  }}
                >
                  {vin.length}/17
                </span>
              </div>
              {vinError && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E24B4A", marginTop: 8 }}>
                  {vinError}
                </p>
              )}
              <div style={{ marginTop: 16 }}>
                <AmberButton fullWidth onClick={lookupVin} disabled={vinLoading || vin.length !== 17}>
                  {vinLoading ? "LOOKING UP..." : "LOOK UP VIN"}
                </AmberButton>
              </div>
              <p
                onClick={() => setManualMode(true)}
                style={{ textAlign: "center", marginTop: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888888", cursor: "pointer" }}
              >
                Enter manually instead
              </p>
            </>
          )}

          {vinData && !manualMode && (
            <>
              <div style={{ background: "#F0EFE9", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                {[
                  ["Make", vinData.make],
                  ["Model", vinData.model],
                  ["Year", vinData.year],
                  ["Trim", vinData.trim],
                  ["Engine", vinData.engine],
                  ["Fuel Type", vinData.fuel_type],
                  ["Body Style", vinData.body_style],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #E0DED8" }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888888" }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#1A1A1A", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
              <AmberButton fullWidth onClick={() => setStep(3)}>CONFIRM</AmberButton>
              <p
                onClick={() => { setVinData(null); setManualMode(true); }}
                style={{ textAlign: "center", marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888888", cursor: "pointer" }}
              >
                Enter manually instead
              </p>
            </>
          )}

          {manualMode && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "make", placeholder: "Make (e.g. Toyota)" },
                  { key: "model", placeholder: "Model (e.g. Corolla)" },
                  { key: "year", placeholder: "Year (e.g. 2020)" },
                  { key: "trim", placeholder: "Trim (optional)" },
                ].map(({ key, placeholder }) => (
                  <GariInput
                    key={key}
                    placeholder={placeholder}
                    value={manual[key as keyof typeof manual]}
                    onChange={(v) => setManual({ ...manual, [key]: v })}
                  />
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <AmberButton
                  fullWidth
                  onClick={() => setStep(3)}
                  disabled={!manual.make || !manual.model}
                >
                  CONTINUE
                </AmberButton>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3 — Mileage & Plate */}
      {step === 3 && (
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 32, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.1 }}>
            Last few details
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888888", marginBottom: 28 }}>
            We'll use this to track your car's history.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <GariInput
              type="number"
              placeholder="Current mileage"
              value={mileage}
              onChange={setMileage}
            />
            <GariInput
              placeholder="License plate (e.g. ABCD 123)"
              value={plate}
              onChange={setPlate}
            />
          </div>
          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E24B4A", marginTop: 12 }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button
              onClick={() => setStep(2)}
              style={{
                flex: 1,
                background: "transparent",
                border: "2px solid #1A1A1A",
                borderRadius: 12,
                padding: "14px",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#1A1A1A",
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
                minHeight: 44,
              }}
            >
              BACK
            </button>
            <div style={{ flex: 1 }}>
              <AmberButton fullWidth onClick={handleFinish} disabled={saving}>
                {saving ? "SAVING..." : "FINISH"}
              </AmberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
