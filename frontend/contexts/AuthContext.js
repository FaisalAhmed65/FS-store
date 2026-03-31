/**
 * contexts/AuthContext.js
 * Manages customer JWT state.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { getCustomerPayload, setCustomerTokens, clearCustomerTokens } from "@/lib/auth";
import { authApi } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);  // full user object from /auth/me/
  const [loading, setLoading] = useState(true);

  // Boot: if a valid access token exists, fetch current user
  useEffect(() => {
    const payload = getCustomerPayload();
    if (payload) {
      authApi
        .me()
        .then(({ data }) => setUser(data))
        .catch(() => clearCustomerTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ username: email, password });
    setCustomerTokens({ access: data.access, refresh: data.refresh });
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const register = useCallback(async (formData) => {
    await authApi.register(formData);
    return login(formData.username || formData.email, formData.password);
  }, [login]);

  const logout = useCallback(() => {
    clearCustomerTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
