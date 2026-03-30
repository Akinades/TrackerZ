import { NextResponse } from "next/server";

type FxLatestResponse = {
  base: "USD";
  rates: Record<string, number>;
  source: string;
  fetchedAt: string;
};

const WANT = ["USD", "THB", "EUR", "JPY", "GBP", "CNY"] as const;

export async function GET() {
  const url = "https://open.er-api.com/v6/latest/USD";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ message: `FX fetch failed (${res.status})` }, { status: 502 });
  }

  const json = (await res.json().catch(() => null)) as any;
  const rates = json?.rates ?? {};
  const out: Record<string, number> = {};

  for (const c of WANT) {
    if (c === "USD") {
      out.USD = 1;
      continue;
    }
    const v = Number(rates?.[c]);
    if (Number.isFinite(v) && v > 0) out[c] = v;
  }

  return NextResponse.json(
    {
      base: "USD",
      rates: out,
      source: "open.er-api.com",
      fetchedAt: new Date().toISOString(),
    } satisfies FxLatestResponse,
    { status: 200 },
  );
}

