import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminPasswordFromRequest } from "@/lib/admin";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import {
  publishApiTransitStationWithOffers,
  updateApiTransitStation,
} from "@/lib/api-transit-admin";
import { clearAdminDataCache } from "@/lib/data";
import { requireAdminPassword } from "@/lib/env";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("publish"),
    id: z.string().min(1),
    offerIds: z.array(z.string().min(1)).max(800).optional(),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().min(1),
    published: z.boolean().optional(),
    dataStatus: z.enum(["sample", "pending_review", "verified"]).optional(),
    usageAdvice: z.enum(["try_small", "cautious", "not_recommended", "pending"]).optional(),
    status: z.enum(["active", "limited", "unavailable", "unknown"]).optional(),
    adminNote: z.string().trim().max(1000).nullable().optional(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    requireAdminPassword(getAdminPasswordFromRequest(request));
    const payload = patchSchema.parse(await request.json());

    if (payload.action === "publish") {
      const result = await publishApiTransitStationWithOffers({
        stationId: payload.id,
        offerIds: payload.offerIds,
      });
      clearApiTransitAdminCaches();
      return Response.json({ ok: true, ...result });
    }

    const station = await updateApiTransitStation({
      id: payload.id,
      published: payload.published,
      dataStatus: payload.dataStatus,
      usageAdvice: payload.usageAdvice,
      status: payload.status,
      adminNote: payload.adminNote,
    });
    clearApiTransitAdminCaches();
    return Response.json({ ok: true, station });
  } catch (error) {
    logApiError("admin api transit station update", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "更新 API 中转站失败。") },
      { status: error instanceof z.ZodError ? 400 : errorStatus(error) },
    );
  }
}

function clearApiTransitAdminCaches(): void {
  clearAdminDataCache();
  revalidatePath("/admin");
  revalidatePath("/admin/api-transit");
  revalidatePath("/api-transit");
  revalidatePath("/api-transit/models");
  revalidatePath("/api-transit/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

function errorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("未授权")) return 401;
  if (message.includes("不存在")) return 404;
  return 500;
}
