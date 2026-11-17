import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { api, setSessionCookie } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ error?: { code: string; message: string } }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("session_cookie");
        if (stored) {
          setSessionCookie(stored);
          const me = await api.me();
          if (me.data) {
            setUser({ id: me.data.user.id, name: me.data.user.name, email: me.data.user.email });
          }
        }
      } catch {
        // no session
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const res = await api.login(email, password);
    if (res.error) return { error: res.error };
    if (res.data?.userId) {
      // Persist the cookie-based session for app restarts
      const me = await api.me();
      if (me.data) {
        setUser({ id: me.data.user.id, name: me.data.user.name, email: me.data.user.email });
        if (me.data.user) {
          // store the cookie that api.login captured
          // (already in memory via setSessionCookie)
        }
      }
      return {};
    }
    return { error: { code: "LOGIN_FAILED", message: "Unable to sign in." } };
  };

  const logout: AuthContextValue["logout"] = async () => {
    await api.logout();
    setSessionCookie(null);
    await SecureStore.deleteItemAsync("session_cookie");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
