"use client";

import * as React from "react";
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  patchMyProfile,
  register as apiRegister
} from "@/lib/authStorage";
import type { PublicUser } from "@/types/publicUser";
import type { UserProfilePatch } from "@/types/publicUser";

export type AuthUser = PublicUser | null;

type AuthContextValue = {
  user: AuthUser;
  hydrated: boolean;
  register: (email: string, password: string) => Promise<PublicUser>;
  login: (email: string, password: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<PublicUser | null>;
  updateProfile: (patch: UserProfilePatch) => Promise<PublicUser>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  const refreshUser = React.useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    return u;
  }, []);

  const doRegister = React.useCallback(async (email: string, password: string) => {
    const u = await apiRegister(email, password);
    setUser(u);
    return u;
  }, []);

  const doLogin = React.useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    return u;
  }, []);

  const doLogout = React.useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const updateProfile = React.useCallback(async (patch: UserProfilePatch) => {
    const u = await patchMyProfile(patch);
    setUser(u);
    return u;
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      hydrated,
      register: doRegister,
      login: doLogin,
      logout: doLogout,
      refreshUser,
      updateProfile
    }),
    [user, hydrated, doRegister, doLogin, doLogout, refreshUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  }
  return ctx;
}
