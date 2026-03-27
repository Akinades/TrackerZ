import { NextResponse } from "next/server";
import { backendFetch, getAccessTokenFromCookies } from "@/lib/backendServer";

type Body = { plan?: string };

/**
 * POST /api/billing/checkout
 * พร็อกซีไป Backend จริง: POST /api/billing/checkout
 * คาดว่า Backend ตอบ { checkoutUrl } หรือ { url }
 *
 * ตั้ง MOCK_BILLING=true เพื่อทดสอบ flow โดย redirect กลับ /pricing/success (ไม่มีผู้ให้บริการจริง)
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const plan = body?.plan;
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ message: "ต้องเลือกแพ็ก monthly หรือ yearly" }, { status: 400 });
  }

  if (process.env.MOCK_BILLING === "true") {
    return NextResponse.json({
      checkoutUrl: `/pricing/success?plan=${plan}&mock=1`
    });
  }

  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const upstream = await backendFetch("/api/billing/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ plan })
  });

  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      {
        message:
          (json as { message?: string })?.message ||
          (json as { error?: string })?.error ||
          "สร้างเซสชันชำระเงินไม่สำเร็จ"
      },
      { status: upstream.status }
    );
  }

  return NextResponse.json(json ?? {});
}
