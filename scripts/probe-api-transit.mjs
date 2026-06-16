#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { safeFetch } from "./safe-fetch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "config", "api-transit-probes.json");
const envPath = path.join(repoRoot, ".env.local");

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_TARGET_LIMIT = 4;
const MAX_MODELS_SNAPSHOT = 200;
const userAgent = "Mozilla/5.0 PriceAI/1.0 APITransitProbe";
let cachedFileEnv = null;

const defaultTargets = [
  {
    family: "claude",
    standardModel: "Claude Sonnet 4.6",
    candidates: [
      "claude-sonnet-4.6",
      "claude-sonnet-4-6",
      "claude-4.6-sonnet",
      "claude-4-sonnet",
      "claude-sonnet-4",
    ],
    keywords: ["claude", "sonnet"],
  },
  {
    family: "claude",
    standardModel: "Claude Opus 4.6",
    candidates: [
      "claude-opus-4.6",
      "claude-opus-4-6",
      "claude-4.6-opus",
      "claude-opus-4",
    ],
    keywords: ["claude", "opus"],
  },
  {
    family: "claude",
    standardModel: "Claude Opus 4.7",
    candidates: ["claude-opus-4.7", "claude-opus-4-7", "claude-4.7-opus"],
    keywords: ["claude", "opus", "4.7"],
  },
  {
    family: "claude",
    standardModel: "Claude Opus 4.8",
    candidates: ["claude-opus-4.8", "claude-opus-4-8", "claude-4.8-opus"],
    keywords: ["claude", "opus", "4.8"],
  },
  {
    family: "gpt",
    standardModel: "GPT 5.5",
    candidates: ["gpt-5.5", "gpt-5-5"],
    keywords: ["gpt", "5.5"],
  },
  {
    family: "gpt",
    standardModel: "GPT 5.4",
    candidates: ["gpt-5.4", "gpt-5-4"],
    keywords: ["gpt", "5.4"],
  },
];

if (isCli()) {
  const options = normalizeOptions(parseArgs(process.argv.slice(2)));

  try {
    const result = await probeApiTransitStations(options);
    printSummary(result);
    if (options.dryRun || options.verbose) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(errorMessage(error));
    process.exit(1);
  }
}

export async function probeApiTransitStations(options = {}) {
  options = normalizeOptions(options);
  const startedAt = new Date().toISOString();
  const profiles = selectProfiles(loadProbeProfiles(), options);
  const supabase = getSupabaseClient();
  const dbOfferModels = supabase ? await listOfferModels(supabase, profiles.map((profile) => profile.stationId)) : new Map();
  const runs = [];
  const rollups = [];
  const skipped = [];

  for (const profile of profiles) {
    if (!profile.enabled) {
      skipped.push(buildSkippedProfile(profile, "profile_disabled"));
      continue;
    }

    const apiKey = options.env?.[profile.apiKeyEnv] || envValue(profile.apiKeyEnv);
    if (!apiKey) {
      skipped.push(buildSkippedProfile(profile, "missing_api_key"));
      continue;
    }

    const run = await probeProfile(profile, {
      apiKey,
      offerModels: dbOfferModels.get(profile.stationId) || [],
      targetLimit: options.targetLimit,
      skipCompletions: options.skipCompletions,
      timeoutMs: options.timeoutMs,
    });

    runs.push(run);

    if ((options.post || options.db) && !options.dryRun) {
      if (!supabase) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for --post/--db.");
      await upsertRows(supabase, "api_transit_detection_runs", [run.row], { onConflict: "id" });
      rollups.push(await refreshAvailabilityRollup(supabase, profile.stationId));
    }
  }

  return {
    dryRun: Boolean(options.dryRun),
    post: Boolean(options.post || options.db),
    source: "api_transit_api_probe",
    startedAt,
    finishedAt: new Date().toISOString(),
    counts: {
      profiles: profiles.length,
      probed: runs.length,
      skipped: skipped.length,
      successfulRuns: runs.filter((run) => run.row.status === "success").length,
      failedRuns: runs.filter((run) => run.row.status === "failed").length,
    },
    skipped,
    runs,
    rollups,
  };
}

async function probeProfile(profile, options) {
  const startedAt = new Date().toISOString();
  const baseUrl = normalizeApiBaseUrl(profile.apiBaseUrl);
  const modelList = await probeModelList(profile, baseUrl, options);
  const availableModels = modelList.ok ? modelList.models : [];
  const targets = selectProbeTargets({
    configuredTargets: profile.targets || [],
    offerModels: options.offerModels,
    availableModels,
    targetLimit: options.targetLimit,
  });

  const targetResults = [];
  if (modelList.ok && !options.skipCompletions) {
    for (const target of targets) {
      if (!target.modelId) {
        targetResults.push({
          family: target.family,
          standardModel: target.standardModel,
          configuredModelId: null,
          ok: false,
          skipped: true,
          errorType: "model_not_found",
          message: "模型列表中未匹配到可探测模型。",
          latencyMs: null,
          checkedAt: new Date().toISOString(),
        });
        continue;
      }

      targetResults.push(await probeCompletion(profile, baseUrl, target, options));
    }
  }

  const attemptedTargetResults = targetResults.filter((item) => !item.skipped);
  const okTargets = attemptedTargetResults.filter((item) => item.ok).length;
  const status = runStatus({
    modelListOk: modelList.ok,
    modelCount: availableModels.length,
    attemptedTargets: attemptedTargetResults.length,
    okTargets,
    skippedTargets: targetResults.length - attemptedTargetResults.length,
    skipCompletions: options.skipCompletions,
  });
  const firstError =
    modelList.ok
      ? targetResults.find((item) => item.message)?.message || null
      : modelList.message || "模型列表探测失败。";

  const finishedAt = new Date().toISOString();
  const row = {
    id: stableId("api-transit-probe-run", profile.stationId, startedAt),
    station_id: profile.stationId,
    run_type: "api_probe",
    status,
    model_count: availableModels.length,
    offer_count: attemptedTargetResults.length,
    error_message: status === "success" ? null : firstError,
    source_url: baseUrl,
    started_at: startedAt,
    finished_at: finishedAt,
    raw_snapshot: {
      protocol: profile.protocol,
      apiKeyEnv: profile.apiKeyEnv,
      modelList: {
        ok: modelList.ok,
        status: modelList.status,
        latencyMs: modelList.latencyMs,
        message: modelList.message,
      },
      availableModelIds: availableModels.slice(0, MAX_MODELS_SNAPSHOT),
      targetResults,
    },
    logs: {
      protocol: profile.protocol,
      apiKeyEnv: profile.apiKeyEnv,
      selectedTargets: targets,
      targetLimit: options.targetLimit,
      skipCompletions: Boolean(options.skipCompletions),
    },
  };

  return {
    stationId: profile.stationId,
    status,
    modelCount: row.model_count,
    attemptedTargets: row.offer_count,
    okTargets,
    startedAt,
    finishedAt,
    row,
  };
}

async function probeModelList(profile, baseUrl, options) {
  const started = Date.now();
  try {
    const response = await fetchJson(`${baseUrl}/models`, {
      timeoutMs: options.timeoutMs,
      headers: authHeaders(profile, options.apiKey),
    });
    return {
      ok: true,
      status: response.status,
      latencyMs: Date.now() - started,
      models: normalizeModelIds(response.json),
      message: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: error.status || null,
      latencyMs: Date.now() - started,
      models: [],
      message: errorMessage(error),
    };
  }
}

async function probeCompletion(profile, baseUrl, target, options) {
  const started = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const endpoint = profile.protocol === "anthropic_compatible" ? `${baseUrl}/messages` : `${baseUrl}/chat/completions`;
    const response = await fetchJson(endpoint, {
      timeoutMs: options.timeoutMs,
      method: "POST",
      headers: {
        ...authHeaders(profile, options.apiKey),
        "content-type": "application/json",
      },
      body: JSON.stringify(completionBody(profile, target.modelId)),
    });

    return {
      family: target.family,
      standardModel: target.standardModel,
      configuredModelId: target.modelId,
      ok: true,
      skipped: false,
      status: response.status,
      errorType: null,
      message: null,
      latencyMs: Date.now() - started,
      checkedAt,
    };
  } catch (error) {
    return {
      family: target.family,
      standardModel: target.standardModel,
      configuredModelId: target.modelId,
      ok: false,
      skipped: false,
      status: error.status || null,
      errorType: classifyProbeError(error),
      message: errorMessage(error),
      latencyMs: Date.now() - started,
      checkedAt,
    };
  }
}

function selectProbeTargets(input) {
  const configuredTargets = normalizeConfiguredTargets(input.configuredTargets);
  const dbTargets = normalizeDbTargets(input.offerModels);
  const merged = [...configuredTargets, ...dbTargets, ...defaultTargets];
  const byStandardModel = new Map();

  for (const target of merged) {
    if (!target.standardModel || byStandardModel.has(target.standardModel)) continue;
    byStandardModel.set(target.standardModel, {
      family: target.family,
      standardModel: target.standardModel,
      modelId: matchAvailableModel(input.availableModels, target),
      candidates: target.candidates || [],
      keywords: target.keywords || [],
    });
  }

  return Array.from(byStandardModel.values()).slice(0, input.targetLimit || DEFAULT_TARGET_LIMIT);
}

function normalizeConfiguredTargets(targets) {
  if (!Array.isArray(targets)) return [];
  return targets
    .map((target) => ({
      family: normalizeFamily(target.family || target.standardModel),
      standardModel: String(target.standardModel || ""),
      candidates: stringArray(target.candidates || target.modelIds),
      keywords: stringArray(target.keywords),
    }))
    .filter((target) => target.family && target.standardModel);
}

function normalizeDbTargets(offerModels) {
  if (!Array.isArray(offerModels)) return [];
  return offerModels
    .map((offer) => ({
      family: normalizeFamily(offer.family || offer.standard_model || offer.standardModel),
      standardModel: String(offer.standard_model || offer.standardModel || ""),
      candidates: stringArray([offer.raw_model_name, offer.rawModelName]),
      keywords: keywordsForStandardModel(offer.standard_model || offer.standardModel),
    }))
    .filter((target) => target.family && target.standardModel);
}

function matchAvailableModel(availableModels, target) {
  const models = availableModels.map((model) => String(model || "")).filter(Boolean);
  if (!models.length) return target.candidates?.[0] || null;

  for (const candidate of target.candidates || []) {
    const exact = models.find((model) => normalizeModelId(model) === normalizeModelId(candidate));
    if (exact) return exact;
  }

  for (const candidate of target.candidates || []) {
    const fuzzy = models.find((model) => normalizeModelId(model).includes(normalizeModelId(candidate)));
    if (fuzzy) return fuzzy;
  }

  const keywords = target.keywords || keywordsForStandardModel(target.standardModel);
  if (keywords.length) {
    const keywordMatch = models.find((model) => {
      const normalized = normalizeModelId(model);
      return keywords.every((keyword) => normalized.includes(normalizeModelId(keyword)));
    });
    if (keywordMatch) return keywordMatch;
  }

  return null;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));

  try {
    const response = await safeFetch(url, {
      method: options.method || "GET",
      signal: controller.signal,
      headers: {
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
        "user-agent": userAgent,
        ...(options.headers || {}),
      },
      body: options.body,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      const error = new Error(extractErrorMessage(json) || `HTTP ${response.status}`);
      error.status = response.status;
      error.body = safeTextPreview(text);
      throw error;
    }

    return { status: response.status, json };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("请求超时。");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function completionBody(profile, modelId) {
  if (profile.protocol === "anthropic_compatible") {
    return {
      model: modelId,
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    };
  }

  return {
    model: modelId,
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 1,
    temperature: 0,
    stream: false,
  };
}

function authHeaders(profile, apiKey) {
  if (profile.protocol === "anthropic_compatible") {
    return {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  return {
    authorization: `Bearer ${apiKey}`,
  };
}

async function refreshAvailabilityRollup(supabase, stationId) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("api_transit_detection_runs")
    .select("started_at,finished_at,raw_snapshot")
    .eq("station_id", stationId)
    .eq("run_type", "api_probe")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(300);

  if (error) throw error;

  const stationSamples = [];
  const samplesByModel = new Map();
  let lastCheckedAt = null;

  for (const row of dbRows(data)) {
    const checkedAt = stringValue(row.finished_at || row.started_at);
    if (checkedAt && (!lastCheckedAt || checkedAt > lastCheckedAt)) lastCheckedAt = checkedAt;

    const snapshot = row.raw_snapshot && typeof row.raw_snapshot === "object" ? row.raw_snapshot : {};
    const targetResults = Array.isArray(snapshot.targetResults) ? snapshot.targetResults : [];
    const attemptedTargets = targetResults.filter((item) => item && typeof item === "object" && !item.skipped);

    if (attemptedTargets.length) {
      for (const item of attemptedTargets) {
        const sample = { ok: Boolean(item.ok), checkedAt };
        stationSamples.push(sample);
        const standardModel = stringValue(item.standardModel);
        if (!standardModel) continue;
        const existing = samplesByModel.get(standardModel) || [];
        existing.push(sample);
        samplesByModel.set(standardModel, existing);
      }
      continue;
    }

    const modelList = snapshot.modelList && typeof snapshot.modelList === "object" ? snapshot.modelList : null;
    if (modelList) stationSamples.push({ ok: Boolean(modelList.ok), checkedAt });
  }

  const stationAvailability = summarizeSamples(stationSamples);
  await supabase
    .from("api_transit_stations")
    .update({
      availability_seven_day_rate: stationAvailability.rate,
      availability_seven_day_samples: stationAvailability.samples,
      availability_last_checked_at: lastCheckedAt,
      availability_note: availabilityNote("站点", stationAvailability),
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", stationId);

  const offerRollups = [];
  for (const [standardModel, samples] of samplesByModel.entries()) {
    const availability = summarizeSamples(samples);
    const { error: offerError } = await supabase
      .from("api_transit_offers")
      .update({
        availability_seven_day_rate: availability.rate,
        availability_seven_day_samples: availability.samples,
        availability_last_checked_at: lastCheckedAt,
        availability_note: availabilityNote(standardModel, availability),
      })
      .eq("station_id", stationId)
      .eq("standard_model", standardModel);
    if (offerError) throw offerError;
    offerRollups.push({ standardModel, ...availability });
  }

  return {
    stationId,
    station: stationAvailability,
    offers: offerRollups,
    lastCheckedAt,
  };
}

function summarizeSamples(samples) {
  const valid = samples.filter((sample) => sample && typeof sample.ok === "boolean");
  const success = valid.filter((sample) => sample.ok).length;
  return {
    rate: valid.length ? round(success / valid.length, 4) : null,
    samples: valid.length,
    success,
  };
}

function availabilityNote(label, availability) {
  if (!availability.samples) return "暂无 PriceAI API Key 可用性探测样本。";
  return `PriceAI API Key 探测：近 7 日 ${label} ${availability.success}/${availability.samples} 个样本成功。`;
}

async function listOfferModels(supabase, stationIds) {
  const output = new Map();
  const ids = stationIds.filter(Boolean);
  if (!ids.length) return output;

  const { data, error } = await supabase
    .from("api_transit_offers")
    .select("station_id,family,standard_model,raw_model_name,status")
    .in("station_id", ids)
    .in("status", ["active", "needs_review"]);

  if (error) throw error;

  for (const row of dbRows(data)) {
    const stationId = stringValue(row.station_id);
    if (!stationId) continue;
    const existing = output.get(stationId) || [];
    existing.push(row);
    output.set(stationId, existing);
  }

  return output;
}

async function upsertRows(supabase, table, rows, options = {}) {
  for (const chunk of chunks(rows, 300)) {
    if (!chunk.length) continue;
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) {
      error.table = table;
      throw error;
    }
  }
}

function loadProbeProfiles() {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function selectProfiles(profiles, options) {
  const ids = optionList(options.station || options.stationId || options.source || options.sources);
  const selected = ids.length ? profiles.filter((profile) => ids.includes(profile.stationId)) : profiles;
  if (!selected.length) throw new Error("No API transit probe profiles matched.");
  return selected;
}

function getSupabaseClient() {
  const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function envValue(name) {
  if (!name) return "";
  if (process.env[name]) return process.env[name];
  const fileEnv = readEnvFile(envPath);
  return fileEnv[name] || "";
}

function readEnvFile(filePath) {
  if (cachedFileEnv) return cachedFileEnv;

  const output = {};
  if (!existsSync(filePath)) {
    cachedFileEnv = output;
    return output;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    output[match[1]] = unquote(match[2].trim());
  }

  cachedFileEnv = output;
  return output;
}

function unquote(value) {
  const quote = value[0];
  if ((quote === `"` || quote === `'`) && value[value.length - 1] === quote) {
    return value.slice(1, -1);
  }
  return value;
}

function normalizeApiBaseUrl(value) {
  const text = String(value || "").trim().replace(/\/+$/, "");
  if (!text) throw new Error("API base URL is required.");
  return text.endsWith("/v1") ? text : `${text}/v1`;
}

function normalizeModelIds(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data.map((item) => item?.id || item?.name || item).map(String).filter(Boolean);
  }
  if (Array.isArray(payload?.models)) {
    return payload.models.map((item) => item?.id || item?.name || item).map(String).filter(Boolean);
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => item?.id || item?.name || item).map(String).filter(Boolean);
  }
  return [];
}

function extractErrorMessage(json) {
  if (!json || typeof json !== "object") return null;
  const error = json.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") return stringValue(error.message || error.type || error.code) || null;
  return stringValue(json.message || json.msg || json.error_message) || null;
}

function safeTextPreview(text) {
  const value = String(text || "");
  return value.length > 500 ? `${value.slice(0, 500)}...` : value;
}

function classifyProbeError(error) {
  const status = Number(error?.status);
  const message = errorMessage(error).toLowerCase();
  if (status === 401 || status === 403) return "auth";
  if (status === 404 || message.includes("model")) return "model_unavailable";
  if (status === 429) return "rate_limited";
  if (message.includes("timeout") || message.includes("超时")) return "timeout";
  if (status >= 500) return "upstream";
  return "request_failed";
}

function runStatus(input) {
  if (!input.modelListOk) return "failed";
  if (input.skipCompletions) return input.modelCount > 0 ? "success" : "partial";
  if (input.attemptedTargets > 0 && input.okTargets === input.attemptedTargets) return "success";
  if (input.attemptedTargets > 0 && input.okTargets > 0) return "partial";
  if (input.skippedTargets > 0) return "partial";
  return "failed";
}

function buildSkippedProfile(profile, reason) {
  return {
    stationId: profile.stationId,
    apiBaseUrl: profile.apiBaseUrl,
    apiKeyEnv: profile.apiKeyEnv,
    reason,
  };
}

function keywordsForStandardModel(value) {
  const text = String(value || "").toLowerCase();
  const version = text.match(/\d+(?:\.\d+)?/)?.[0];
  const keywords = [];
  if (text.includes("claude")) keywords.push("claude");
  if (text.includes("sonnet")) keywords.push("sonnet");
  if (text.includes("opus")) keywords.push("opus");
  if (text.includes("gpt")) keywords.push("gpt");
  if (version) keywords.push(version);
  return keywords;
}

function normalizeFamily(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("claude")) return "claude";
  if (text.includes("gpt")) return "gpt";
  return null;
}

function normalizeModelId(value) {
  return String(value || "").toLowerCase().replace(/[_\s]+/g, "-");
}

function dbRows(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

function stringArray(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item) => String(item || "").trim()).filter(Boolean);
}

function stringValue(value) {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

function optionList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(optionList);
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

function round(value, digits) {
  const base = 10 ** digits;
  return Math.round(value * base) / base;
}

function stableId(...parts) {
  const input = parts.filter((part) => part !== null && part !== undefined).join("|");
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) hash = (hash * 33) ^ input.charCodeAt(index);
  return `id-${(hash >>> 0).toString(36)}`;
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const item = values[index];
    if (!item.startsWith("--")) continue;
    const rawKey = item.slice(2);
    const equalsIndex = rawKey.indexOf("=");
    const key = equalsIndex >= 0 ? rawKey.slice(0, equalsIndex) : rawKey;
    const inlineValue = equalsIndex >= 0 ? rawKey.slice(equalsIndex + 1) : undefined;
    const next = values[index + 1];

    if (inlineValue !== undefined) {
      result[key] = inlineValue;
    } else if (!next || next.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function normalizeOptions(options) {
  return {
    ...options,
    env: parseInlineEnv(options.env),
    dryRun: truthyOption(options.dryRun ?? options["dry-run"]),
    post: truthyOption(options.post),
    db: truthyOption(options.db),
    verbose: truthyOption(options.verbose),
    skipCompletions: truthyOption(options.skipCompletions ?? options["skip-completions"]),
    timeoutMs: positiveInteger(options.timeoutMs ?? options.timeout, DEFAULT_TIMEOUT_MS),
    targetLimit: positiveInteger(options.targetLimit ?? options["target-limit"], DEFAULT_TARGET_LIMIT),
  };
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parseInlineEnv(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  const output = {};
  for (const item of optionList(value)) {
    const index = item.indexOf("=");
    if (index <= 0) continue;
    output[item.slice(0, index)] = item.slice(index + 1);
  }
  return output;
}

function truthyOption(value) {
  return value === true || value === "true" || value === "1" || value === "";
}

function printSummary(result) {
  console.log(
    [
      "API transit probe plan.",
      `profiles=${result.counts.profiles}`,
      `probed=${result.counts.probed}`,
      `skipped=${result.counts.skipped}`,
      `success=${result.counts.successfulRuns}`,
      `failed=${result.counts.failedRuns}`,
      result.post ? "database=posted" : "database=not-requested",
    ].join(" "),
  );
}

function isCli() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function errorMessage(error) {
  if (error?.name === "AbortError") return "请求超时。";
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") return JSON.stringify(error, null, 2);
  return String(error);
}
