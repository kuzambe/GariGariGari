import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { clearGuestSession, getGuestSession, type GuestSession } from "@/lib/guestSession";
import { createVehicle } from "@/lib/api/vehicles";

const BASE = import.meta.env.BASE_URL;
const ACCENT = "#1F6B2E";
const ERROR = "#C0392B";
const TEXT = "#0D1C0E";
const MUTED = "#6B7C6D";
const FIELD_BORDER = "#D4DDD5";
const SUMMARY_BG = "#F4F7F2";

type Mode = "signup" | "signin";

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "#fff",
    border: `1.5px solid ${focused ? ACCENT : FIELD_BORDER}`,
    borderRadius: 12,
    padding: "14px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: TEXT,
    outline: "none",
    boxShadow: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
}

function GariField({
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputStyle(focused)}
    />
  );
}

export default function AccountCreationPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("signup");
  const [guest, setGuest] = useState<GuestSession | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    setGuest(getGuestSession());
  }, []);

  const passwordsMatch = !confirm || password === confirm;

  const signUpDisabled =
    !email.trim() ||
    password.length < 8 ||
    !passwordsMatch ||
    !confirm;

  const signInDisabled = !email.trim() || !password;

  async function transferGuestToAccount(userId: string, g: GuestSession): Promise<void> {
    const modelLabel = (g.model && g.model.trim()) || "Car";
    try {
      await createVehicle({
        user_id: userId,
        nickname: `Your ${modelLabel}`,
        vin: g.vin ?? undefined,
        make: g.make ?? undefined,
        model: g.model ?? undefined,
        year: g.year ?? undefined,
        trim: g.trim ?? undefined,
        engine: g.engine ?? undefined,
        fuel_type: g.fuel_type ?? undefined,
        body_style: g.body_style ?? undefined,
        mileage_unit: "km",
      });
      clearGuestSession();
    } catch {
      // keep guest session intact for retry
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setSubmitting(false);
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("user already")) {
        setEmailError("This email is already registered. Sign in instead?");
      } else if (msg.includes("password")) {
        setPasswordError("Password must be at least 8 characters.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setFormError("Connection failed. Please check your internet and try again.");
      } else {
        setFormError(error.message);
      }
      return;
    }

    const newUserId = data.user?.id;
    if (newUserId && guest) {
      await transferGuestToAccount(newUserId, guest);
    }

    setSubmitting(false);

    if (data.session) {
      setSuccessToast(true);
      setTimeout(() => navigate("/dashboard"), 1100);
    } else {
      // Email confirmation required: still keep guest session if we couldn't transfer.
      setFormError("Almost there — check your inbox to confirm your email.");
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("invalid password") || msg.includes("invalid_credentials")) {
        setPasswordError("Incorrect password. Please try again.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setFormError("Connection failed. Please check your internet and try again.");
      } else if (msg.includes("email not confirmed")) {
        setFormError("Please confirm your email first — check your inbox.");
      } else {
        setFormError(error.message);
      }
      return;
    }
    navigate("/dashboard");
  }

  const yearMakeModel = guest
    ? [guest.year, guest.make, guest.model].filter(Boolean).join(" ")
    : "";
  const guestNickname = guest?.model ? `Your ${guest.model}` : "Your car";

  return (
    <div
      className="gari-mount"
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        padding: "40px 24px 32px",
        position: "relative",
      }}
    >
      {successToast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: ACCENT,
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            zIndex: 300,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          Your garage is saved!
        </div>
      )}

      {/* Logo + heading */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 28 }}>
        <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ height: 40 }} />
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 36,
            color: TEXT,
            letterSpacing: "0.03em",
            lineHeight: 1,
          }}
        >
          GARI
        </span>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: MUTED,
            margin: "4px 0 0",
            textAlign: "center",
          }}
        >
          {mode === "signup"
            ? "Create your free account to save your garage."
            : "Welcome back. Sign in to your garage."}
        </p>
      </div>

      {/* Guest car summary */}
      {mode === "signup" && guest && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, margin: "0 0 8px" }}>
            We'll save this to your account:
          </p>
          <div
            style={{
              background: SUMMARY_BG,
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: TEXT, margin: 0 }}>
              {guestNickname}
            </p>
            {yearMakeModel && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, margin: "2px 0 0" }}>
                {yearMakeModel}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={mode === "signup" ? handleSignUp : handleSignIn}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <GariField
          type="email"
          placeholder="Email address"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        {emailError && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: "-6px 0 0" }}>
            {emailError}{" "}
            {emailError.includes("registered") && (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setEmailError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: ACCENT,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  textDecoration: "underline",
                }}
              >
                Sign in
              </button>
            )}
          </p>
        )}

        <GariField
          type="password"
          placeholder={mode === "signup" ? "Create a password" : "Password"}
          value={password}
          onChange={setPassword}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {passwordError && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: "-6px 0 0" }}>
            {passwordError}
          </p>
        )}

        {mode === "signup" && (
          <>
            <GariField
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />
            {(confirmError || (!passwordsMatch && confirm)) && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: "-6px 0 0" }}>
                {confirmError ?? "Passwords don't match"}
              </p>
            )}
          </>
        )}

        {formError && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: formError.startsWith("Almost") ? ACCENT : ERROR,
              margin: "4px 0 0",
            }}
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || (mode === "signup" ? signUpDisabled : signInDisabled)}
          style={{
            marginTop: 8,
            background: ACCENT,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            height: 54,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            cursor:
              submitting || (mode === "signup" ? signUpDisabled : signInDisabled)
                ? "default"
                : "pointer",
            opacity:
              submitting || (mode === "signup" ? signUpDisabled : signInDisabled)
                ? 0.6
                : 1,
            letterSpacing: "0.04em",
          }}
        >
          {submitting
            ? mode === "signup"
              ? "CREATING ACCOUNT…"
              : "SIGNING IN…"
            : mode === "signup"
              ? "CREATE ACCOUNT"
              : "SIGN IN"}
        </button>
      </form>

      {/* Mode toggle */}
      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: MUTED,
        }}
      >
        {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setEmailError(null);
            setPasswordError(null);
            setConfirmError(null);
            setFormError(null);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: TEXT,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            padding: 0,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}
