import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/hooks/useVehicle";
import { CarSilhouette } from "@/components/CarSilhouette";
import { HealthScore } from "@/components/HealthScore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  DollarSign,
  ShoppingBag,
  Stethoscope,
  LogOut,
  Settings,
  User,
  ChevronRight,
  Plus,
} from "lucide-react";

const SECTIONS = [
  {
    key: "documents",
    label: "Documents",
    desc: "Insurance, registration & more",
    icon: Shield,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    href: "/documents",
  },
  {
    key: "finances",
    label: "Finances",
    desc: "Expenses, receipts & costs",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-500/10",
    href: "/finances",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    desc: "Buy, sell and find parts",
    icon: ShoppingBag,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    href: "/marketplace",
  },
  {
    key: "diagnostics",
    label: "Diagnostics",
    desc: "Fault codes and health data",
    icon: Stethoscope,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    href: "/diagnostics",
  },
];

function GarageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="24" width="56" height="36" rx="2" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.05"/>
      <path d="M4 24 L32 6 L60 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="10" y="32" width="44" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <rect x="10" y="42" width="44" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <rect x="10" y="52" width="44" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
    </svg>
  );
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { data: vehicle, isLoading } = useVehicle();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";
  const carName = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <span className="text-xl font-bold tracking-tight">Gari</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none">
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary/40 transition-all">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <User size={14} /> Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <Settings size={14} /> Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
              onClick={signOut}
            >
              <LogOut size={14} /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

        {/* Car hero card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-700 px-5 pt-5 pb-0">
            {isLoading ? (
              <div className="space-y-2 pb-6">
                <Skeleton className="h-5 w-40 bg-white/10" />
                <Skeleton className="h-3 w-24 bg-white/10" />
              </div>
            ) : vehicle ? (
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Your car</p>
                <h1 className="text-white text-2xl font-bold leading-tight">{carName}</h1>
              </div>
            ) : (
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Your garage</p>
                <h1 className="text-white text-xl font-bold">No car added yet</h1>
              </div>
            )}

            {/* Silhouette */}
            <div className="h-36 mt-3 text-white/20">
              {isLoading ? (
                <div className="h-full" />
              ) : vehicle ? (
                <CarSilhouette bodyStyle={vehicle.body_style} className="text-white/25" />
              ) : (
                <GarageIcon className="w-20 h-20 mx-auto mt-4 text-white/20" />
              )}
            </div>
          </div>

          {/* Stats row */}
          {vehicle && (
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-card">
              {[
                { label: "Mileage", value: vehicle.mileage?.toLocaleString() ?? "—" },
                { label: "Year", value: vehicle.year },
                { label: "Trim", value: vehicle.trim || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-3 px-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold mt-0.5 truncate max-w-full px-1">{value}</p>
                </div>
              ))}
            </div>
          )}

          {!vehicle && !isLoading && (
            <div className="p-4 border-t border-border">
              <Link href="/setup">
                <Button className="w-full gap-2">
                  <Plus size={14} /> Add your car
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Health score */}
        {vehicle && (
          <div className="rounded-2xl border border-border bg-card px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold">Vehicle Health</p>
                <p className="text-xs text-muted-foreground">Based on age & mileage</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <HealthScore score={computeHealth(vehicle)} />
            </div>
          </div>
        )}

        {/* Sections */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Features</p>
          <div className="space-y-2">
            {SECTIONS.map(({ key, label, desc, icon: Icon, color, bg, href }) => (
              <Link key={key} href={href}>
                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-4 py-3.5 hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer group">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${bg}`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* VIN / plate info */}
        {vehicle && (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VIN</p>
              <p className="text-xs font-mono font-medium mt-0.5 truncate max-w-[180px]">{vehicle.vin || "—"}</p>
            </div>
            {vehicle.license_plate && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plate</p>
                <p className="text-xs font-mono font-bold mt-0.5 bg-yellow-400/90 text-yellow-900 px-2 py-0.5 rounded">
                  {vehicle.license_plate}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function computeHealth(vehicle: { year: string; mileage: number }): number {
  const age = new Date().getFullYear() - parseInt(vehicle.year || "2020");
  const miles = vehicle.mileage ?? 0;
  const agePenalty = Math.min(age * 3, 40);
  const milesPenalty = Math.min(Math.floor(miles / 15000) * 4, 40);
  return Math.max(20, 100 - agePenalty - milesPenalty);
}
