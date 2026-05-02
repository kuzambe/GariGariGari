import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MailCheck, AlertCircle } from "lucide-react";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpDone, setSignUpDone] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ email: "", password: "", confirm: "" });

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInForm.email,
      password: signInForm.password,
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        setSignInError(
          "Your email isn't confirmed yet. Check your inbox for a confirmation link, then try signing in again."
        );
      } else if (msg.includes("invalid login credentials")) {
        setSignInError("Incorrect email or password. Please try again.");
      } else if (msg.includes("invalid path") || msg.includes("fetch failed") || msg.includes("failed to fetch")) {
        setSignInError(
          "Could not reach Supabase. Check that your Project URL in Secrets is exactly: https://xxxx.supabase.co (no extra path, no trailing slash), and that the project is not paused."
        );
      } else {
        setSignInError(error.message);
      }
    } else {
      navigate("/dashboard");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignUpError(null);

    if (signUpForm.password !== signUpForm.confirm) {
      setSignUpError("Passwords don't match.");
      return;
    }
    if (signUpForm.password.length < 6) {
      setSignUpError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signUpForm.email,
      password: signUpForm.password,
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered")) {
        setSignUpError("An account with this email already exists. Try signing in instead.");
      } else if (msg.includes("invalid path") || msg.includes("fetch failed") || msg.includes("failed to fetch")) {
        setSignUpError(
          "Could not reach Supabase. Check that your Project URL in Secrets is exactly: https://xxxx.supabase.co (no extra path, no trailing slash), and that the project is not paused."
        );
      } else {
        setSignUpError(error.message);
      }
      return;
    }

    // If session is immediately available, email confirmation is disabled — go straight to dashboard
    if (data.session) {
      navigate("/dashboard");
      return;
    }

    // Otherwise email confirmation is required
    setSignUpEmail(signUpForm.email);
    setSignUpDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">MyApp</h1>
          <p className="text-sm text-muted-foreground">Welcome — sign in or create an account</p>
        </div>

        <SupabaseConfigAlert />

        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1" onClick={() => setSignUpDone(false)}>
              Sign up
            </TabsTrigger>
          </TabsList>

          {/* ── Sign in ── */}
          <TabsContent value="signin">
            <Card>
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-base">Sign in</CardTitle>
                  <CardDescription className="text-xs">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {signInError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs ml-2">{signInError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      value={signInForm.email}
                      onChange={(e) => {
                        setSignInError(null);
                        setSignInForm({ ...signInForm, email: e.target.value });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-xs">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      value={signInForm.password}
                      onChange={(e) => {
                        setSignInError(null);
                        setSignInForm({ ...signInForm, password: e.target.value });
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Sign in
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* ── Sign up ── */}
          <TabsContent value="signup">
            {signUpDone ? (
              <Card>
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MailCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Check your inbox</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We sent a confirmation link to{" "}
                      <span className="font-medium text-foreground">{signUpEmail}</span>.
                      Click it to activate your account, then come back and sign in.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No email? Check your spam folder or{" "}
                    <button
                      className="underline text-primary"
                      onClick={() => setSignUpDone(false)}
                    >
                      try again
                    </button>
                    .
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle className="text-base">Create account</CardTitle>
                    <CardDescription className="text-xs">Sign up for a free account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signUpError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs ml-2">{signUpError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        value={signUpForm.email}
                        onChange={(e) => {
                          setSignUpError(null);
                          setSignUpForm({ ...signUpForm, email: e.target.value });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={signUpForm.password}
                        onChange={(e) => {
                          setSignUpError(null);
                          setSignUpForm({ ...signUpForm, password: e.target.value });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm" className="text-xs">Confirm password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        value={signUpForm.confirm}
                        onChange={(e) => {
                          setSignUpError(null);
                          setSignUpForm({ ...signUpForm, confirm: e.target.value });
                        }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Create account
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
