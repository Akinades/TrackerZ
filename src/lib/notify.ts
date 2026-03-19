import { toast } from "sonner";

function normalizeErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error && e.message.trim()) return e.message;
  if (typeof e === "string" && e.trim()) return e;
  return fallback;
}

export const notify = {
  success(message: string) {
    toast.success(message);
  },
  info(message: string) {
    toast(message);
  },
  warning(message: string) {
    toast.warning(message);
  },
  error(messageOrError: unknown, fallback = "เกิดข้อผิดพลาด") {
    toast.error(normalizeErrorMessage(messageOrError, fallback));
  }
};

