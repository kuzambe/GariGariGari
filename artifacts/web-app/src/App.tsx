import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { VehicleProvider, useVehicle } from "@/context/VehicleContext";
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
      <img
        src={`${import.meta.env.BASE_URL}gari-icon-new-nobg.png`}
        alt="Gari"
        className="gari-spin"
        style={{ height: 48, width: "auto", objectFit: "contain" }}
      />
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
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1A1A1A",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#FAFAF8",
          minHeight: "100vh",
          position: "relative",
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
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <PhoneFrame>
              <Router />
            </PhoneFrame>
          </WouterRouter>
        </VehicleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
