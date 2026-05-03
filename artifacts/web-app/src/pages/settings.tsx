import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/context/VehicleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { updateVehicle } from "@/lib/api/vehicles";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { vehicle, setVehicle } = useVehicle();
  const { toast } = useToast();

  const [trim, setTrim] = useState("");
  const [paintName, setPaintName] = useState("");
  const [paintCode, setPaintCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTrim(vehicle?.trim ?? "");
    setPaintName(vehicle?.paint_name ?? "");
    setPaintCode(vehicle?.paint_code ?? "");
  }, [vehicle?.id, vehicle?.trim, vehicle?.paint_name, vehicle?.paint_code]);

  const dirty =
    !!vehicle &&
    (trim.trim() !== (vehicle.trim ?? "") ||
      paintName.trim() !== (vehicle.paint_name ?? "") ||
      paintCode.trim() !== (vehicle.paint_code ?? ""));

  async function handleSaveVehicle() {
    if (!vehicle) return;
    setSaving(true);
    try {
      const updated = await updateVehicle(vehicle.id, {
        trim: trim.trim() || null,
        paint_name: paintName.trim() || null,
        paint_code: paintCode.trim() || null,
      } as Partial<typeof vehicle>);
      setVehicle(updated);
      toast({ title: "Vehicle info saved" });
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

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

        {vehicle && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Vehicle Information</CardTitle>
              <CardDescription className="text-xs">
                Editable details for {vehicle.nickname || "your car"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="trim" className="text-xs font-medium text-muted-foreground">Trim</label>
                <input
                  id="trim"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  placeholder="e.g. SE, Limited, Sport"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="paint-name" className="text-xs font-medium text-muted-foreground">Factory Paint Name</label>
                <input
                  id="paint-name"
                  value={paintName}
                  onChange={(e) => setPaintName(e.target.value)}
                  placeholder="e.g. Magnetic Gray Metallic"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="paint-code" className="text-xs font-medium text-muted-foreground">Paint Code (optional)</label>
                <input
                  id="paint-code"
                  value={paintCode}
                  onChange={(e) => setPaintCode(e.target.value)}
                  placeholder="e.g. 1G3"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="pt-1">
                <Button size="sm" onClick={handleSaveVehicle} disabled={!dirty || saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
