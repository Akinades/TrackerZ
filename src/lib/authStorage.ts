import type { Transaction } from "@/types/transactions";

type User = {
  id: string;
  email: string;
  password: string; // MVP only (do not use in production)
  createdAt: string;
};

type Session = {
  userId: string;
  createdAt: string;
};

const USERS_KEY = "trackerz.users.v1";
const SESSION_KEY = "trackerz.session.v1";
const TX_KEY = "trackerz.transactions.v1";
const PRICES_KEY = "trackerz.prices.v1";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSession(): Session | null {
  return readJson<Session | null>(SESSION_KEY, null);
}

export function getCurrentUser(): { id: string; email: string } | null {
  const sess = getSession();
  if (!sess) return null;
  const users = readJson<User[]>(USERS_KEY, []);
  const u = users.find((x) => x.id === sess.userId);
  if (!u) return null;
  return { id: u.id, email: u.email };
}

export function register(emailRaw: string, passwordRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!email || !password || password.length < 6) {
    throw new Error("กรุณากรอกอีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร");
  }
  const users = readJson<User[]>(USERS_KEY, []);
  if (users.some((u) => u.email === email)) {
    throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
  }
  const user: User = { id: uid(), email, password, createdAt: new Date().toISOString() };
  users.push(user);
  writeJson(USERS_KEY, users);
  writeJson(SESSION_KEY, { userId: user.id, createdAt: new Date().toISOString() } satisfies Session);
  return { id: user.id, email: user.email };
}

export function login(emailRaw: string, passwordRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  const users = readJson<User[]>(USERS_KEY, []);
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  writeJson(SESSION_KEY, { userId: user.id, createdAt: new Date().toISOString() } satisfies Session);
  return { id: user.id, email: user.email };
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function clearAllUserData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USERS_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(TX_KEY);
  window.localStorage.removeItem(PRICES_KEY);
}

export function exportLocalData(): { users: unknown; session: unknown; transactions: Transaction[] } {
  return {
    users: readJson(USERS_KEY, [] as unknown[]),
    session: readJson(SESSION_KEY, null as unknown),
    transactions: readJson<Transaction[]>(TX_KEY, [])
  };
}

