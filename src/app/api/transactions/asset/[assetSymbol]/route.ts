import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

async function authHeader() {
  const token = await getAccessTokenFromCookies();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ assetSymbol: string }> }
) {
  const auth = await authHeader();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { assetSymbol } = await ctx.params;
  const symbol = String(assetSymbol ?? "").trim();
  if (!symbol) {
    return NextResponse.json({ message: "Missing required param: assetSymbol" }, { status: 400 });
  }

  // Backend endpoint added for per-asset transactions
  const upstream = await backendFetch(`/api/transactions/asset/${encodeURIComponent(symbol)}`, {
    method: "GET",
    headers: auth
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? null, { status: upstream.status });
}

