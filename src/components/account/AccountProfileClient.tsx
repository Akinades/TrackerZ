"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { changePassword } from "@/lib/authStorage";
import { publicUserToProfileForm, type UserProfile } from "@/types/userProfile";
import { notify } from "@/lib/notify";
import { useAuth, type AuthUser } from "@/store/useAuth";
import type { PublicUser } from "@/types/publicUser";
import { Modal } from "@/components/ui/Modal";
import { Mail, UserRound, Sparkles } from "lucide-react";
import { getLevelByPerformance } from "@/lib/levels";
import { useDashboardPortfolio } from "@/hooks/useDashboardPortfolio";

const COUNTRIES = [
  { value: "TH", label: "ไทย" },
  { value: "US", label: "สหรัฐอเมริกา" },
  { value: "SG", label: "สิงคโปร์" },
  { value: "JP", label: "ญี่ปุ่น" },
  { value: "OTHER", label: "อื่น ๆ" },
] as const;

function passwordErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error && e.message.trim()) return e.message;
  if (typeof e === "string" && e.trim()) return e;
  return fallback;
}

function displayInitial(email: string, displayName: string) {
  const n = displayName.trim();
  if (n.length > 0) return n.slice(0, 1).toUpperCase();
  const e = email.trim();
  if (e.length > 0) return e.slice(0, 1).toUpperCase();
  return "?";
}

function formatThaiDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(date);
}

function dayDiffCeil(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()))
    return null;
  const diffMs = toDate.getTime() - fromDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

type Props = { user: NonNullable<AuthUser> };

export function AccountProfileClient({ user }: Props) {
  const { updateProfile } = useAuth();
  const d = useDashboardPortfolio();
  const [profile, setProfile] = React.useState<UserProfile>(() =>
    publicUserToProfileForm(user),
  );
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [pwModalOpen, setPwModalOpen] = React.useState(false);
  const [pwError, setPwError] = React.useState<string | null>(null);
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [pwBusy, setPwBusy] = React.useState(false);

  const closePwModal = React.useCallback(() => {
    setPwModalOpen(false);
    setPwError(null);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }, []);

  const openPwModal = React.useCallback(() => {
    setPwError(null);
    setPwModalOpen(true);
  }, []);

  React.useEffect(() => {
    setProfile(publicUserToProfileForm(user));
  }, [user.id, user.updatedAt]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const u: PublicUser = await updateProfile({
        displayName: profile.displayName,
        phone: profile.phone,
        lineId: profile.lineId,
        country: profile.country,
        occupation: profile.occupation,
        bio: profile.bio,
        notes: profile.notes,
      });
      setProfile(publicUserToProfileForm(u));
      notify.success("บันทึกข้อมูลส่วนตัวแล้ว");
    } catch (e) {
      notify.error(e, "บันทึกไม่สำเร็จ");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (newPw !== confirmPw) {
      setPwError("รหัสผ่านใหม่กับยืนยันไม่ตรงกัน");
      return;
    }
    if (newPw.length < 6) {
      setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setPwBusy(true);
    try {
      const msg = await changePassword(currentPw, newPw);
      closePwModal();
      notify.success(msg);
    } catch (e) {
      setPwError(passwordErrorMessage(e, "เปลี่ยนรหัสผ่านไม่สำเร็จ"));
    } finally {
      setPwBusy(false);
    }
  };

  const initial = displayInitial(user.email, profile.displayName);
  const planLabel =
    user.plan === "monthly"
      ? "Pro Monthly"
      : user.plan === "yearly"
        ? "Pro Yearly"
        : "Free";
  const planDurationDays = dayDiffCeil(user.planStartedAt, user.planExpiresAt);
  const planRemainingDays = dayDiffCeil(
    new Date().toISOString(),
    user.planExpiresAt,
  );
  const currentLevel = getLevelByPerformance(d.totalReturnPct, d.txsLength);
  const [levelIconError, setLevelIconError] = React.useState(false);

  React.useEffect(() => {
    setLevelIconError(false);
  }, [currentLevel.key]);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            โปรไฟล์
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            ข้อมูลส่วนตัวซิงก์กับบัญชีบนเซิร์ฟเวอร์ —
            เปลี่ยนรหัสผ่านได้จากปุ่มข้างล่าง
          </p>
        </div>
        <Link
          href="/settings"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline sm:shrink-0"
        >
          ตั้งค่าแอป →
        </Link>
      </div>

      <Card className="overflow-hidden rounded-3xl border-zinc-200/80 p-0 shadow-sm">
        <div className="border-b border-zinc-100 bg-gradient-to-br from-emerald-50/80 via-white to-zinc-50/60 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-white bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-semibold text-white shadow-lg shadow-emerald-900/15"
                aria-hidden
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="text-lg font-semibold text-zinc-900">
                    {profile.displayName.trim() || "ยังไม่ได้ตั้งชื่อที่แสดง"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-emerald-800">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    TrackerZ
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-zinc-600 sm:justify-start">
                  <Mail
                    className="h-4 w-4 shrink-0 text-zinc-400"
                    aria-hidden
                  />
                  <span className="truncate">{user.email}</span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">
                  อีเมลผูกกับบัญชี — แก้ไขได้เฉพาะฝั่งเซิร์ฟเวอร์
                </p>
              </div>
            </div>
            <div className="w-full rounded-2xl  bg-white/75 p-3 sm:w-[260px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium tracking-wide text-zinc-500">
                    ระดับปัจจุบัน
                  </div>
                  <div className="mt-1 text-3xl font-extrabold leading-tight text-emerald-800">
                    {currentLevel.label}
                  </div>
                  <div
                    className="mt-1 max-w-[160px] truncate whitespace-nowrap text-xs text-zinc-500"
                    title={currentLevel.description}
                  >
                    {currentLevel.description}
                  </div>
                  <div className="mt-1 text-xs font-medium text-emerald-700">
                    กำไรรวม:{" "}
                    {typeof d.totalReturnPct === "number"
                      ? `${d.totalReturnPct.toFixed(2)}%`
                      : "-"}
                  </div>
                </div>
                <span
                  className="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl   bg-transparent text-2xl leading-none"
                  aria-hidden
                >
                  {!levelIconError ? (
                    <img
                      src={currentLevel.iconFile}
                      alt=""
                      className="h-full w-full object-contain"
                      onError={() => setLevelIconError(true)}
                    />
                  ) : (
                    currentLevel.icon
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8">
          <div className="mb-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-zinc-900">
                แพ็กเกจสมาชิก
              </div>
              <span className="rounded-full border border-emerald-200/80 bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {planLabel}
              </span>
            </div>
            {user.plan === "free" ? (
              <div className="mt-2 text-sm text-zinc-600">
                แผนฟรี (ไม่มีวันหมดอายุ)
              </div>
            ) : (
              <div className="mt-3 grid gap-1 text-sm text-zinc-700 sm:grid-cols-2">
                <div>
                  เริ่มแพ็กเกจ:{" "}
                  <span className="font-medium">
                    {formatThaiDate(user.planStartedAt)}
                  </span>
                </div>
                <div>
                  หมดอายุ:{" "}
                  <span className="font-medium">
                    {formatThaiDate(user.planExpiresAt)}
                  </span>
                </div>
                <div>
                  ระยะแพ็กเกจ:{" "}
                  <span className="font-medium">
                    {typeof planDurationDays === "number"
                      ? `${planDurationDays} วัน`
                      : "-"}
                  </span>
                </div>
                <div>
                  วันคงเหลือ:{" "}
                  <span className="font-medium">
                    {typeof planRemainingDays === "number"
                      ? `${planRemainingDays} วัน`
                      : "-"}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-800">
            <UserRound className="h-4 w-4 text-zinc-500" aria-hidden />
            ข้อมูลส่วนตัว
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="displayName"
              >
                ชื่อที่แสดง
              </label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="เช่น คุณหนุ่ม · Apisit"
                autoComplete="name"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="phone"
              >
                เบอร์โทร
              </label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="08x xxx xxxx"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="lineId"
              >
                LINE / ช่องทางติดต่อ
              </label>
              <Input
                id="lineId"
                value={profile.lineId}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, lineId: e.target.value }))
                }
                placeholder="@line_id หรือลิงก์"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="country"
              >
                ประเทศ / ภูมิภาค
              </label>
              <Select
                id="country"
                value={profile.country}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, country: e.target.value }))
                }
                className="h-11 rounded-2xl border-zinc-200/80 bg-white px-3 text-sm shadow-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="occupation"
              >
                อาชีพ / บทบาท
              </label>
              <Input
                id="occupation"
                value={profile.occupation}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, occupation: e.target.value }))
                }
                placeholder="เช่น พนักงาน · เทรดเดอร์"
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="bio"
              >
                แนะนำตัวสั้น ๆ
              </label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="เล่าสั้น ๆ เกี่ยวกับเป้าหมายการลงทุนของคุณ"
                rows={3}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <label
                className="text-xs font-medium text-zinc-500"
                htmlFor="notes"
              >
                โน้ตส่วนตัว
              </label>
              <Textarea
                id="notes"
                value={profile.notes}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="บันทึกสั้น ๆ (ซิงก์กับบัญชี)"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={savingProfile}
              onClick={handleSaveProfile}
            >
              {savingProfile ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="shadow-none"
              onClick={openPwModal}
            >
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={pwModalOpen}
        onClose={closePwModal}
        title="เปลี่ยนรหัสผ่าน"
        className="max-w-md"
      >
        <p className="mb-4 text-xs leading-relaxed text-zinc-500">
          ส่งไปที่{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-[10px]">
            POST /api/auth/change-password
          </code>
        </p>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-zinc-500"
              htmlFor="modal-currentPw"
            >
              รหัสผ่านปัจจุบัน
            </label>
            <Input
              id="modal-currentPw"
              type="password"
              value={currentPw}
              onChange={(e) => {
                setPwError(null);
                setCurrentPw(e.target.value);
              }}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-zinc-500"
              htmlFor="modal-newPw"
            >
              รหัสผ่านใหม่
            </label>
            <Input
              id="modal-newPw"
              type="password"
              value={newPw}
              onChange={(e) => {
                setPwError(null);
                setNewPw(e.target.value);
              }}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-zinc-500"
              htmlFor="modal-confirmPw"
            >
              ยืนยันรหัสผ่านใหม่
            </label>
            <Input
              id="modal-confirmPw"
              type="password"
              value={confirmPw}
              onChange={(e) => {
                setPwError(null);
                setConfirmPw(e.target.value);
              }}
              autoComplete="new-password"
            />
          </div>
          {pwError ? (
            <p
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              role="alert"
              aria-live="assertive"
            >
              {pwError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              disabled={pwBusy || !currentPw || !newPw || !confirmPw}
              onClick={handleChangePassword}
            >
              {pwBusy ? "กำลังเปลี่ยน…" : "ยืนยันเปลี่ยนรหัสผ่าน"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-600"
              onClick={closePwModal}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
