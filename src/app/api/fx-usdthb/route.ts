import { NextResponse } from "next/server";

type FxResponse = { usdThb: number; source: string; fetchedAt: string };

export async function GET() {
  // Use a free, no-auth endpoint. Cached by Next fetch (1 hour).
  const url = "https://open.er-api.com/v6/latest/USD";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ message: `FX fetch failed (${res.status})` }, { status: 502 });
  }

  const json = (await res.json().catch(() => null)) as any;
  const thb = Number(json?.rates?.THB);
  if (!Number.isFinite(thb) || thb <= 0) {
    return NextResponse.json({ message: "FX response missing THB rate" }, { status: 502 });
  }

  return NextResponse.json(
    {
      usdThb: thb,
      source: "open.er-api.com",
      fetchedAt: new Date().toISOString()
    } satisfies FxResponse,
    { status: 200 }
  );
}

