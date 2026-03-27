import { REGISTER_FEATURE_COMPARISON_ROWS } from "@/lib/pricingPlans";

function Cell({ ok }: { ok: boolean }) {
  return (
    <td className="px-2 py-3 text-center sm:px-5">
      {ok ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </span>
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          —
        </span>
      )}
    </td>
  );
}

export function PricingFeatureComparison() {
  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-left">
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">เปรียบเทียบฟีเจอร์</h2>
          <p className="mt-1 text-base text-zinc-600 sm:text-lg">
            Step 1: เลือกแพ็กเกจที่ต้องการก่อน — ตารางนี้ใช้ข้อความเดียวกับหน้าสมัครสมาชิก
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-700 sm:text-base">
          Step 1: Plan
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200/70 sm:mt-6">
        <table className="w-full min-w-[min(100%,320px)] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-50/90 to-white">
              <th className="px-2 py-3 text-left font-semibold text-zinc-800 sm:px-5">ฟีเจอร์</th>
              <th className="px-2 py-3 text-center font-semibold text-zinc-700 sm:px-5">
                สายฟรี
                <div className="mt-0.5 text-[10px] font-normal text-zinc-500 sm:text-xs">ผู้ฝึกตน</div>
              </th>
              <th className="px-2 py-3 text-center font-semibold text-emerald-800 sm:px-5">
                Pro
                <div className="mt-0.5 text-[10px] font-normal text-emerald-600 sm:text-xs">
                  จอมยุทธ์ / มหาเซียน
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {REGISTER_FEATURE_COMPARISON_ROWS.map((row) => (
              <tr
                key={row.feature}
                className="border-t border-zinc-100 bg-white/90 odd:bg-zinc-50/40"
              >
                <th scope="row" className="px-2 py-3 text-left font-medium text-zinc-800 sm:px-5">
                  {row.feature}
                </th>
                <Cell ok={row.free} />
                <Cell ok={row.pro} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
