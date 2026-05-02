import { useState } from "react";
import { useLocation } from "wouter";
import { decodeVin, VehicleDetails } from "@/lib/nhtsa";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CarSilhouette } from "@/components/CarSilhouette";
import { Loader2, Car, ChevronRight, RotateCcw, CheckCircle2 } from "lucide-react";

type Step = "entry" | "confirm" | "details";

export default function SetupPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("entry");
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [mileage, setMileage] = useState("");
  const [plate, setPlate] = useState("");

  // Manual fallback
  const [manual, setManual] = useState({ make: "", model: "", year: "", trim: "" });
  const [useManual, setUseManual] = useState(false);

  async function handleVinLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!vin.trim()) return;
    setLoading(true);
    try {
      const details = await decodeVin(vin);
      setVehicle(details);
      setStep("confirm");
    } catch (err: any) {
      toast({ title: "VIN lookup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = useManual
      ? {
          user_id: user.id,
          vin: vin.trim().toUpperCase() || null,
          make: manual.make,
          model: manual.model,
          year: manual.year,
          trim: manual.trim,
          engine: "",
          fuel_type: "",
          body_style: "",
          mileage: parseInt(mileage) || 0,
          license_plate: plate.trim().toUpperCase(),
        }
      : {
          user_id: user.id,
          vin: vehicle!.vin,
          make: vehicle!.make,
          model: vehicle!.model,
          year: vehicle!.year,
          trim: vehicle!.trim,
          engine: vehicle!.engine,
          fuel_type: vehicle!.fuelType,
          body_style: vehicle!.bodyStyle,
          mileage: parseInt(mileage) || 0,
          license_plate: plate.trim().toUpperCase(),
        };

    const { error } = await supabase.from("vehicles").insert(payload);
    setLoading(false);

    if (error) {
      toast({ title: "Could not save vehicle", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center px-6 border-b border-border">
        <span className="text-lg font-bold tracking-tight">Gari</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Step: VIN entry */}
          {step === "entry" && !useManual && (
            <>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
                  <Car size={24} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Add your car</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your VIN to automatically pull make, model, engine and more.
                </p>
              </div>

              <form onSubmit={handleVinLookup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vin" className="text-xs font-medium">Vehicle Identification Number (VIN)</Label>
                  <Input
                    id="vin"
                    placeholder="e.g. 1HGCM82633A123456"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    className="font-mono tracking-wider text-sm uppercase"
                    maxLength={17}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Found on your dashboard, door jamb, or registration document.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || vin.length < 11}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Looking up VIN…</>
                    : <> Look up VIN <ChevronRight size={16} className="ml-1" /></>
                  }
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setUseManual(true)}>
                Enter details manually
              </Button>
            </>
          )}

          {/* Step: Manual entry */}
          {step === "entry" && useManual && (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">Enter details</h1>
                <p className="text-sm text-muted-foreground">Tell us about your car</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setStep("details"); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Year</Label>
                    <Input placeholder="2021" value={manual.year} onChange={(e) => setManual({ ...manual, year: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Make</Label>
                    <Input placeholder="Toyota" value={manual.make} onChange={(e) => setManual({ ...manual, make: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model</Label>
                  <Input placeholder="Corolla" value={manual.model} onChange={(e) => setManual({ ...manual, model: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Trim (optional)</Label>
                  <Input placeholder="XSE" value={manual.trim} onChange={(e) => setManual({ ...manual, trim: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setUseManual(false)} className="flex-1">
                    <RotateCcw size={14} className="mr-1.5" /> Use VIN
                  </Button>
                  <Button type="submit" className="flex-1" disabled={!manual.make || !manual.model || !manual.year}>
                    Continue <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step: Confirm VIN result */}
          {step === "confirm" && vehicle && (
            <>
              <div className="text-center space-y-1">
                <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                <h1 className="text-2xl font-bold">Is this your car?</h1>
                <p className="text-sm text-muted-foreground">Confirm the details pulled from your VIN</p>
              </div>

              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5">
                  <div className="h-28 mb-4">
                    <CarSilhouette bodyStyle={vehicle.bodyStyle} />
                  </div>
                  <p className="text-xl font-bold text-center mb-4">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                    {vehicle.trim ? ` ${vehicle.trim}` : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[
                      ["VIN", vehicle.vin],
                      ["Engine", vehicle.engine || "—"],
                      ["Fuel", vehicle.fuelType || "—"],
                      ["Body", vehicle.bodyStyle || "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("entry"); setVehicle(null); }}>
                  <RotateCcw size={14} className="mr-1.5" /> Try again
                </Button>
                <Button className="flex-1" onClick={() => setStep("details")}>
                  Confirm <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step: Final details */}
          {step === "details" && (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">Almost done</h1>
                <p className="text-sm text-muted-foreground">Just a couple more things</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mileage" className="text-xs font-medium">Current mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="e.g. 45000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plate" className="text-xs font-medium">License plate (optional)</Label>
                  <Input
                    id="plate"
                    placeholder="e.g. ABC 1234"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="uppercase"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !mileage}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
                    : "Create my garage"
                  }
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
