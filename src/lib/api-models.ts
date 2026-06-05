export type ApiProviderType = "official" | "router" | "free" | "subscription";

export type ApiCurrency = "CNY" | "USD";

export type ApiModelOffer = {
  id: string;
  modelName: string;
  modelFamily: string;
  providerName: string;
  providerType: ApiProviderType;
  providerUrl: string;
  pricingUrl?: string;
  billingMode: "按量计费" | "免费/测试" | "订阅套餐" | "动态路由";
  inputPrice: ApiPriceValue;
  outputPrice: ApiPriceValue;
  cachePrice?: ApiPriceValue;
  freeOrPlan: string;
  limitations: string;
  compatibility: string[];
  suitableTools: string[];
  sourceLabel: string;
  updatedAt: string;
  notes?: string;
};

export type ApiModelScope = "all" | string;

export type ApiModelFamilyOption = {
  id: string;
  label: string;
};

export type ApiModelSummary = {
  id: string;
  modelFamily: string;
  displayName: string;
  offerCount: number;
  providerCount: number;
  officialCount: number;
  freeCount: number;
  routerCount: number;
  subscriptionCount: number;
  representativeModels: string[];
  compatibility: string[];
  suitableTools: string[];
  primaryOffer: ApiModelOffer | null;
  latestUpdatedAt: string;
};

export type ApiPriceValue =
  | {
      kind: "numeric";
      usdPerMTokens?: number;
      cnyPerMTokens?: number;
      label?: string;
    }
  | {
      kind: "text";
      text: string;
    };

export const apiModelUpdatedAt = "2026-06-05";

export const apiModelFxSummary = {
  baseCurrency: "USD",
  quoteCurrency: "CNY",
  date: "2026-06-04",
  usdToCny: 6.7739,
  source: "Frankfurter",
};

export const apiProviderTypeLabels: Record<ApiProviderType, string> = {
  official: "官方 API",
  router: "模型路由",
  free: "免费/测试",
  subscription: "订阅套餐",
};

export const apiProviderTypeDescriptions: Record<ApiProviderType, string> = {
  official: "厂商官方或云厂商公开 API，适合做价格基准。",
  router: "公开模型路由平台，重点看模型覆盖、价格变化和兼容性。",
  free: "免费或测试用途入口，必须同时关注限流、排队和可用性。",
  subscription: "按月订阅的 API 套餐，需要看额度、短周期限制和折算成本。",
};

export const apiCompatibilityOptions = [
  "全部",
  "OpenAI-compatible",
  "免费/测试",
  "Coding Agent",
  "中文模型",
] as const;

export const apiModelOffers: ApiModelOffer[] = [
  {
    id: "deepseek-official-chat",
    modelName: "DeepSeek Chat / V3 系列",
    modelFamily: "DeepSeek",
    providerName: "DeepSeek 官方 API",
    providerType: "official",
    providerUrl: "https://platform.deepseek.com/",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing-details-usd",
    billingMode: "按量计费",
    inputPrice: textPrice("见官方定价页"),
    outputPrice: textPrice("见官方定价页"),
    cachePrice: textPrice("官方文档含缓存命中/写入口径"),
    freeOrPlan: "无固定免费额度，按官方账户余额与活动为准。",
    limitations: "适合做 DeepSeek 价格基准；具体限流和上下文以官方控制台为准。",
    compatibility: ["OpenAI-compatible", "中文模型"],
    suitableTools: ["Codex", "Cursor", "OpenCode", "Open WebUI"],
    sourceLabel: "DeepSeek API Docs",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "deepseek-official-reasoner",
    modelName: "DeepSeek Reasoner / R1 系列",
    modelFamily: "DeepSeek",
    providerName: "DeepSeek 官方 API",
    providerType: "official",
    providerUrl: "https://platform.deepseek.com/",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing-details-usd",
    billingMode: "按量计费",
    inputPrice: textPrice("见官方定价页"),
    outputPrice: textPrice("见官方定价页"),
    cachePrice: textPrice("官方文档含缓存命中/写入口径"),
    freeOrPlan: "无固定免费额度，适合按量调用和对照路由平台价格。",
    limitations: "推理模型成本和延迟更敏感，需按任务量单独估算。",
    compatibility: ["OpenAI-compatible", "中文模型", "Coding Agent"],
    suitableTools: ["Codex", "Cursor", "OpenCode", "Open WebUI"],
    sourceLabel: "DeepSeek API Docs",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "qwen-model-studio",
    modelName: "Qwen / 通义千问系列",
    modelFamily: "Qwen",
    providerName: "Alibaba Cloud Model Studio",
    providerType: "official",
    providerUrl: "https://www.alibabacloud.com/product/modelstudio",
    pricingUrl: "https://www.alibabacloud.com/help/en/model-studio/billing/",
    billingMode: "按量计费",
    inputPrice: textPrice("见 Model Studio 计费页"),
    outputPrice: textPrice("见 Model Studio 计费页"),
    cachePrice: textPrice("按具体模型与服务配置"),
    freeOrPlan: "可能存在新用户或活动额度，以阿里云控制台为准。",
    limitations: "模型、地域、调用方式和套餐口径较多，首版先保留官方来源。",
    compatibility: ["OpenAI-compatible", "中文模型", "Coding Agent"],
    suitableTools: ["Codex", "Cursor", "OpenCode", "Open WebUI"],
    sourceLabel: "Alibaba Cloud Billing",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "kimi-official",
    modelName: "Kimi / Moonshot 系列",
    modelFamily: "Kimi",
    providerName: "Kimi API",
    providerType: "official",
    providerUrl: "https://www.kimi.com/",
    pricingUrl: "https://www.kimi.com/zh-cn/help/kimi-api/api-pricing",
    billingMode: "按量计费",
    inputPrice: textPrice("见 Kimi API 定价"),
    outputPrice: textPrice("见 Kimi API 定价"),
    cachePrice: textPrice("按官方计费说明"),
    freeOrPlan: "新用户、试用或活动额度以官方说明为准。",
    limitations: "适合中文、长上下文相关场景；具体模型名和额度需按官方文档确认。",
    compatibility: ["OpenAI-compatible", "中文模型"],
    suitableTools: ["Open WebUI", "Cursor", "自建应用"],
    sourceLabel: "Kimi API Pricing",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "minimax-official",
    modelName: "MiniMax 系列",
    modelFamily: "MiniMax",
    providerName: "MiniMax API",
    providerType: "official",
    providerUrl: "https://www.minimax.io/",
    pricingUrl: "https://platform.minimax.io/docs/guides/pricing",
    billingMode: "按量计费",
    inputPrice: textPrice("见 MiniMax Pricing"),
    outputPrice: textPrice("见 MiniMax Pricing"),
    cachePrice: textPrice("按具体模型与能力"),
    freeOrPlan: "免费额度、活动额度和 Coding Plan 需按官方页面确认。",
    limitations: "模型和能力线较多，首版先作为正规官方渠道收录。",
    compatibility: ["OpenAI-compatible", "中文模型"],
    suitableTools: ["Cursor", "Open WebUI", "自建应用"],
    sourceLabel: "MiniMax Pricing Docs",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "openrouter-deepseek",
    modelName: "DeepSeek R1 / V3 相关模型",
    modelFamily: "DeepSeek",
    providerName: "OpenRouter",
    providerType: "router",
    providerUrl: "https://openrouter.ai/",
    pricingUrl: "https://openrouter.ai/pricing",
    billingMode: "动态路由",
    inputPrice: textPrice("随模型页动态变化"),
    outputPrice: textPrice("随模型页动态变化"),
    cachePrice: textPrice("按模型和 provider 支持情况"),
    freeOrPlan: "OpenRouter 会标记部分 free 模型，额度和限制随账号状态变化。",
    limitations: "同名模型可能有多个 provider，需看具体路由、限流和上下文。",
    compatibility: ["OpenAI-compatible", "免费/测试", "Coding Agent", "中文模型"],
    suitableTools: ["Codex", "Cursor", "OpenCode", "Open WebUI"],
    sourceLabel: "OpenRouter Pricing",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "openrouter-qwen",
    modelName: "Qwen / 通义千问相关模型",
    modelFamily: "Qwen",
    providerName: "OpenRouter",
    providerType: "router",
    providerUrl: "https://openrouter.ai/",
    pricingUrl: "https://openrouter.ai/pricing",
    billingMode: "动态路由",
    inputPrice: textPrice("随模型页动态变化"),
    outputPrice: textPrice("随模型页动态变化"),
    cachePrice: textPrice("按模型和 provider 支持情况"),
    freeOrPlan: "可能存在 free 变体或限时免费，需以模型详情页为准。",
    limitations: "路由价格和可用 provider 会变化，生产使用前需二次确认。",
    compatibility: ["OpenAI-compatible", "免费/测试", "Coding Agent", "中文模型"],
    suitableTools: ["Codex", "Cursor", "OpenCode", "Open WebUI"],
    sourceLabel: "OpenRouter Pricing",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "nvidia-nim-glm",
    modelName: "GLM / 中文开源模型相关",
    modelFamily: "GLM",
    providerName: "NVIDIA NIM",
    providerType: "free",
    providerUrl: "https://www.nvidia.com/en-us/ai-data-science/products/nim-microservices/",
    pricingUrl: "https://docs.nvidia.com/nim/large-language-models/latest/about-nim-llm/nim-offerings.html",
    billingMode: "免费/测试",
    inputPrice: textPrice("Hosted API 可免费试用"),
    outputPrice: textPrice("Hosted API 可免费试用"),
    cachePrice: textPrice("不作为长期生产价格基准"),
    freeOrPlan: "适合开发、测试、原型验证；可用模型以 NIM offerings 为准。",
    limitations: "可能排队、限速、变更模型列表，不应默认当作生产 SLA。",
    compatibility: ["免费/测试", "中文模型"],
    suitableTools: ["Open WebUI", "自建应用", "原型验证"],
    sourceLabel: "NVIDIA NIM Offerings",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "nvidia-nim-deepseek",
    modelName: "DeepSeek / 开源模型相关",
    modelFamily: "DeepSeek",
    providerName: "NVIDIA NIM",
    providerType: "free",
    providerUrl: "https://www.nvidia.com/en-us/ai-data-science/products/nim-microservices/",
    pricingUrl: "https://docs.nvidia.com/nim/large-language-models/latest/about-nim-llm/nim-offerings.html",
    billingMode: "免费/测试",
    inputPrice: textPrice("Hosted API 可免费试用"),
    outputPrice: textPrice("Hosted API 可免费试用"),
    cachePrice: textPrice("不作为长期生产价格基准"),
    freeOrPlan: "用于开发、测试和原型；模型覆盖和额度以官方页面为准。",
    limitations: "免费体验不等于长期稳定，需关注限速、排队和模型上下线。",
    compatibility: ["免费/测试", "中文模型", "Coding Agent"],
    suitableTools: ["Open WebUI", "自建应用", "原型验证"],
    sourceLabel: "NVIDIA NIM Offerings",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "opencode-zen-free",
    modelName: "DeepSeek / Qwen / MiniMax 等限免模型",
    modelFamily: "多模型",
    providerName: "OpenCode Zen",
    providerType: "free",
    providerUrl: "https://opencode.ai/",
    billingMode: "免费/测试",
    inputPrice: textPrice("限时免费或阶段性免费"),
    outputPrice: textPrice("限时免费或阶段性免费"),
    cachePrice: textPrice("以当期支持模型为准"),
    freeOrPlan: "适合尝鲜和开发测试，免费模型可能不定期调整。",
    limitations: "需标注限时、限流和可用模型变化，不建议默认当作长期稳定通道。",
    compatibility: ["免费/测试", "Coding Agent", "中文模型"],
    suitableTools: ["OpenCode", "Codex", "Cursor"],
    sourceLabel: "OpenCode Zen",
    updatedAt: apiModelUpdatedAt,
  },
  {
    id: "opencode-go-plan",
    modelName: "DeepSeek / Qwen / Kimi / GLM 等多模型",
    modelFamily: "多模型",
    providerName: "OpenCode Go",
    providerType: "subscription",
    providerUrl: "https://opencode.ai/go",
    pricingUrl: "https://dev.opencode.ai/docs/bs/go/",
    billingMode: "订阅套餐",
    inputPrice: textPrice("套餐内按用量规则消耗"),
    outputPrice: textPrice("套餐内按用量规则消耗"),
    cachePrice: textPrice("需按 Go 文档确认"),
    freeOrPlan: "首月 $5，后续 $10/月；额度、周期和模型限制需看文档。",
    limitations: "不能简单理解为无脑低价 API，需要同时看短周期限制和可用模型。",
    compatibility: ["OpenAI-compatible", "Coding Agent", "中文模型"],
    suitableTools: ["OpenCode", "Codex", "Cursor", "Claude Code"],
    sourceLabel: "OpenCode Go Docs",
    updatedAt: apiModelUpdatedAt,
    notes: "套餐金额可作为订阅入口展示，模型级输入/输出价不在 P0 中硬算。",
  },
  {
    id: "zhipu-glm-todo",
    modelName: "GLM / 智谱系列",
    modelFamily: "GLM",
    providerName: "智谱开放平台",
    providerType: "official",
    providerUrl: "https://open.bigmodel.cn/",
    billingMode: "按量计费",
    inputPrice: textPrice("待补官方价格页"),
    outputPrice: textPrice("待补官方价格页"),
    cachePrice: textPrice("待确认"),
    freeOrPlan: "规划文档中列为候选，P0 先进入待补来源队列。",
    limitations: "上线前需要补充公开定价页和模型清单，不作为已确认价格。",
    compatibility: ["中文模型", "Coding Agent"],
    suitableTools: ["Cursor", "Open WebUI", "自建应用"],
    sourceLabel: "待补官方定价来源",
    updatedAt: apiModelUpdatedAt,
  },
];

export function formatApiPrice(price: ApiPriceValue, currency: ApiCurrency) {
  if (price.kind === "text") return price.text;

  const value =
    currency === "CNY"
      ? price.cnyPerMTokens ?? (typeof price.usdPerMTokens === "number" ? price.usdPerMTokens * apiModelFxSummary.usdToCny : undefined)
      : price.usdPerMTokens ?? (typeof price.cnyPerMTokens === "number" ? price.cnyPerMTokens / apiModelFxSummary.usdToCny : undefined);
  if (typeof value !== "number") return price.label ?? "待确认";

  const prefix = currency === "CNY" ? "¥" : "$";
  return `${prefix}${value.toLocaleString("zh-CN", {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  })} / 1M tokens`;
}

export function formatUsdAmount(value: number, currency: ApiCurrency) {
  const amount = currency === "CNY" ? value * apiModelFxSummary.usdToCny : value;
  const prefix = currency === "CNY" ? "¥" : "$";
  return `${prefix}${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getApiModelFamilyOptions(): ApiModelFamilyOption[] {
  const seen = new Set<string>();

  return apiModelOffers
    .map((offer) => offer.modelFamily)
    .filter((family) => {
      if (seen.has(family)) return false;
      seen.add(family);
      return true;
    })
    .sort(compareFamilyLabel)
    .map((family) => ({
      id: apiModelFamilyId(family),
      label: family,
    }));
}

export function getApiModelSummaries(scope: ApiModelScope = "all"): ApiModelSummary[] {
  const groups = new Map<string, ApiModelOffer[]>();

  apiModelOffers.forEach((offer) => {
    const familyId = apiModelFamilyId(offer.modelFamily);
    if (scope !== "all" && familyId !== scope) return;

    groups.set(familyId, [...(groups.get(familyId) ?? []), offer]);
  });

  return Array.from(groups.entries())
    .map(([id, offers]) => buildApiModelSummary(id, offers))
    .sort((a, b) => compareFamilyLabel(a.modelFamily, b.modelFamily));
}

export function getApiModelSummary(id: string) {
  return getApiModelSummaries(id).find((summary) => summary.id === id) ?? null;
}

export function getApiModelOffers(scope: ApiModelScope = "all") {
  return apiModelOffers
    .filter((offer) => scope === "all" || apiModelFamilyId(offer.modelFamily) === scope)
    .sort((a, b) => {
      const familyDelta = compareFamilyLabel(a.modelFamily, b.modelFamily);
      if (familyDelta !== 0) return familyDelta;
      const typeDelta = providerTypeRank(a.providerType) - providerTypeRank(b.providerType);
      if (typeDelta !== 0) return typeDelta;
      return a.providerName.localeCompare(b.providerName, "zh-CN");
    });
}

export function apiModelFamilyId(family: string) {
  const mapped = apiModelFamilySlugByName[family];
  if (mapped) return mapped;

  return family
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildApiModelSummary(id: string, offers: ApiModelOffer[]): ApiModelSummary {
  const family = offers[0]?.modelFamily ?? id;
  const providerNames = new Set(offers.map((offer) => offer.providerName));
  const primaryOffer = [...offers].sort((a, b) => providerTypeRank(a.providerType) - providerTypeRank(b.providerType))[0] ?? null;

  return {
    id,
    modelFamily: family,
    displayName: `${family} 模型`,
    offerCount: offers.length,
    providerCount: providerNames.size,
    officialCount: offers.filter((offer) => offer.providerType === "official").length,
    freeCount: offers.filter((offer) => offer.providerType === "free" || offer.compatibility.includes("免费/测试")).length,
    routerCount: offers.filter((offer) => offer.providerType === "router").length,
    subscriptionCount: offers.filter((offer) => offer.providerType === "subscription").length,
    representativeModels: uniqueStrings(offers.map((offer) => offer.modelName)).slice(0, 3),
    compatibility: uniqueStrings(offers.flatMap((offer) => offer.compatibility)).slice(0, 4),
    suitableTools: uniqueStrings(offers.flatMap((offer) => offer.suitableTools)).slice(0, 4),
    primaryOffer,
    latestUpdatedAt: offers.reduce((latest, offer) => (offer.updatedAt > latest ? offer.updatedAt : latest), ""),
  };
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function providerTypeRank(type: ApiProviderType) {
  return {
    official: 0,
    router: 1,
    free: 2,
    subscription: 3,
  }[type];
}

const familyOrder = ["DeepSeek", "Qwen", "Kimi", "GLM", "MiniMax", "多模型"];

const apiModelFamilySlugByName: Record<string, string> = {
  DeepSeek: "deepseek",
  Qwen: "qwen",
  Kimi: "kimi",
  GLM: "glm",
  MiniMax: "minimax",
  多模型: "multi-model",
};

function compareFamilyLabel(a: string, b: string) {
  const aIndex = familyOrder.indexOf(a);
  const bIndex = familyOrder.indexOf(b);

  if (aIndex !== -1 || bIndex !== -1) {
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  }

  return a.localeCompare(b, "zh-CN");
}

function textPrice(text: string): ApiPriceValue {
  return { kind: "text", text };
}
