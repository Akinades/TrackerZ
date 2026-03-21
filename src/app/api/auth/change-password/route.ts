import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

/**
 * พร็อกซีไปยัง backend — path มาตรฐานที่หนึ่ง ถ้า backend ใช้ path อื่นให้ปรับที่นี่
 */
export async function POST(req: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword =
    (body as { currentPassword?: string })?.currentPassword ??
    (body as { current_password?: string })?.current_password ??
    "";
  const newPassword =
    (body as { newPassword?: string })?.newPassword ??
    (body as { new_password?: string })?.new_password ??
    "";

  if (!String(newPassword).trim() || String(newPassword).length < 6) {
    return NextResponse.json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const upstream = await backendFetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      current_password: currentPassword,
      new_password: newPassword
    })
  });

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const msg =
      (json as { message?: string })?.message ??
      (json as { error?: string })?.error ??
      (upstream.status === 404
        ? "เซิร์ฟเวอร์ยังไม่รองรับการเปลี่ยนรหัสผ่าน (ลองอัปเดต backend)"
        : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    return NextResponse.json({ message: msg }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, ...(json && typeof json === "object" ? json : {}) });
}
