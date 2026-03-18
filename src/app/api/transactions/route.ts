import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

async function authHeader() {
  const token = await getAccessTokenFromCookies();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function toBackendCreate(body: any) {
  // Frontend legacy fields -> backend schema:
  // side -> type, assetName -> asset_symbol, assetLabel -> asset_name, amount -> quantity, price -> price_per_unit
  const side = body?.side;
  const assetName = body?.assetName;
  const assetLabel = body?.assetLabel;
  const amount = body?.amount;
  const price = body?.price;
  const currency = body?.currency ?? "THB";

  const fee = body?.fee;
  const assetType = body?.assetType;
  const notes =
    fee != null || assetType != null
      ? JSON.stringify({ fee: fee ?? 0, assetType: assetType ?? null })
      : undefined;

  return {
    type: side,
    asset_symbol: assetName,
    asset_name: assetLabel || assetName,
    quantity: amount,
    price_per_unit: price,
    currency,
    notes
  };
}

export async function GET() {
  const auth = await authHeader();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const upstream = await backendFetch("/api/transactions", { method: "GET", headers: auth });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? null, { status: upstream.status });
}

export async function POST(req: Request) {
  const auth = await authHeader();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const mapped = toBackendCreate(body ?? {});
  const upstream = await backendFetch("/api/transactions", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(mapped)
  });
  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { message: (json as any)?.error || (json as any)?.message || "เพิ่มรายการไม่สำเร็จ" },
      { status: upstream.status }
    );
  }
  return NextResponse.json(json ?? null, { status: upstream.status });
}

