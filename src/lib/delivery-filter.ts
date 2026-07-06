import type { OfferFilterTagId } from "@/lib/offer-filter-tags";

export const DELIVERY_FILTERS = [
  { id: "all", label: "全部交付", shortLabel: "全部", tagId: null },
  { id: "recharge", label: "直充/代充", shortLabel: "直充", tagId: "delivery_recharge" },
  { id: "cdk", label: "卡密/CDK", shortLabel: "卡密", tagId: "delivery_cdk" },
  { id: "account", label: "成品账号", shortLabel: "账号", tagId: "delivery_account" },
  { id: "shared", label: "拼车/共享", shortLabel: "拼车", tagId: "shared_access" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  shortLabel: string;
  tagId: OfferFilterTagId | null;
}>;

export type DeliveryFilterId = (typeof DELIVERY_FILTERS)[number]["id"];

export const DEFAULT_DELIVERY_FILTER: DeliveryFilterId = "all";

const DELIVERY_FILTER_IDS = new Set<string>(DELIVERY_FILTERS.map((item) => item.id));
const DELIVERY_FILTER_BY_ID = new Map<DeliveryFilterId, (typeof DELIVERY_FILTERS)[number]>(
  DELIVERY_FILTERS.map((item) => [item.id, item]),
);

export function parseDeliveryFilter(value: string | string[] | null | undefined): DeliveryFilterId {
  const input = Array.isArray(value) ? value[0] : value;
  const normalized = String(input || "").trim();
  return DELIVERY_FILTER_IDS.has(normalized) ? normalized as DeliveryFilterId : DEFAULT_DELIVERY_FILTER;
}

export function deliveryFilterLabel(value: DeliveryFilterId): string {
  return DELIVERY_FILTER_BY_ID.get(value)?.label || DELIVERY_FILTER_BY_ID.get(DEFAULT_DELIVERY_FILTER)!.label;
}

export function deliveryFilterShortLabel(value: DeliveryFilterId): string {
  return DELIVERY_FILTER_BY_ID.get(value)?.shortLabel || DELIVERY_FILTER_BY_ID.get(DEFAULT_DELIVERY_FILTER)!.shortLabel;
}

export function deliveryFilterToTag(value: DeliveryFilterId): OfferFilterTagId | null {
  return DELIVERY_FILTER_BY_ID.get(value)?.tagId || null;
}

export function deliveryFilterToFilterTags(value: DeliveryFilterId): OfferFilterTagId[] {
  const tag = deliveryFilterToTag(value);
  return tag ? [tag] : [];
}
