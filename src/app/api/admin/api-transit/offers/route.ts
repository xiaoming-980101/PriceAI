import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminPasswordFromRequest } from "@/lib/admin";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import { updateApiTransitOffers } from "@/lib/api-transit-admin";
import { clearAdminDataCache } from "@/lib/data";
import { requireAdminPassword } from "@/lib/env";

const patchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(800),
  status: z.enum(["active", "needs_review", "inactive"]),
});

export async function PATCH(request: Request) {
  try {
    requireAdminPassword(getAdminPasswordFromRequest(request));
    const payload = patchSchema.parse(await request.json());
    const result = await updateApiTransitOffers(payload);
    clearApiTransitAdminCaches();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    logApiError("admin api transit offers update", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "更新 API 中转报价失败。") },
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
  return message.includes("未授权") ? 401 : 500;
}
