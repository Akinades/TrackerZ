import { normalizePublicUser, type PublicUser, type UserProfilePatch } from "@/types/publicUser";

/** @deprecated ใช้ PublicUser แทน — คงไว้เพื่อ import เก่า */
export type ApiUser = PublicUser;

type MeResponse = { user: PublicUser | null };
export type UserPlan = "free" | "monthly" | "yearly";

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

type RetryError = Error & { retryAfterSeconds?: number };

function makeApiError(message: string, retryAfterSeconds?: unknown): RetryError {
  const err = new Error(message) as RetryError;
  if (typeof retryAfterSeconds === "number" && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    err.retryAfterSeconds = Math.ceil(retryAfterSeconds);
  }
  return err;
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

export async function register(
  emailRaw: string,
  passwordRaw: string,
  plan: UserPlan = "free"
): Promise<PublicUser> {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!email || !password || password.length < 6) {
    throw new Error("กรุณากรอกอีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร");
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, plan })
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

/** PATCH /api/auth/plan — เปลี่ยนแพ็กเกจผู้ใช้ที่ล็อกอิน */
export async function updateMyPlan(plan: UserPlan): Promise<PublicUser> {
  try {
    const res = await fetch("/api/auth/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const json = (await readJsonSafe(res)) as { message?: string; user?: unknown } | null;
    if (!res.ok) throw new Error(json?.message || "เปลี่ยนแพ็กเกจไม่สำเร็จ");
    const u = normalizePublicUser(json?.user);
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

export async function forgotPassword(emailRaw: string): Promise<string> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) throw new Error("กรุณากรอกอีเมล");
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const json = (await readJsonSafe(res)) as
      | { message?: string; error?: string; retryAfterSeconds?: number }
      | null;
    if (!res.ok) {
      throw makeApiError(
        json?.message || json?.error || "ส่ง OTP ไม่สำเร็จ",
        json?.retryAfterSeconds
      );
    }
    return (json?.message && String(json.message).trim()) || "ส่ง OTP ไปที่อีเมลแล้ว";
  } catch (e) {
    throw errorFromUnknown(e);
  }
}

export async function resetPasswordWithOtp(
  emailRaw: string,
  otpRaw: string,
  newPassword: string
): Promise<string> {
  const email = emailRaw.trim().toLowerCase();
  const otp = otpRaw.trim();
  if (!email) throw new Error("กรุณากรอกอีเมล");
  if (!/^\d{6}$/.test(otp)) throw new Error("OTP ต้องเป็นตัวเลข 6 หลัก");
  if (!newPassword || newPassword.length < 6) {
    throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
  }

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const json = (await readJsonSafe(res)) as
      | { message?: string; error?: string; retryAfterSeconds?: number }
      | null;
    if (!res.ok) {
      throw makeApiError(
        json?.message || json?.error || "รีเซ็ตรหัสผ่านไม่สำเร็จ",
        json?.retryAfterSeconds
      );
    }
    return (json?.message && String(json.message).trim()) || "รีเซ็ตรหัสผ่านสำเร็จ";
  } catch (e) {
    throw errorFromUnknown(e);
  }
}
