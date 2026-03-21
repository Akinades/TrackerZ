import { normalizePublicUser, type PublicUser, type UserProfilePatch } from "@/types/publicUser";

/** @deprecated ใช้ PublicUser แทน — คงไว้เพื่อ import เก่า */
export type ApiUser = PublicUser;

type MeResponse = { user: PublicUser | null };

async function readJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function errorFromUnknown(e: unknown) {
  return e instanceof Error ? e : new Error("เกิดข้อผิดพลาด");
}

function userFromResponse(json: unknown): PublicUser | null {
  const raw = (json as { user?: unknown })?.user ?? (json as { data?: { user?: unknown } })?.data?.user;
  return normalizePublicUser(raw);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    const res = await fetch("/api/auth/me", { method: "GET" });
    if (!res.ok) return null;
    const json = (await readJsonSafe(res)) as MeResponse | null;
    const u = json?.user;
    return normalizePublicUser(u);
  } catch {
    return null;
  }
}

export async function register(emailRaw: string, passwordRaw: string): Promise<PublicUser> {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!email || !password || password.length < 6) {
    throw new Error("กรุณากรอกอีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร");
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const json = (await readJsonSafe(res)) as unknown;
    if (!res.ok) throw new Error((json as { message?: string })?.message || "สมัครสมาชิกไม่สำเร็จ");
    const u = userFromResponse(json);
    if (!u) throw new Error("รูปแบบข้อมูลผู้ใช้ไม่ถูกต้อง");
    return u;
  } catch (e) {
    throw errorFromUnknown(e);
  }
}

export async function login(emailRaw: string, passwordRaw: string): Promise<PublicUser> {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!email || !password) throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const json = (await readJsonSafe(res)) as unknown;
    if (!res.ok) throw new Error((json as { message?: string })?.message || "เข้าสู่ระบบไม่สำเร็จ");
    const u = userFromResponse(json);
    if (!u) throw new Error("รูปแบบข้อมูลผู้ใช้ไม่ถูกต้อง");
    return u;
  } catch (e) {
    throw errorFromUnknown(e);
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore network errors for logout
  }
}

/** PATCH /api/auth/me — body ตาม UserProfilePatch (อย่างน้อย 1 ฟิลด์) */
export async function patchMyProfile(patch: UserProfilePatch): Promise<PublicUser> {
  const keys = Object.keys(patch).filter((k) => patch[k as keyof UserProfilePatch] !== undefined);
  if (keys.length === 0) {
    throw new Error("ไม่มีฟิลด์ที่จะอัปเดต");
  }

  try {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const json = (await readJsonSafe(res)) as { message?: string; user?: unknown } | null;
    if (!res.ok) throw new Error(json?.message || "อัปเดตโปรไฟล์ไม่สำเร็จ");
    const u = normalizePublicUser(json?.user);
    if (!u) throw new Error("รูปแบบข้อมูลผู้ใช้ไม่ถูกต้อง");
    return u;
  } catch (e) {
    throw errorFromUnknown(e);
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
  }
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const json = (await readJsonSafe(res)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    return (json?.message && String(json.message).trim()) || "เปลี่ยนรหัสผ่านแล้ว";
  } catch (e) {
    throw errorFromUnknown(e);
  }
}
