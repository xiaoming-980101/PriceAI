import "server-only";

import { getRiskReviewRuntimeConfig, type RiskReviewRuntimeConfig } from "@/lib/risk-review-settings";
import {
  AFTERSALES_FEEDBACK_REASON,
  HIGH_RISK_FEEDBACK_REASONS,
  RISK_PRECHECK_PUBLIC_TTL_HOURS,
  getPublicRiskPrecheck,
  type RiskPrecheckCategory,
  type RiskPrecheckScope,
} from "@/lib/trust-risk";
import type { OfferFeedbackReason, OfferFeedbackUserExpectedAction, OfferStatus } from "@/lib/types";

export type RiskFeedbackReviewInput = {
  id: string;
  productName?: string | null;
  offerId?: string | null;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceTitle?: string | null;
  offerUrl?: string | null;
  offerPrice?: number | null;
  offerStatus?: OfferStatus | null;
  reason: OfferFeedbackReason;
  userExpectedAction: OfferFeedbackUserExpectedAction;
  evidenceText?: string | null;
  evidenceUrls?: string[] | null;
  notes?: string | null;
  submitterIp?: string | null;
};

export type RiskFeedbackReviewResult = {
  status: "ready" | "skipped" | "failed";
  provider: string;
  model: string;
  reviewedAt: string;
  canShowPublicly: boolean;
  riskLevel: "low" | "medium" | "high";
  riskScope: RiskPrecheckScope;
  riskCategory: RiskPrecheckCategory;
  confidence: number;
  abuseRisk: "low" | "medium" | "high";
  evidenceQuality: "none" | "low" | "medium" | "high";
  publicSummary: string;
  privateReason: string;
  expiresAt: string | null;
  error?: string;
};

type ModelRiskReviewJson = {
  risk_level?: string;
  risk_scope?: string;
  risk_category?: string;
  confidence?: number;
  abuse_risk?: string;
  evidence_quality?: string;
  can_show_publicly?: boolean;
  public_summary?: string;
  private_reason?: string;
  expires_in_hours?: number;
};

const RISK_REVIEW_PROVIDER = "opencode";

export function shouldRunRiskPrecheck(input: Pick<RiskFeedbackReviewInput, "reason" | "evidenceText" | "evidenceUrls">): boolean {
  if (!HIGH_RISK_FEEDBACK_REASONS.has(input.reason)) return false;
  return Boolean(input.evidenceText?.trim() || input.evidenceUrls?.length);
}

export function buildSkippedRiskPrecheck(
  input: RiskFeedbackReviewInput,
  reason: string,
  config?: Pick<RiskReviewRuntimeConfig, "provider" | "model">,
): RiskFeedbackReviewResult {
  const reviewedAt = new Date().toISOString();
  return {
    status: "skipped",
    provider: config?.provider || RISK_REVIEW_PROVIDER,
    model: config?.model || "not_required",
    reviewedAt,
    canShowPublicly: false,
    riskLevel: "low",
    riskScope: inferFallbackRiskScope(input),
    riskCategory: normalizeRiskCategory(input.reason),
    confidence: 0,
    abuseRisk: "medium",
    evidenceQuality: evidenceQualityFromInput(input),
    publicSummary: "",
    privateReason: reason,
    expiresAt: null,
  };
}

export async function reviewRiskFeedback(input: RiskFeedbackReviewInput): Promise<RiskFeedbackReviewResult> {
  const config = await getRiskReviewRuntimeConfig();

  if (!shouldRunRiskPrecheck(input)) {
    return buildSkippedRiskPrecheck(input, "非高风险反馈或缺少证据，不进入前台临时风险预警。", config);
  }

  if (!config.apiKey) {
    return buildFailedRiskPrecheck(input, "风险预审模型 API Key 未配置。", config);
  }

  const reviewedAt = new Date().toISOString();
  const model = config.model;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: riskReviewSystemPrompt(),
          },
          {
            role: "user",
            content: JSON.stringify(buildRiskReviewPromptPayload(input)),
          },
        ],
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    const text = await response.text();
    if (!response.ok) throw new Error(`模型预审请求失败：${response.status} ${text.slice(0, 240)}`);

    const json = JSON.parse(text) as Record<string, unknown>;
    const content = extractChatCompletionContent(json);
    const parsed = parseModelRiskReviewContent(content);
    return normalizeModelRiskReview(input, parsed, reviewedAt, config);
  } catch (error) {
    return buildFailedRiskPrecheck(input, error instanceof Error ? error.message : "风险预审模型调用失败。", config);
  }
}

export function mergeRiskPrecheckResult(
  current: Record<string, unknown> | null | undefined,
  result: RiskFeedbackReviewResult,
): Record<string, unknown> {
  return {
    ...(current || {}),
    riskPrecheck: result,
  };
}

function normalizeModelRiskReview(
  input: RiskFeedbackReviewInput,
  parsed: ModelRiskReviewJson,
  reviewedAt: string,
  config: Pick<RiskReviewRuntimeConfig, "provider" | "model">,
): RiskFeedbackReviewResult {
  const riskCategory = normalizeRiskCategory(parsed.risk_category || input.reason);
  const riskScope = normalizeRiskScope(parsed.risk_scope, input);
  const confidence = clampNumber(parsed.confidence, 0, 1, 0);
  const abuseRisk = normalizeEnum(parsed.abuse_risk, ["low", "medium", "high"] as const, "medium");
  const evidenceQuality = normalizeEnum(parsed.evidence_quality, ["none", "low", "medium", "high"] as const, evidenceQualityFromInput(input));
  const publicSummary = sanitizePublicSummary(parsed.public_summary);
  const canShowPublicly = Boolean(parsed.can_show_publicly) &&
    confidence >= 0.55 &&
    abuseRisk !== "high" &&
    evidenceQuality !== "none" &&
    Boolean(publicSummary);
  const expiresInHours = clampNumber(parsed.expires_in_hours, 1, 168, RISK_PRECHECK_PUBLIC_TTL_HOURS);
  const result: RiskFeedbackReviewResult = {
    status: "ready",
    provider: config.provider,
    model: config.model,
    reviewedAt,
    canShowPublicly,
    riskLevel: normalizeEnum(parsed.risk_level, ["low", "medium", "high"] as const, input.reason === "bad_source" ? "high" : "medium"),
    riskScope,
    riskCategory,
    confidence,
    abuseRisk,
    evidenceQuality,
    publicSummary,
    privateReason: sanitizePrivateReason(parsed.private_reason),
    expiresAt: canShowPublicly ? new Date(new Date(reviewedAt).getTime() + expiresInHours * 60 * 60 * 1000).toISOString() : null,
  };

  return getPublicRiskPrecheck({ riskPrecheck: result }) ? result : { ...result, canShowPublicly: false, expiresAt: null };
}

function buildFailedRiskPrecheck(
  input: RiskFeedbackReviewInput,
  error: string,
  config?: Pick<RiskReviewRuntimeConfig, "provider" | "model">,
): RiskFeedbackReviewResult {
  const reviewedAt = new Date().toISOString();
  return {
    status: "failed",
    provider: config?.provider || RISK_REVIEW_PROVIDER,
    model: config?.model || "unconfigured",
    reviewedAt,
    canShowPublicly: false,
    riskLevel: "medium",
    riskScope: inferFallbackRiskScope(input),
    riskCategory: normalizeRiskCategory(input.reason),
    confidence: 0,
    abuseRisk: "medium",
    evidenceQuality: evidenceQualityFromInput(input),
    publicSummary: "",
    privateReason: "模型预审失败，暂不公开到前台。",
    expiresAt: null,
    error: error.slice(0, 500),
  };
}

function riskReviewSystemPrompt(): string {
  return [
    "你是 PriceAI 的用户反馈风险预审助手，不是最终裁决者。",
    "任务：判断一条高风险反馈是否可以作为前台临时风险预警展示，并生成脱敏中文摘要。",
    "严禁输出联系方式、订单号、QQ、微信、手机号、邮箱、截图原文隐私信息。",
    "不要使用骗子、跑路、诈骗犯等最终定性词。只能写“有用户反馈/购买前请确认”。",
    "如证据不足、疑似恶意同行攻击、广告、辱骂、无法判断，则 can_show_publicly=false。",
    "商家级风险要更谨慎；单条售后争议通常只给 offer 范围，渠道不可信且有证据时可给 source 范围。",
    "只返回 JSON，不要 Markdown。",
  ].join("\n");
}

function buildRiskReviewPromptPayload(input: RiskFeedbackReviewInput): Record<string, unknown> {
  return {
    feedback_id: input.id,
    product_name: input.productName || null,
    offer_id: input.offerId || null,
    source_id: input.sourceId || null,
    source_name: input.sourceName || null,
    source_title: input.sourceTitle || null,
    offer_url_host: safeUrlHost(input.offerUrl),
    offer_price: input.offerPrice ?? null,
    offer_status: input.offerStatus || null,
    reason: input.reason,
    user_expected_action: input.userExpectedAction,
    notes: input.notes || null,
    evidence_text: input.evidenceText || null,
    evidence_url_count: input.evidenceUrls?.length || 0,
    submitter_ip_present: Boolean(input.submitterIp),
    output_schema: {
      risk_level: "low | medium | high",
      risk_scope: "offer | source | mixed",
      risk_category: "fraud | bad_source | aftersales_shipping",
      confidence: "0..1",
      abuse_risk: "low | medium | high；只表示这条反馈是否像恶意举报、广告、辱骂或同行攻击，不表示商品交易风险",
      evidence_quality: "none | low | medium | high；只表示用户证据质量",
      can_show_publicly: "boolean",
      public_summary: "中文，40-120字，脱敏，不作最终裁定",
      private_reason: "中文，给管理员看的判断原因",
      expires_in_hours: "建议 24-72，最多 168",
    },
  };
}

function extractChatCompletionContent(value: Record<string, unknown>): string {
  const choices = Array.isArray(value.choices) ? value.choices : [];
  const first = choices[0];
  if (!first || typeof first !== "object") throw new Error("模型响应缺少 choices。");
  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== "object") throw new Error("模型响应缺少 message。");
  const content = (message as Record<string, unknown>).content;
  if (typeof content !== "string" || !content.trim()) throw new Error("模型响应内容为空。");
  return content.trim();
}

function parseModelRiskReviewContent(content: string): ModelRiskReviewJson {
  try {
    return JSON.parse(content) as ModelRiskReviewJson;
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (fenced) return JSON.parse(fenced) as ModelRiskReviewJson;
    const objectText = content.match(/\{[\s\S]*\}/)?.[0];
    if (objectText) return JSON.parse(objectText) as ModelRiskReviewJson;
    throw new Error("模型响应不是合法 JSON。");
  }
}

function normalizeRiskCategory(value: unknown): RiskPrecheckCategory {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (normalized.includes("source") || normalized.includes("channel") || normalized.includes("seller") || normalized.includes("store")) {
      return "bad_source";
    }
    if (
      normalized.includes("after") ||
      normalized.includes("service") ||
      normalized.includes("shipping") ||
      normalized.includes("delivery") ||
      normalized.includes("fulfillment") ||
      normalized.includes("refund")
    ) {
      return AFTERSALES_FEEDBACK_REASON;
    }
  }
  if (value === "bad_source") return "bad_source";
  if (value === AFTERSALES_FEEDBACK_REASON) return AFTERSALES_FEEDBACK_REASON;
  return "fraud";
}

function normalizeRiskScope(value: unknown, input: RiskFeedbackReviewInput): RiskPrecheckScope {
  if (value === "source" || value === "mixed" || value === "offer") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["seller", "store", "merchant", "channel"].includes(normalized)) return "source";
    if (["item", "product", "listing", "goods"].includes(normalized)) return "offer";
    if (["both", "seller_and_offer", "source_and_offer"].includes(normalized)) return "mixed";
  }
  return inferFallbackRiskScope(input);
}

function inferFallbackRiskScope(input: Pick<RiskFeedbackReviewInput, "reason" | "userExpectedAction">): RiskPrecheckScope {
  return input.reason === "bad_source" || input.userExpectedAction === "hide_source" ? "source" : "offer";
}

function evidenceQualityFromInput(input: Pick<RiskFeedbackReviewInput, "evidenceText" | "evidenceUrls">): "none" | "low" | "medium" | "high" {
  if (input.evidenceUrls?.length) return "medium";
  const textLength = input.evidenceText?.trim().length || 0;
  if (textLength >= 80) return "medium";
  if (textLength >= 8) return "low";
  return "none";
}

function sanitizePublicSummary(value: unknown): string {
  if (typeof value !== "string") return "";
  return sanitizeRiskText(value).slice(0, 160);
}

function sanitizePrivateReason(value: unknown): string {
  if (typeof value !== "string") return "模型未提供判断原因。";
  return sanitizeRiskText(value).slice(0, 500);
}

function sanitizeRiskText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/(微信|VX|QQ|手机号|电话|邮箱|订单号)[:：]?\s*[A-Za-z0-9_@.+-]{4,}/gi, "$1已脱敏")
    .replace(/骗子|诈骗犯|跑路/gi, "存在风险")
    .trim();
}

function safeUrlHost(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function normalizeEnum<const T extends readonly string[]>(value: unknown, options: T, fallback: T[number]): T[number] {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (options.includes(normalized as T[number])) return normalized as T[number];
    if (normalized.includes("none") || normalized.includes("empty") || normalized.includes("missing")) {
      const none = "none" as T[number];
      if (options.includes(none)) return none;
    }
    if (normalized.includes("low") || normalized.includes("weak") || normalized.includes("potential")) {
      const low = "low" as T[number];
      if (options.includes(low)) return low;
    }
    if (normalized.includes("medium") || normalized.includes("moderate") || normalized.includes("user_report")) {
      const medium = "medium" as T[number];
      if (options.includes(medium)) return medium;
    }
    if (normalized.includes("high") || normalized.includes("strong") || normalized.includes("scam")) {
      const high = "high" as T[number];
      if (options.includes(high)) return high;
    }
  }
  return options.includes(value as T[number]) ? value as T[number] : fallback;
}
