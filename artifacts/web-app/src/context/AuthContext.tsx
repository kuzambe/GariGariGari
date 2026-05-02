import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isDemoMode, disableDemo, DEMO_USER } from "@/lib/demo";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isDemo: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setIsDemo(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isDemo) {
      disableDemo();
      setIsDemo(false);
      window.location.href = "/auth";
      return;
    }
    await supabase.auth.signOut();
  };

  const demoSession = isDemo
    ? ({ user: DEMO_USER } as unknown as Session)
    : null;

  return (
    <AuthContext.Provider
      value={{
        session: isDemo ? demoSession : session,
        user: isDemo ? (DEMO_USER as unknown as User) : session?.user ?? null,
        loading,
        isDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
