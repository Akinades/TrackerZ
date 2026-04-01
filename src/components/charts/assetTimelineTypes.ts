export const SERIES_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

export type PositionPoint = {
  ts: number;
  value: number;
  tipValue?: number;
  tipKind: "position";
  tipAsset: string;
  tipQty: number;
};

export type TradePoint = {
  ts: number;
  value: number;
  tipKind: "buy" | "sell";
  tipAsset: string;
  tipAmount: number;
  tipUnitPrice: number;
  tipCount?: number;
};

export type ChartPointPayload = PositionPoint | TradePoint;

export type AssetSeries = {
  assetName: string;
  color: string;
  points: PositionPoint[];
  buys: TradePoint[];
  sells: TradePoint[];
};
