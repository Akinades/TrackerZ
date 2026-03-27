import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";
import { toBackendCreate } from "@/lib/transactionBackendMap";

async function authHeader() {
  const token = await getAccessTokenFromCookies();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function GET() {
  const auth = await authHeader();
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const upstream = await backendFetch("/api/transactions", {
    method: "GET",
    headers: auth,
  });
  const json = await upstream.json().catch(() => null);
  return NextResponse.json(json ?? null, { status: upstream.status });
}

export async function POST(req: Request) {
  const auth = await authHeader();
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const mapped = toBackendCreate(body ?? {});
  const upstream = await backendFetch("/api/transactions", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(mapped),
  });
  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      {
        message:
          (json as any)?.error ||
          (json as any)?.message ||
          "เพิ่มรายการไม่สำเร็จ",
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json(json ?? null, { status: upstream.status });
}

/** ลบธุรกรรมทั้งหมดของ user ที่ล็อกอิน — รองรับ filter ด้วย query asset_symbol */
export async function DELETE(req: Request) {
  const auth = await authHeader();
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const upstreamPath = qs ? `/api/transactions?${qs}` : "/api/transactions";

  const upstream = await backendFetch(upstreamPath, {
    method: "DELETE",
    headers: auth,
  });

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        message:
          (json as { error?: string; message?: string })?.error ||
          (json as { message?: string })?.message ||
          "ลบรายการทั้งหมดไม่สำเร็จ",
        deleted: 0,
      },
      { status: upstream.status },
    );
  }

  const deleted =
    json != null &&
    typeof json === "object" &&
    typeof (json as { deleted?: unknown }).deleted === "number"
      ? (json as { deleted: number }).deleted
      : 0;

  return NextResponse.json({ deleted }, { status: upstream.status });
}
