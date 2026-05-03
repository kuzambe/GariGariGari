import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
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
        ...inputStyle,
        borderColor: focused ? "#EF9F27" : "#E0DED8",
        boxShadow: focused ? "0 0 0 3px rgba(239,159,39,0.12)" : "none",
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
        background: "#FAFAF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <GarageIcon width={40} height={34} stroke="#1A1A1A" />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 48,
                color: "#1A1A1A",
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              GARI
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888888", margin: 0 }}>
            Your garage in your pocket.
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 28 }}>
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSignInError(""); setSignUpError(""); }}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === t ? "2px solid #EF9F27" : "2px solid transparent",
                paddingBottom: 6,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 500,
                color: tab === t ? "#1A1A1A" : "#888888",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Sign In form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E24B4A", margin: 0 }}>
                {signInError}
              </p>
            )}
            <AmberButton type="submit" fullWidth disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </AmberButton>
          </form>
        )}

        {/* Sign Up form */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E24B4A", margin: 0 }}>
                {signUpError}
              </p>
            )}
            <AmberButton type="submit" fullWidth disabled={loading}>
              {loading ? "SIGNING UP..." : "SIGN UP"}
            </AmberButton>
          </form>
        )}

        {/* Toggle link */}
        <p style={{ textAlign: "center", marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888888", margin: "20px 0 0" }}>
          {tab === "signin" ? (
            <>Don't have an account?{" "}
              <button onClick={() => setTab("signup")} style={{ background: "none", border: "none", cursor: "pointer", color: "#1A1A1A", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0 }}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => setTab("signin")} style={{ background: "none", border: "none", cursor: "pointer", color: "#1A1A1A", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0 }}>Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
