import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { TransactionsPageModel } from "@/hooks/useTransactionsPage";
import { useI18n } from "@/components/shared/I18nProvider";

type Props = { m: TransactionsPageModel };

export function TransactionConfirmModal({ m }: Props) {
  const { t } = useI18n();
  const {
    confirmOpen,
    setConfirmOpen,
    confirmTitle,
    confirmBody,
    confirmCta,
    confirmActionRef
  } = m;

  return (
    <Modal
      open={confirmOpen}
      onClose={() => {
        setConfirmOpen(false);
        confirmActionRef.current = null;
      }}
      title={confirmTitle}
      className="max-w-lg"
    >
      <div className="grid gap-4">
        <div>{confirmBody}</div>
        <div className="flex gap-2 sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false);
              confirmActionRef.current = null;
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              const fn = confirmActionRef.current;
              setConfirmOpen(false);
              confirmActionRef.current = null;
              fn?.();
            }}
          >
            {confirmCta}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
