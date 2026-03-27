"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingFeatureComparison } from "@/components/pricing/PricingFeatureComparison";
import { PricingRenewalFaq } from "@/components/pricing/PricingRenewalFaq";
import { PRICING_COPY } from "@/lib/pricingPlans";
import { useAuth } from "@/store/useAuth";

export function PricingPageClient() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  const goRegisterWithPlan = (plan: "monthly" | "yearly") => {
    if (!hydrated) return;
    if (user) {
      router.push("/settings/plan");
      return;
    }
    router.push(`/register?plan=${plan}`);
  };

  const freeFeatures = [
    "Dashboard + บันทึกรายการ",
    `${PRICING_COPY.free.note}`,
    "เหมาะสำหรับเริ่มวัดผลพอร์ต"
  ];

  const proFeaturesShared = [
    "ทุกอย่างในสายฟรี",
    "รายงานและมุมมองวิเคราะห์เชิงลึก",
    "จัดการพอร์ตและเป้าหมายสัดส่วน"
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10 text-center sm:mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/90">
          TrackerZ Pricing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          เลือกสายฝึกให้เหมาะกับพอร์ตคุณ
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-zinc-600">
          เริ่มฟรีได้ทันที หรืออัปเป็น Pro เพื่อเครื่องมือและรายงานครบ
        </p>
        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            href="/"
            className="text-sm text-zinc-700 underline underline-offset-2 transition hover:text-zinc-900"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <PricingCard
          tier="free"
          title="Free"
          titleTh={PRICING_COPY.free.titleTh}
          priceBlock={
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
                {PRICING_COPY.free.headlinePrice}
              </span>
              <span className="text-sm text-zinc-500">{PRICING_COPY.free.unit}</span>
            </div>
          }
          features={freeFeatures}
          ctaLabel="เริ่มฝึกตน"
          ctaDisabled={!hydrated}
          onCta={() => {
            if (!hydrated) return;
            if (user) {
              router.push("/transactions");
              return;
            }
            router.push("/register?plan=free");
          }}
        />

        <PricingCard
          tier="monthly"
          title="Pro Monthly"
          titleTh={PRICING_COPY.monthly.titleTh}
          highlighted
          badge={{ text: PRICING_COPY.monthly.badge, variant: "promo" }}
          priceBlock={
            <div className="grid gap-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-800 sm:text-4xl">
                  {PRICING_COPY.monthly.promoPrice}
                </span>
                <span className="text-sm font-medium text-emerald-700">
                  {PRICING_COPY.monthly.unitFirst}
                </span>
              </div>
              <div className="text-sm text-zinc-600">
                ต่อด้วย{" "}
                <span className="font-semibold text-zinc-800">
                  {PRICING_COPY.monthly.regularPrice}
                </span>{" "}
                {PRICING_COPY.monthly.unitNext}
              </div>
            </div>
          }
          features={proFeaturesShared}
          ctaLabel="เริ่มฝึกตน"
          onCta={() => goRegisterWithPlan("monthly")}
        />

        <PricingCard
          tier="yearly"
          title="Pro Yearly"
          titleTh={PRICING_COPY.yearly.titleTh}
          badge={{ text: PRICING_COPY.yearly.badge, variant: "best" }}
          priceBlock={
            <div className="grid gap-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
                  {PRICING_COPY.yearly.price}
                </span>
                <span className="text-sm text-zinc-500">{PRICING_COPY.yearly.unit}</span>
              </div>
            </div>
          }
          note={PRICING_COPY.yearly.savings}
          features={proFeaturesShared}
          ctaLabel="เริ่มฝึกตน"
          onCta={() => goRegisterWithPlan("yearly")}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3 text-center text-xs text-zinc-500">
        <span>
          สมาชิกปัจจุบัน?{" "}
          <Link href="/settings/plan" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
            จัดการแพ็กเกจ
          </Link>
        </span>
      </div>

      <div className="mt-14 grid gap-10">
        <PricingFeatureComparison />
        <PricingRenewalFaq />
      </div>
    </div>
  );
}
