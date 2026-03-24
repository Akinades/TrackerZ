import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";
import { toBackendCreate } from "@/lib/transactionBackendMap";

const MAX_ITEMS = 500;

async function authHeader() {
  const token = await getAccessTokenFromCookies();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function POST(req: Request) {
  const auth = await authHeader();
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { message: "ต้องส่ง items เป็น array ที่ไม่ว่าง" },
      { status: 400 },
    );
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { message: `สูงสุด ${MAX_ITEMS} รายการต่อครั้ง แบ่งไฟล์หรือย่อข้อมูล` },
      { status: 400 },
    );
  }

  const failed: { index: number; message: string }[] = [];
  let created = 0;

  // ลำดับต่อเนื่องลดโอกาส backend / DB รับภาระพร้อมกันสูงเกินไป
  for (let i = 0; i < items.length; i++) {
    const mapped = toBackendCreate(items[i] as Record<string, unknown>);
    const upstream = await backendFetch("/api/transactions", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(mapped),
    });
    if (!upstream.ok) {
      const json = await upstream.json().catch(() => null);
      failed.push({
        index: i,
        message:
          (json as { error?: string; message?: string })?.error ||
          (json as { message?: string })?.message ||
          `HTTP ${upstream.status}`,
      });
    } else {
      created += 1;
    }
  }

  return NextResponse.json({
    created,
    failed,
    total: items.length,
    ok: failed.length === 0,
  });
}
