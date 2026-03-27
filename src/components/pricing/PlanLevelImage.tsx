import Image from "next/image";
import type { UserPlan } from "@/lib/authStorage";

/** แมปแพ็กกับไฟล์ใน public/levels — ผู้ฝึกตน → seed, จอมยุทธ์ → strategist, มหาเซียน → master */
const LEVEL_SRC: Record<UserPlan, string> = {
  free: "/levels/seed.png",
  monthly: "/levels/strategist.png",
  yearly: "/levels/master.png"
};

const LEVEL_ALT: Record<UserPlan, string> = {
  free: "ระดับผู้ฝึกตน",
  monthly: "ระดับจอมยุทธ์",
  yearly: "ระดับมหาเซียน"
};

type Props = {
  tier: UserPlan;
  className?: string;
};

export function PlanLevelImage({ tier, className }: Props) {
  return (
    <div className={className ?? "relative h-14 w-14 shrink-0"}>
      <Image
        src={LEVEL_SRC[tier]}
        alt={LEVEL_ALT[tier]}
        fill
        className="object-contain"
        sizes="56px"
      />
    </div>
  );
}
