"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  name: string;
  email: string;
  provider: string;
}

interface AuthState {
  /** True once we've read persisted auth from localStorage (avoids redirect flicker). */
  hydrated: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Open the mimic-SSO dialog; on success the user lands on `redirectTo`. */
  requestSignIn: (redirectTo?: string) => void;
  signOut: () => void;

  // ---- Internal wiring for the SSO dialog ----
  ssoOpen: boolean;
  setSsoOpen: (open: boolean) => void;
  completeSignIn: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "ss_auth";
const DEFAULT_REDIRECT = "/simulations";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ssoOpen, setSsoOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState(DEFAULT_REDIRECT);

  // Restore any persisted "session" on first mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  const requestSignIn = useCallback((target: string = DEFAULT_REDIRECT) => {
    setRedirectTo(target || DEFAULT_REDIRECT);
    setSsoOpen(true);
  }, []);

  const completeSignIn = useCallback(
    (signedIn: AuthUser) => {
      setUser(signedIn);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(signedIn));
      } catch {
        // ignore storage failures
      }
      setSsoOpen(false);
      router.push(redirectTo);
    },
    [redirectTo, router]
  );

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        hydrated,
        user,
        isAuthenticated: !!user,
        requestSignIn,
        signOut,
        ssoOpen,
        setSsoOpen,
        completeSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
