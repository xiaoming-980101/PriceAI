import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase";
import { stableId } from "@/lib/utils";

export type TransitSubmissionType = "user" | "merchant";

export type CreateTransitSubmissionInput = {
  type: TransitSubmissionType;
  url: string;
  name?: string | null;
  apiBaseUrl?: string | null;
  pricingUrl?: string | null;
  contact?: string | null;
  notes?: string | null;
  models?: string[];
  meta?: Record<string, unknown>;
  submitterIp?: string | null;
};

export async function createTransitSubmission(input: CreateTransitSubmissionInput) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase 尚未配置，暂时无法接收提交。");

  const submittedUrl = normalizeUrl(input.url);
  const id = stableId("api-transit-submission", input.type, submittedUrl, input.submitterIp || "", new Date().toISOString());
  const existing = await findRecentSubmission(submittedUrl, input.submitterIp);
  if (existing) return { ignored: true as const, id: existing };

  const { error } = await supabase.from("api_transit_submissions").insert({
    id,
    submission_type: input.type,
    submitted_url: submittedUrl,
    submitted_name: cleanText(input.name),
    api_base_url: cleanUrl(input.apiBaseUrl),
    pricing_url: cleanUrl(input.pricingUrl),
    contact: cleanText(input.contact),
    notes: cleanText(input.notes),
    submitted_models: input.models?.map((item) => item.trim()).filter(Boolean).slice(0, 30) || [],
    submitted_meta: input.meta || {},
    parse_status: "pending",
    probe_status: input.pricingUrl ? "public_pricing_found" : "pending",
    review_status: "pending",
    submitter_ip: input.submitterIp || null,
  });

  if (error) throw error;
  return { id };
}

async function findRecentSubmission(url: string, submitterIp?: string | null): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("api_transit_submissions")
    .select("id")
    .eq("submitted_url", url)
    .gte("created_at", since)
    .limit(1);

  if (submitterIp) query = query.eq("submitter_ip", submitterIp);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data?.id ? String(data.id) : null;
}

function normalizeUrl(value: string): string {
  const url = new URL(value.trim());
  url.hash = "";
  return url.toString();
}

function cleanUrl(value: string | null | undefined): string | null {
  const text = cleanText(value);
  if (!text) return null;
  return normalizeUrl(text);
}

function cleanText(value: string | null | undefined): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}
