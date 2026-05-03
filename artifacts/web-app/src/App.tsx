import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { VehicleProvider, useVehicle } from "@/context/VehicleContext";
import { PreferencesProvider, usePreferences } from "@/context/PreferencesContext";
import AuthPage from "@/pages/AuthPage";
import VehicleSetup from "@/pages/VehicleSetup";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="gari-spin" style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={`${import.meta.env.BASE_URL}gari-icon-new-nobg.png`}
          alt="Gari"
          style={{ width: 52, height: 52, objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect to="/auth" />;
  return <Component />;
}

function SetupRoute() {
  const { session, loading: authLoading } = useAuth();
  const { vehicle, loading: vehicleLoading } = useVehicle();
  if (authLoading || vehicleLoading) return <LoadingScreen />;
  if (!session) return <Redirect to="/auth" />;
  if (vehicle) return <Redirect to="/dashboard" />;
  return <VehicleSetup />;
}

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (session) return <Redirect to="/dashboard" />;
  return <AuthPage />;
}

function HomeRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <Redirect to={session ? "/dashboard" : "/auth"} />;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { darkMode } = usePreferences();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode ? "#060d07" : "#1A1A1A",
        display: "flex",
        justifyContent: "center",
        transition: "background 0.3s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "var(--gc-bg)",
          minHeight: "100vh",
          position: "relative",
          transition: "background 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthRoute} />
      <Route path="/setup" component={SetupRoute} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/" component={HomeRoute} />
      <Route component={HomeRoute} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VehicleProvider>
          <PreferencesProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <PhoneFrame>
                <Router />
              </PhoneFrame>
            </WouterRouter>
          </PreferencesProvider>
        </VehicleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
