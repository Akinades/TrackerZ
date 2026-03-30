"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/useAuth";
import { AccountProfileClient } from "@/components/account/AccountProfileClient";

export default function AccountPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <Card className="rounded-3xl border-zinc-200/80 p-8 text-center text-sm text-zinc-500">กำลังโหลด…</Card>
    );
  }

  if (!user) {
    return null;
  }

  return <AccountProfileClient user={user} />;
}
