import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

type Ctx = { params: Promise<{ id: string }> };

async function authHeader() {
  const token = await getAccessTokenFromCookies();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function toBackendPatch(body: any) {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== "object") return out;

  if (body.side != null) out.type = body.side;
  if (body.assetName != null) out.asset_symbol = body.assetName;
  if (body.assetLabel != null) out.asset_name = body.assetLabel;
  if (body.amount != null) out.quantity = body.amount;
  if (body.price != null) out.price_per_unit = body.price;
  if (body.currency != null) out.currency = body.currency;

  // Preserve optional metadata in notes (non-breaking for backend)
  if (body.fee != null || body.tax != null || body.assetType != null || body.fxRateAtTrade != null) {
    out.notes = JSON.stringify({
      fee: body.fee ?? 0,
      tax: body.tax ?? 0,
      assetType: body.assetType ?? null,
      fxRateAtTrade: body.fxRateAtTrade ?? null
    });
  }

  return out;
}

export async function GET(_: Request, ctx: Ctx) {
  const auth = await authHeader();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const upstream = await backendFetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: auth
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? null, { status: upstream.status });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await authHeader();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const mapped = toBackendPatch(body ?? {});
  const upstream = await backendFetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(mapped)
  });
  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { message: (json as any)?.error || (json as any)?.message || "แก้ไขรายการไม่สำเร็จ" },
      { status: upstream.status }
    );
  }
  return NextResponse.json(json ?? null, { status: upstream.status });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const auth = await authHeader();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const upstream = await backendFetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: auth
  });
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { message: (json as any)?.error || (json as any)?.message || "ลบรายการไม่สำเร็จ" },
      { status: upstream.status }
    );
  }
  return NextResponse.json(json ?? null, { status: upstream.status });
}

