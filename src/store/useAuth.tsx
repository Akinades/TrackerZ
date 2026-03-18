"use client";

import * as React from "react";
import { getCurrentUser, login, logout, register } from "@/lib/authStorage";

export type AuthUser = { id: string; email: string } | null;

export function useAuth() {
  const [user, setUser] = React.useState<AuthUser>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await getCurrentUser();
      if (!mounted) return;
      setUser(u);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const doRegister = React.useCallback(async (email: string, password: string) => {
    const u = await register(email, password);
    setUser(u);
    return u;
  }, []);

  const doLogin = React.useCallback(async (email: string, password: string) => {
    const u = await login(email, password);
    setUser(u);
    return u;
  }, []);

  const doLogout = React.useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  return { user, hydrated, register: doRegister, login: doLogin, logout: doLogout };
}

