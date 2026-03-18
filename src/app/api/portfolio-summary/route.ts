import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const upstream = await backendFetch("/api/portfolio-summary", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? null, { status: upstream.status });
}

