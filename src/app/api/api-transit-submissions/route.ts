import { z } from "zod";
import { createTransitSubmission } from "@/lib/api-transit-submissions";

const schema = z.object({
  type: z.enum(["user", "merchant"]).default("user"),
  url: z.string().url().max(2048),
  name: z.string().trim().max(200).optional().nullable(),
  apiBaseUrl: z.string().url().max(2048).optional().nullable(),
  pricingUrl: z.string().url().max(2048).optional().nullable(),
  contact: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  models: z.array(z.string().trim().max(80)).max(30).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  website: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    if (payload.website) return Response.json({ ok: true });

    const result = await createTransitSubmission({
      type: payload.type,
      url: payload.url,
      name: payload.name ?? null,
      apiBaseUrl: payload.apiBaseUrl ?? null,
      pricingUrl: payload.pricingUrl ?? null,
      contact: payload.contact ?? null,
      notes: payload.notes ?? null,
      models: payload.models || [],
      meta: payload.meta || {},
      submitterIp: getClientIp(request),
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = error instanceof z.ZodError ? 400 : message.includes("尚未配置") ? 503 : 500;
    if (status >= 500) console.error("[api-transit-submissions] failed", error);
    return Response.json({ ok: false, message }, { status });
  }
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "提交内容格式不正确，请检查链接和字段。";
  if (error instanceof Error) return error.message;
  return "提交失败，请稍后再试。";
}
