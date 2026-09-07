import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/Home";
import History from "@/pages/History";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Report from "@/pages/Report";
import About from "@/pages/About";
import Login from "@/pages/Login";

function ProtectedRouter() {
  const { user, loading, configured } = useAuth();

  if (!configured) {
    return <Login />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/history" component={History} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/report" component={Report} />
        <Route path="/settings" component={Settings} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ProtectedRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
