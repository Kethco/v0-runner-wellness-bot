"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "swr";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip auth initialization if not in secure context (prevents "operation is insecure" error)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setIsLoading(false);
      return;
    }
    
    try {
      const supabase = createClient();

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Clear SWR cache on sign in/out to prevent stale data
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          // Clear all cached data and revalidate
          mutate(() => true, undefined, { revalidate: true });
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      setIsLoading(false);
    }
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    // Clear SWR cache before signing out
    mutate(() => true, undefined, { revalidate: false });
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
