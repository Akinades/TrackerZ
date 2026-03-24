import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const upstream = await backendFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });

  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? null, { status: upstream.status });
}
