import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { GarageIcon } from "@/components/ui/GarageIcon";

const BG = "#F7F4F0";
const GREEN = "#1F6B2E";
const TEXT = "#1A1A1A";
const MUTED = "#7A7268";
const BORDER = "#DDD8D0";
const ERROR = "#C0392B";

function GariInput({
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
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
      style={{
        width: "100%",
        background: "#FFFFFF",
        border: `1.5px solid ${focused ? GREEN : BORDER}`,
        borderRadius: 14,
        padding: "15px 18px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        color: TEXT,
        outline: "none",
        boxSizing: "border-box",
        boxShadow: focused ? `0 0 0 3px rgba(31,107,46,0.10)` : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
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
        setSignInError("Your email isn't confirmed yet. Check your inbox.");
      } else if (msg.includes("invalid login credentials") || msg.includes("invalid password")) {
        setSignInError("Incorrect email or password.");
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
      setSignUpError("Passwords don't match.");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters.");
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
        setSignUpError("An account with this email already exists.");
      } else {
        setSignUpError(error.message);
      }
      return;
    }
    if (data.session) {
      navigate("/setup");
    } else {
      setSignUpError("Check your inbox to confirm your email, then sign in.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "14px 24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              marginBottom: 14,
            }}
          >
            <GarageIcon width={30} height={26} stroke={GREEN} />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 32,
                color: TEXT,
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              GARI
            </span>
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: MUTED,
              margin: 0,
            }}
          >
            Your garage in your pocket.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "28px 24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          {/* Tab toggle */}
          <div
            style={{
              display: "flex",
              background: BG,
              borderRadius: 12,
              padding: 4,
              marginBottom: 24,
            }}
          >
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSignInError("");
                  setSignUpError("");
                }}
                style={{
                  flex: 1,
                  background: tab === t ? "#FFFFFF" : "transparent",
                  border: "none",
                  borderRadius: 9,
                  padding: "9px 0",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? TEXT : MUTED,
                  cursor: "pointer",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Sign In form */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <GariInput
                type="email"
                placeholder="Email address"
                value={signInEmail}
                onChange={setSignInEmail}
              />
              <GariInput
                type="password"
                placeholder="Password"
                value={signInPassword}
                onChange={setSignInPassword}
              />
              {signInError && (
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: ERROR,
                    margin: 0,
                  }}
                >
                  {signInError}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  background: GREEN,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 14,
                  padding: "15px 0",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: "0.06em",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  width: "100%",
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "SIGNING IN…" : "SIGN IN"}
              </button>
            </form>
          )}

          {/* Sign Up form */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <GariInput
                type="email"
                placeholder="Email address"
                value={signUpEmail}
                onChange={setSignUpEmail}
              />
              <GariInput
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={setSignUpPassword}
              />
              <GariInput
                type="password"
                placeholder="Confirm password"
                value={signUpConfirm}
                onChange={setSignUpConfirm}
              />
              {signUpError && (
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: ERROR,
                    margin: 0,
                  }}
                >
                  {signUpError}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  background: GREEN,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 14,
                  padding: "15px 0",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: "0.06em",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  width: "100%",
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "CREATING ACCOUNT…" : "SIGN UP"}
              </button>
            </form>
          )}
        </div>

        {/* Toggle link */}
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: MUTED,
          }}
        >
          {tab === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setTab("signup")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: GREEN,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setTab("signin")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: GREEN,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
