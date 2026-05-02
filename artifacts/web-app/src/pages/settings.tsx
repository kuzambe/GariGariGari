import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  async function handleSignOut() {
    await signOut();
    toast({ title: "Signed out" });
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            <CardDescription className="text-xs">Your current session and auth details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Badge variant="secondary" className="text-xs">Verified</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Provider</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.app_metadata?.provider ?? "email"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="pt-1">
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-destructive" />
              <CardTitle className="text-sm font-medium text-destructive">Danger zone</CardTitle>
            </div>
            <CardDescription className="text-xs">Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove your account and all associated data.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  toast({
                    title: "Not implemented",
                    description: "Contact support to delete your account.",
                  })
                }
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
