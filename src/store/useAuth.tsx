"use client";

import * as React from "react";
import { getCurrentUser, login, logout, register } from "@/lib/authStorage";

export type AuthUser = { id: string; email: string } | null;

export function useAuth() {
  const [user, setUser] = React.useState<AuthUser>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setUser(getCurrentUser());
    setHydrated(true);
  }, []);

  const doRegister = React.useCallback((email: string, password: string) => {
    const u = register(email, password);
    setUser(u);
    return u;
  }, []);

  const doLogin = React.useCallback((email: string, password: string) => {
    const u = login(email, password);
    setUser(u);
    return u;
  }, []);

  const doLogout = React.useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return { user, hydrated, register: doRegister, login: doLogin, logout: doLogout };
}

