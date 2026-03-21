/** Map frontend transaction body -> Express backend create payload */
export function toBackendCreate(body: Record<string, unknown> | null | undefined) {
  const b = body ?? {};
  const side = b.side;
  const assetName = b.assetName;
  const assetLabel = b.assetLabel;
  const amount = b.amount;
  const price = b.price;
  const currency = b.currency ?? "THB";

  const fee = b.fee;
  const tax = b.tax;
  const assetType = b.assetType;
  const fxRateAtTrade = b.fxRateAtTrade;

  const tradedAtRaw = b.tradedAt ?? b.traded_at;
  const createdAtRaw = b.createdAt ?? b.created_at;
  const tradedAt =
    typeof tradedAtRaw === "string" && tradedAtRaw.trim() ? tradedAtRaw.trim() : undefined;
  const createdAt =
    typeof createdAtRaw === "string" && createdAtRaw.trim() ? createdAtRaw.trim() : undefined;
  /** เวลาทำรายการจริง — import/ฟอร์มส่ง traded_at ก่อน */
  const eventTime = tradedAt ?? createdAt;

  const notes =
    fee != null || tax != null || assetType != null || fxRateAtTrade != null
      ? JSON.stringify({
          fee: fee ?? 0,
          tax: tax ?? 0,
          assetType: assetType ?? null,
          fxRateAtTrade: fxRateAtTrade ?? null
        })
      : undefined;

  const out: Record<string, unknown> = {
    type: side,
    asset_symbol: assetName,
    asset_name: assetLabel || assetName,
    quantity: amount,
    price_per_unit: price,
    currency,
    notes
  };

  if (eventTime) {
    out.created_at = eventTime;
    if (tradedAt) {
      out.traded_at = tradedAt;
    }
  }

  return out;
}
