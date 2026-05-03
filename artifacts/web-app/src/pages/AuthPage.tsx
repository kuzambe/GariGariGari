import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const ACCENT = "#1F6B2E";
const TEXT = "#111111";
const MUTED = "#888888";
const ERROR = "#C0392B";
const BASE = import.meta.env.BASE_URL;

function Field({
  type = "text",
  label,
  value,
  onChange,
}: {
  type?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: focused ? ACCENT : MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          transition: "color 0.15s",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1.5px solid ${focused ? ACCENT : "#E0E0E0"}`,
          padding: "10px 0",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 17,
          color: TEXT,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");

  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpError, setSignUpError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        setSignInError("Please confirm your email first — check your inbox.");
      } else if (msg.includes("invalid login credentials") || msg.includes("invalid password")) {
        setSignInError("Hmm, that email or password doesn't match.");
      } else {
        setSignInError(error.message);
      }
    } else {
      navigate("/dashboard");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignUpError("");
    if (signUpPassword !== signUpConfirm) {
      setSignUpError("Those passwords don't match — give it another go.");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password needs to be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setSignUpError("Looks like you already have an account. Try signing in.");
      } else {
        setSignUpError(error.message);
      }
      return;
    }
    if (data.session) {
      navigate("/setup");
    } else {
      setSignUpError("Almost there — check your inbox to confirm your email.");
    }
  }

  const isSignIn = tab === "signin";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 340 }}>

        {/* Logo */}
        <div style={{ marginBottom: 44, marginTop: -12, display: "flex", justifyContent: "center" }}>
          <img
            src={`${BASE}logo-wordmark.png`}
            alt="Gari"
            style={{ height: 56, objectFit: "contain" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `${BASE}logo.png`;
            }}
          />
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 34,
              color: TEXT,
              margin: "0 0 6px",
              lineHeight: 1.1,
            }}
          >
            {isSignIn ? "Welcome back." : "Create your account."}
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: MUTED,
              margin: 0,
            }}
          >
            {isSignIn
              ? "Sign in to your Gari account."
              : "It only takes a minute."}
          </p>
        </div>

        {/* Form */}
        {isSignIn ? (
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <Field
              type="email"
              label="Email"
              value={signInEmail}
              onChange={setSignInEmail}
            />
            <Field
              type="password"
              label="Password"
              value={signInPassword}
              onChange={setSignInPassword}
            />

            {signInError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: ERROR, margin: 0 }}>
                {signInError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                background: TEXT,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "16px 0",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
                width: "100%",
                transition: "opacity 0.15s",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <Field
              type="email"
              label="Email"
              value={signUpEmail}
              onChange={setSignUpEmail}
            />
            <Field
              type="password"
              label="Password"
              value={signUpPassword}
              onChange={setSignUpPassword}
            />
            <Field
              type="password"
              label="Confirm password"
              value={signUpConfirm}
              onChange={setSignUpConfirm}
            />

            {signUpError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: signUpError.includes("Almost") ? ACCENT : ERROR, margin: 0 }}>
                {signUpError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                background: TEXT,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "16px 0",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
                width: "100%",
                transition: "opacity 0.15s",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        {/* Toggle */}
        <p
          style={{
            textAlign: "center",
            marginTop: 32,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: MUTED,
          }}
        >
          {isSignIn ? "New to Gari? " : "Already have an account? "}
          <button
            onClick={() => {
              setTab(isSignIn ? "signup" : "signin");
              setSignInError("");
              setSignUpError("");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: TEXT,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            {isSignIn ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
