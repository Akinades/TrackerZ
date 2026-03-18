export type ApiUser = { id: string; email: string };

type MeResponse = { user: ApiUser | null };

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

export async function getCurrentUser(): Promise<ApiUser | null> {
  try {
    const res = await fetch("/api/auth/me", { method: "GET" });
    if (!res.ok) return null;
    const json = (await readJsonSafe(res)) as MeResponse | null;
    return json?.user ?? null;
  } catch {
    return null;
  }
}

export async function register(emailRaw: string, passwordRaw: string): Promise<ApiUser> {
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
    const json = (await readJsonSafe(res)) as any;
    if (!res.ok) throw new Error(json?.message || "สมัครสมาชิกไม่สำเร็จ");
    return (json?.user ?? null) as ApiUser;
  } catch (e) {
    throw errorFromUnknown(e);
  }
}

export async function login(emailRaw: string, passwordRaw: string): Promise<ApiUser> {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!email || !password) throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const json = (await readJsonSafe(res)) as any;
    if (!res.ok) throw new Error(json?.message || "เข้าสู่ระบบไม่สำเร็จ");
    return (json?.user ?? null) as ApiUser;
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

