import "server-only";

import { clearTransitStationsCache } from "@/lib/api-transit-db";
import type {
  ApiTransitAdminData,
  ApiTransitAdminLoadError,
  ApiTransitAdminMetrics,
  ApiTransitAdminOffer,
  ApiTransitAdminRun,
  ApiTransitAdminStation,
  ApiTransitAdminSubmission,
  ApiTransitCollectionStatus,
  ApiTransitDataStatus,
  ApiTransitOfferStatus,
  ApiTransitParseStatus,
  ApiTransitProbeStatus,
  ApiTransitRunStatus,
  ApiTransitStationStatus,
  ApiTransitSubmissionReviewStatus,
  ApiTransitSubmissionType,
  ApiTransitUsageAdvice,
} from "@/lib/api-transit-admin-types";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase";

const ADMIN_STATION_LIMIT = 80;
const ADMIN_OFFER_LIMIT = 600;
const ADMIN_SUBMISSION_LIMIT = 120;
const ADMIN_RUN_LIMIT = 60;

type DbRow = Record<string, unknown>;

export async function getApiTransitAdminData(input: {
  isAuthenticated: boolean;
}): Promise<ApiTransitAdminData> {
  if (!input.isAuthenticated) return getEmptyApiTransitAdminData(false);

  const supabase = getSupabaseServerClient();
  if (!supabase) return getEmptyApiTransitAdminData(true, "Supabase 尚未配置。");

  const loadErrors: ApiTransitAdminLoadError[] = [];
  const [stations, offers, submissions, runs] = await Promise.all([
    adminLoad("stations", "中转站", listAdminTransitStations(), [], loadErrors),
    adminLoad("offers", "中转站报价", listAdminTransitOffers(), [], loadErrors),
    adminLoad("submissions", "中转站提交", listAdminTransitSubmissions(), [], loadErrors),
    adminLoad("runs", "中转站检测记录", listAdminTransitRuns(), [], loadErrors),
  ]);

  return {
    isAuthenticated: true,
    configured: true,
    generatedAt: new Date().toISOString(),
    loadErrors,
    metrics: buildMetrics(stations, offers, submissions, runs),
    stations,
    offers,
    submissions,
    runs,
  };
}

export function getEmptyApiTransitAdminData(
  isAuthenticated = false,
  message?: string,
): ApiTransitAdminData {
  return {
    isAuthenticated,
    configured: isSupabaseConfigured(),
    generatedAt: new Date().toISOString(),
    loadErrors: message ? [{ key: "supabase", label: "Supabase", message }] : [],
    metrics: {
      totalStations: 0,
      publishedStations: 0,
      pendingStations: 0,
      totalOffers: 0,
      activeOffers: 0,
      pendingOffers: 0,
      pendingSubmissions: 0,
      successfulRuns: 0,
      failedRuns: 0,
    },
    stations: [],
    offers: [],
    submissions: [],
    runs: [],
  };
}

export async function updateApiTransitStation(input: {
  id: string;
  published?: boolean;
  dataStatus?: ApiTransitDataStatus;
  usageAdvice?: ApiTransitUsageAdvice;
  status?: ApiTransitStationStatus;
  adminNote?: string | null;
}): Promise<ApiTransitAdminStation> {
  const supabase = getSupabaseOrThrow();
  const row: DbRow = {
    last_updated_at: new Date().toISOString(),
  };

  if (typeof input.published === "boolean") row.published = input.published;
  if (input.dataStatus) row.data_status = input.dataStatus;
  if (input.usageAdvice) row.usage_advice = input.usageAdvice;
  if (input.status) row.status = input.status;
  if (input.adminNote !== undefined) row.admin_note = cleanNullable(input.adminNote);

  const { data, error } = await supabase
    .from("api_transit_stations")
    .update(row)
    .eq("id", input.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("中转站不存在。");

  clearTransitStationsCache();
  const stats = await getOfferStatsByStationIds([input.id]);
  const latestRuns = await getLatestRunsByStationIds([input.id]);
  return mapStation(data as DbRow, stats.get(input.id), latestRuns.get(input.id));
}

export async function updateApiTransitOffers(input: {
  ids: string[];
  status: ApiTransitOfferStatus;
}): Promise<{ updatedCount: number }> {
  const ids = uniqueText(input.ids);
  if (!ids.length) return { updatedCount: 0 };

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_offers")
    .update({ status: input.status })
    .in("id", ids)
    .select("id");

  if (error) throw error;
  clearTransitStationsCache();
  return { updatedCount: dbRows(data).length };
}

export async function publishApiTransitStationWithOffers(input: {
  stationId: string;
  offerIds?: string[];
}): Promise<{ station: ApiTransitAdminStation; updatedOfferCount: number }> {
  const station = await updateApiTransitStation({
    id: input.stationId,
    published: true,
    dataStatus: "verified",
    status: "active",
    usageAdvice: "try_small",
  });

  let offerIds = uniqueText(input.offerIds || []);
  if (!offerIds.length) {
    offerIds = await listOfferIdsForStation(input.stationId, "needs_review");
  }
  const result = await updateApiTransitOffers({ ids: offerIds, status: "active" });
  return { station, updatedOfferCount: result.updatedCount };
}

export async function updateApiTransitSubmission(input: {
  id: string;
  reviewStatus: ApiTransitSubmissionReviewStatus;
  stationId?: string | null;
  adminNote?: string | null;
}): Promise<ApiTransitAdminSubmission> {
  const supabase = getSupabaseOrThrow();
  const row: DbRow = {
    review_status: input.reviewStatus,
    admin_note: cleanNullable(input.adminNote),
  };
  if (input.stationId !== undefined) row.station_id = cleanNullable(input.stationId);

  const { data, error } = await supabase
    .from("api_transit_submissions")
    .update(row)
    .eq("id", input.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("提交记录不存在。");
  return mapSubmission(data as DbRow);
}

async function listAdminTransitStations(): Promise<ApiTransitAdminStation[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_stations")
    .select("*")
    .order("published", { ascending: true })
    .order("last_collected_at", { ascending: false })
    .limit(ADMIN_STATION_LIMIT);

  if (error) throw error;

  const rows = dbRows(data);
  const stationIds = rows.map((row) => stringValue(row.id)).filter(Boolean);
  const [stats, latestRuns] = await Promise.all([
    getOfferStatsByStationIds(stationIds),
    getLatestRunsByStationIds(stationIds),
  ]);

  return rows.map((row) => {
    const stationId = stringValue(row.id);
    return mapStation(row, stats.get(stationId), latestRuns.get(stationId));
  });
}

async function listAdminTransitOffers(): Promise<ApiTransitAdminOffer[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_offers")
    .select(
      [
        "id",
        "station_id",
        "family",
        "standard_model",
        "raw_model_name",
        "group_name",
        "recharge_ratio",
        "model_multiplier",
        "input_price",
        "output_price",
        "cache_read_price",
        "cache_write_price",
        "currency",
        "account_pool",
        "channel_type",
        "price_source",
        "source_url",
        "last_verified_at",
        "status",
        "created_at",
        "updated_at",
        "api_transit_stations(name,published)",
      ].join(",")
    )
    .order("status", { ascending: false })
    .order("last_verified_at", { ascending: false })
    .limit(ADMIN_OFFER_LIMIT);

  if (error) throw error;
  return dbRows(data).map(mapOffer);
}

async function listAdminTransitSubmissions(): Promise<ApiTransitAdminSubmission[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ADMIN_SUBMISSION_LIMIT);

  if (error) throw error;
  return dbRows(data).map(mapSubmission);
}

async function listAdminTransitRuns(): Promise<ApiTransitAdminRun[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_detection_runs")
    .select("*, api_transit_stations(name)")
    .order("started_at", { ascending: false })
    .limit(ADMIN_RUN_LIMIT);

  if (error) throw error;
  return dbRows(data).map(mapRun);
}

async function listOfferIdsForStation(
  stationId: string,
  status?: ApiTransitOfferStatus,
): Promise<string[]> {
  const supabase = getSupabaseOrThrow();
  let query = supabase
    .from("api_transit_offers")
    .select("id")
    .eq("station_id", stationId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return dbRows(data).map((row) => stringValue(row.id)).filter(Boolean);
}

async function getOfferStatsByStationIds(stationIds: string[]): Promise<Map<string, OfferStats>> {
  const ids = uniqueText(stationIds);
  const stats = new Map<string, OfferStats>();
  if (!ids.length) return stats;

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_offers")
    .select("station_id,status")
    .in("station_id", ids);

  if (error) throw error;

  for (const row of dbRows(data)) {
    const stationId = stringValue(row.station_id);
    if (!stationId) continue;
    const current = stats.get(stationId) || { total: 0, active: 0, pending: 0, inactive: 0 };
    current.total += 1;
    const status = offerStatus(row.status);
    if (status === "active") current.active += 1;
    else if (status === "inactive") current.inactive += 1;
    else current.pending += 1;
    stats.set(stationId, current);
  }

  return stats;
}

async function getLatestRunsByStationIds(stationIds: string[]): Promise<Map<string, ApiTransitAdminRun>> {
  const ids = uniqueText(stationIds);
  const latestRuns = new Map<string, ApiTransitAdminRun>();
  if (!ids.length) return latestRuns;

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("api_transit_detection_runs")
    .select("*, api_transit_stations(name)")
    .in("station_id", ids)
    .order("started_at", { ascending: false });

  if (error) throw error;

  for (const row of dbRows(data)) {
    const stationId = stringValue(row.station_id);
    if (!stationId || latestRuns.has(stationId)) continue;
    latestRuns.set(stationId, mapRun(row));
  }

  return latestRuns;
}

async function adminLoad<T>(
  key: string,
  label: string,
  promise: Promise<T>,
  fallback: T,
  loadErrors: ApiTransitAdminLoadError[],
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    loadErrors.push({
      key,
      label,
      message: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

type OfferStats = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
};

function mapStation(
  row: DbRow,
  stats?: OfferStats,
  latestRun?: ApiTransitAdminRun,
): ApiTransitAdminStation {
  const stationStats = stats || { total: 0, active: 0, pending: 0, inactive: 0 };
  return {
    id: stringValue(row.id),
    slug: stringValue(row.slug),
    name: stringValue(row.name),
    websiteUrl: stringValue(row.website_url),
    apiBaseUrl: nullableString(row.api_base_url),
    pricingUrl: nullableString(row.pricing_url || row.pricing_endpoint_url),
    status: stationStatus(row.status),
    sourceType: stringValue(row.source_type) || "manual_collected",
    commercialRelation: stringValue(row.commercial_relation) || "unknown",
    summary: stringValue(row.summary),
    channelTypes: stringArray(row.channel_types),
    accountPools: stringArray(row.account_pools),
    riskLabels: stringArray(row.risk_labels),
    usageAdvice: usageAdvice(row.usage_advice),
    dataStatus: dataStatus(row.data_status),
    collectorKind: stringValue(row.collector_kind) || "manual_review",
    collectionStatus: collectionStatus(row.collection_status),
    collectionError: nullableString(row.collection_error),
    lastCollectedAt: nullableString(row.last_collected_at),
    lastUpdatedAt: nullableString(row.last_updated_at),
    published: Boolean(row.published),
    adminNote: nullableString(row.admin_note),
    createdAt: timestampValue(row.created_at),
    updatedAt: nullableString(row.updated_at),
    offerCount: stationStats.total,
    activeOfferCount: stationStats.active,
    pendingOfferCount: stationStats.pending,
    inactiveOfferCount: stationStats.inactive,
    latestRunStatus: latestRun?.status || null,
    latestRunAt: latestRun?.finishedAt || latestRun?.startedAt || null,
  };
}

function mapOffer(row: DbRow): ApiTransitAdminOffer {
  const station = nestedRow(row.api_transit_stations);
  return {
    id: stringValue(row.id),
    stationId: stringValue(row.station_id),
    stationName: stringValue(station?.name) || stringValue(row.station_id),
    stationPublished: Boolean(station?.published),
    family: stringValue(row.family),
    standardModel: stringValue(row.standard_model),
    rawModelName: stringValue(row.raw_model_name),
    groupName: stringValue(row.group_name),
    rechargeRatio: nullableString(row.recharge_ratio),
    modelMultiplier: numberValue(row.model_multiplier),
    inputPrice: numberValue(row.input_price),
    outputPrice: numberValue(row.output_price),
    cacheReadPrice: numberValue(row.cache_read_price),
    cacheWritePrice: numberValue(row.cache_write_price),
    currency: stringValue(row.currency) || "CNY",
    accountPool: stringValue(row.account_pool) || "undisclosed",
    channelType: stringValue(row.channel_type) || "undisclosed",
    priceSource: stringValue(row.price_source) || "公开价格页",
    sourceUrl: nullableString(row.source_url),
    lastVerifiedAt: nullableString(row.last_verified_at),
    status: offerStatus(row.status),
    createdAt: timestampValue(row.created_at),
    updatedAt: nullableString(row.updated_at),
  };
}

function mapSubmission(row: DbRow): ApiTransitAdminSubmission {
  return {
    id: stringValue(row.id),
    submissionType: submissionType(row.submission_type),
    submittedUrl: stringValue(row.submitted_url),
    submittedName: nullableString(row.submitted_name),
    apiBaseUrl: nullableString(row.api_base_url),
    pricingUrl: nullableString(row.pricing_url),
    contact: nullableString(row.contact),
    notes: nullableString(row.notes),
    submittedModels: stringArray(row.submitted_models),
    parseStatus: parseStatus(row.parse_status),
    probeStatus: probeStatus(row.probe_status),
    reviewStatus: reviewStatus(row.review_status),
    stationId: nullableString(row.station_id),
    adminNote: nullableString(row.admin_note),
    createdAt: timestampValue(row.created_at),
    updatedAt: nullableString(row.updated_at),
  };
}

function mapRun(row: DbRow): ApiTransitAdminRun {
  const station = nestedRow(row.api_transit_stations);
  return {
    id: stringValue(row.id),
    stationId: nullableString(row.station_id),
    stationName: nullableString(station?.name),
    runType: stringValue(row.run_type) || "public_pricing",
    status: runStatus(row.status),
    modelCount: integerValue(row.model_count) || 0,
    offerCount: integerValue(row.offer_count) || 0,
    errorMessage: nullableString(row.error_message),
    sourceUrl: nullableString(row.source_url),
    startedAt: timestampValue(row.started_at),
    finishedAt: nullableString(row.finished_at),
  };
}

function buildMetrics(
  stations: ApiTransitAdminStation[],
  offers: ApiTransitAdminOffer[],
  submissions: ApiTransitAdminSubmission[],
  runs: ApiTransitAdminRun[],
): ApiTransitAdminMetrics {
  return {
    totalStations: stations.length,
    publishedStations: stations.filter((station) => station.published).length,
    pendingStations: stations.filter((station) => !station.published).length,
    totalOffers: offers.length,
    activeOffers: offers.filter((offer) => offer.status === "active").length,
    pendingOffers: offers.filter((offer) => offer.status === "needs_review").length,
    pendingSubmissions: submissions.filter((submission) => submission.reviewStatus === "pending").length,
    successfulRuns: runs.filter((run) => run.status === "success").length,
    failedRuns: runs.filter((run) => run.status === "failed").length,
  };
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase 尚未配置。");
  return supabase;
}

function dbRows(value: unknown): DbRow[] {
  return Array.isArray(value) ? value.filter((item): item is DbRow => Boolean(item && typeof item === "object")) : [];
}

function nestedRow(value: unknown): DbRow | null {
  if (Array.isArray(value)) return nestedRow(value[0]);
  return value && typeof value === "object" ? value as DbRow : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

function cleanNullable(value: string | null | undefined): string | null {
  const text = stringValue(value).trim();
  return text ? text : null;
}

function nullableString(value: unknown): string | null {
  const text = stringValue(value).trim();
  return text ? text : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function integerValue(value: unknown): number | null {
  const parsed = numberValue(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function timestampValue(value: unknown): string {
  return nullableString(value) || new Date().toISOString();
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => stringValue(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[,，\n|｜]+/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function uniqueText(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stationStatus(value: unknown): ApiTransitStationStatus {
  const text = stringValue(value);
  return text === "active" || text === "limited" || text === "unavailable" || text === "unknown" ? text : "unknown";
}

function dataStatus(value: unknown): ApiTransitDataStatus {
  const text = stringValue(value);
  return text === "sample" || text === "pending_review" || text === "verified" ? text : "pending_review";
}

function usageAdvice(value: unknown): ApiTransitUsageAdvice {
  const text = stringValue(value);
  return text === "try_small" || text === "cautious" || text === "not_recommended" || text === "pending" ? text : "pending";
}

function collectionStatus(value: unknown): ApiTransitCollectionStatus {
  const text = stringValue(value);
  return text === "pending" || text === "success" || text === "partial" || text === "failed" || text === "manual_review" ? text : "pending";
}

function offerStatus(value: unknown): ApiTransitOfferStatus {
  const text = stringValue(value);
  return text === "active" || text === "inactive" || text === "needs_review" ? text : "needs_review";
}

function submissionType(value: unknown): ApiTransitSubmissionType {
  return stringValue(value) === "merchant" ? "merchant" : "user";
}

function parseStatus(value: unknown): ApiTransitParseStatus {
  const text = stringValue(value);
  return text === "parsed" || text === "failed" || text === "pending" ? text : "pending";
}

function probeStatus(value: unknown): ApiTransitProbeStatus {
  const text = stringValue(value);
  return text === "public_pricing_found" || text === "needs_login" || text === "failed" || text === "pending" ? text : "pending";
}

function reviewStatus(value: unknown): ApiTransitSubmissionReviewStatus {
  const text = stringValue(value);
  return text === "collector_todo" || text === "approved" || text === "rejected" || text === "pending" ? text : "pending";
}

function runStatus(value: unknown): ApiTransitRunStatus {
  const text = stringValue(value);
  return text === "success" || text === "partial" || text === "failed" ? text : "failed";
}
