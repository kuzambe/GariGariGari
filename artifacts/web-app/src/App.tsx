import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/hooks/useVehicle";
import AuthPage from "@/pages/auth";
import SetupPage from "@/pages/setup";
import DashboardPage from "@/pages/dashboard";
import DocumentsPage from "@/pages/documents";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Redirect to="/auth" />;
  return <Component />;
}

function VehicleRoute({ component: Component, requiresVehicle = true }: {
  component: () => JSX.Element;
  requiresVehicle?: boolean;
}) {
  const { session, loading: authLoading } = useAuth();
  const { data: vehicle, isLoading: vehicleLoading } = useVehicle();

  if (authLoading || vehicleLoading) return <Spinner />;
  if (!session) return <Redirect to="/auth" />;

  // If setup page: redirect to dashboard if already has vehicle
  if (!requiresVehicle && vehicle) return <Redirect to="/dashboard" />;

  return <Component />;
}

function HomeRedirect() {
  const { session, loading: authLoading } = useAuth();
  const { data: vehicle, isLoading: vehicleLoading } = useVehicle();

  if (authLoading || (session && vehicleLoading)) return <Spinner />;
  if (!session) return <Redirect to="/auth" />;
  if (!vehicle) return <Redirect to="/setup" />;
  return <Redirect to="/dashboard" />;
}

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  if (session) return <Redirect to="/" />;
  return <AuthPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthRoute} />
      <Route path="/setup" component={() => <VehicleRoute component={SetupPage} requiresVehicle={false} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/documents" component={() => <ProtectedRoute component={DocumentsPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/" component={HomeRedirect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
