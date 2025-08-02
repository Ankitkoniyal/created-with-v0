// lib/auth-context.tsx
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from "./auth"
import { supabase } from "@/utils/supabaseClient";

interface User {
  id: string;
  email: string;
  full_name?: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, mobile: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error fetching session:", error.message);
      setUser(null);
    } else if (session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, mobile')
        .eq('id', session.user.id)
        .single();

      if (profile && !profileError) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile.full_name || session.user.email,
          mobile: profile.mobile || '',
        });
      } else {
        // --- UPDATED LOGIC ---
        // This checks for the specific "No rows found" error (PGRST116)
        // and handles it gracefully without logging a critical error.
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError.message);
        }
        // Set the user data from the session itself, since a profile wasn't found
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata.full_name,
          mobile: session.user.user_metadata.mobile,
        });
        // --- END OF UPDATED LOGIC ---
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          fetchUser();
        } else if (event === 'INITIAL_SESSION' && !session) {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabaseSignIn(email, password);
    setLoading(false);

    if (error) {
      console.error("Supabase Sign In Error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signUp = async (email: string, password: string, fullName: string, mobile: string) => {
    setLoading(true);
    const { error } = await supabaseSignUp(email, password, fullName, mobile);
    setLoading(false);

    if (error) {
      console.error("Supabase Sign Up Error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabaseSignOut();
    setLoading(false);

    if (error) {
      console.error("Supabase Sign Out Error:", error.message);
    } else {
      setUser(null);
    }
  };

  const value = { user, signIn, signUp, signOut, loading };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '24px' }}>Loading application...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}