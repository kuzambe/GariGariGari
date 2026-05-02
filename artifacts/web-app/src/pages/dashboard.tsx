import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Clock, Zap } from "lucide-react";

const stats = [
  { label: "Total Items", value: "0", icon: <Activity size={16} />, change: "—" },
  { label: "Completed", value: "0", icon: <CheckCircle2 size={16} />, change: "—" },
  { label: "In Progress", value: "0", icon: <Clock size={16} />, change: "—" },
  { label: "This Week", value: "0", icon: <Zap size={16} />, change: "—" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = user?.email?.split("@")[0] ?? "there";

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Good to see you, {greeting}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's an overview of your workspace.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </CardTitle>
                  <span className="text-muted-foreground/60">{stat.icon}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Badge variant="secondary" className="text-xs">0 items</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Activity size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here once you start using the app.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
