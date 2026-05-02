import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { enableDemo } from "@/lib/demo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  function handleDemo() {
    enableDemo();
    window.location.href = "/";
  }

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ email: "", password: "", confirm: "" });

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInForm.email,
      password: signInForm.password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (signUpForm.password !== signUpForm.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUpForm.email,
      password: signUpForm.password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created",
        description: "Check your email to confirm your account, then sign in.",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 flex items-center px-6 border-b border-border">
        <span className="text-xl font-bold tracking-tight">Gari</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Your intelligent car companion</p>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <form onSubmit={handleSignIn}>
                  <CardHeader>
                    <CardTitle className="text-base">Welcome back</CardTitle>
                    <CardDescription className="text-xs">Sign in to your Gari account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs">Email</Label>
                      <Input id="signin-email" type="email" placeholder="you@example.com" required
                        value={signInForm.email} onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password" className="text-xs">Password</Label>
                      <Input id="signin-password" type="password" placeholder="••••••••" required
                        value={signInForm.password} onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sign in
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle className="text-base">Get started</CardTitle>
                    <CardDescription className="text-xs">Create your free Gari account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs">Email</Label>
                      <Input id="signup-email" type="email" placeholder="you@example.com" required
                        value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs">Password</Label>
                      <Input id="signup-password" type="password" placeholder="••••••••" required minLength={6}
                        value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm" className="text-xs">Confirm password</Label>
                      <Input id="signup-confirm" type="password" placeholder="••••••••" required
                        value={signUpForm.confirm} onChange={(e) => setSignUpForm({ ...signUpForm, confirm: e.target.value })} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create account
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={handleDemo}
          >
            <Sparkles size={14} className="text-primary" />
            View demo
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Explore Gari with a sample car — no account needed
          </p>
        </div>
      </div>
    </div>
  );
}
