import type {
  OfferFeedbackReason,
  OfferFeedbackSuggestedAction,
  OfferFeedbackUserExpectedAction,
  RawOffer,
} from "@/lib/types";

export const AFTERSALES_FEEDBACK_REASON: OfferFeedbackReason = "aftersales_shipping";
export const HIGH_RISK_FEEDBACK_REASONS: ReadonlySet<OfferFeedbackReason> = new Set([
  AFTERSALES_FEEDBACK_REASON,
  "fraud",
  "bad_source",
]);
export const FEEDBACK_EVIDENCE_REQUIRED_ACTIONS: ReadonlySet<OfferFeedbackUserExpectedAction> = new Set([
  "hide_offer",
  "hide_source",
]);
export const LOW_RISK_VERIFICATION_REASONS: ReadonlySet<OfferFeedbackReason> = new Set([
  "item_removed",
  "stock_mismatch",
]);

export const API_CDK_PLATFORM = "API/CDK";
export const API_CDK_PRODUCT_ID = "openai-api-cdk";
// Defaults to hidden. Set either flag to 1/true/yes/on when the API/CDK catalog needs to be restored publicly.
export const API_CDK_PUBLIC_VISIBILITY_ENV = "NEXT_PUBLIC_PRICEAI_SHOW_API_CDK";
export const API_CDK_SERVER_VISIBILITY_ENV = "PRICEAI_SHOW_API_CDK";
export const OFFER_EXIT_NOTICE_MUTED_DATE_KEY = "priceai:offer-exit-notice-muted-date";
export const OFFER_HIGH_RISK_PRICE_THRESHOLD = 30;

export function feedbackRequiresEvidence(
  reason: OfferFeedbackReason | string,
  userExpectedAction?: OfferFeedbackUserExpectedAction | string | null,
): boolean {
  return HIGH_RISK_FEEDBACK_REASONS.has(reason as OfferFeedbackReason) ||
    FEEDBACK_EVIDENCE_REQUIRED_ACTIONS.has(userExpectedAction as OfferFeedbackUserExpectedAction);
}

export function inferSuggestedActionForFeedback(reason: OfferFeedbackReason): OfferFeedbackSuggestedAction {
  if (reason === "wrong_price" || reason === "stock_mismatch") return "recollect";
  if (reason === "item_removed") return "hide_offer";
  if (reason === "fraud") return "hide_offer";
  if (reason === "bad_source") return "hide_source";
  if (reason === "wrong_category") return "reclassify";
  if (reason === AFTERSALES_FEEDBACK_REASON) return "todo";
  return "todo";
}

export function shouldCreateFeedbackVerification(
  reason: OfferFeedbackReason,
  notes?: string | null,
  evidenceText?: string | null,
): boolean {
  if (LOW_RISK_VERIFICATION_REASONS.has(reason)) return true;

  if (reason !== "wrong_price" && reason !== "other") return false;
  const text = `${notes || ""} ${evidenceText || ""}`.toLowerCase();
  return /已下架|下架|无法下单|不能下单|不能购买|无法购买|链接打不开|404|失效|无货|缺货/.test(text);
}

export function buildInitialFeedbackVerificationResult(input: {
  reason: OfferFeedbackReason;
  notes?: string | null;
  evidenceText?: string | null;
  offerStatus?: RawOffer["status"] | null;
  createdAt?: string;
}): Record<string, unknown> | null {
  if (!shouldCreateFeedbackVerification(input.reason, input.notes, input.evidenceText)) return null;

  return {
    verificationStatus: "pending",
    verificationResult: null,
    verifiedAt: null,
    verificationMessage: "已进入后台核验队列；前台提交未同步抓取原站。",
    verificationReason: input.reason,
    createdCollectionJobId: null,
    currentOfferStatus: input.offerStatus || null,
    queuedAt: input.createdAt || new Date().toISOString(),
  };
}

export function apiCdkPublicVisible(): boolean {
  return truthyFlag(process.env[API_CDK_SERVER_VISIBILITY_ENV]) ||
    truthyFlag(process.env[API_CDK_PUBLIC_VISIBILITY_ENV]);
}

export function apiCdkPublicVisibleForClient(): boolean {
  return truthyFlag(process.env[API_CDK_PUBLIC_VISIBILITY_ENV]);
}

export function isApiCdkProductLike(product: { id?: string | null; platform?: string | null } | null | undefined): boolean {
  return product?.id === API_CDK_PRODUCT_ID || product?.platform === API_CDK_PLATFORM;
}

export function isPublicCatalogProduct(
  product: { id?: string | null; platform?: string | null },
  options: { showApiCdk?: boolean } = {},
): boolean {
  if (options.showApiCdk ?? apiCdkPublicVisible()) return true;
  return !isApiCdkProductLike(product);
}

export function isShopApiOffer(offer: Pick<RawOffer, "sourceId" | "sourceName" | "sourceStoreName" | "tags">): boolean {
  const haystack = [
    offer.sourceId || "",
    offer.sourceName || "",
    offer.sourceStoreName || "",
    ...(Array.isArray(offer.tags) ? offer.tags : []),
  ].join(" ").toLowerCase();

  return /shopapi|shop api|shop-api|liandong|链动|鏈動|ldxp/.test(haystack);
}

export type OfferRiskHint = {
  id: "feedback_risk";
  label: "提示与风险";
  detail: string;
  tone: "warn";
};

export function getOfferRiskHints(offer: RawOffer): OfferRiskHint[] {
  if (!offer.riskFeedback?.count) return [];

  const scopeLabel = offer.riskFeedback.scope === "source"
    ? "该店铺"
    : offer.riskFeedback.scope === "mixed"
      ? "该报价或店铺"
      : "该报价";

  return [{
    id: "feedback_risk",
    label: "提示与风险",
    detail: `${scopeLabel}已有用户反馈问题，购买前请先查看原店铺详情并联系商家确认。`,
    tone: "warn",
  }];
}

export function isHighRiskOutboundOffer(offer: RawOffer): boolean {
  return !isShopApiOffer(offer) || isHighPriceOffer(offer);
}

function isHighPriceOffer(offer: Pick<RawOffer, "price">): boolean {
  return typeof offer.price === "number" && Number.isFinite(offer.price) && offer.price >= OFFER_HIGH_RISK_PRICE_THRESHOLD;
}

function truthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
