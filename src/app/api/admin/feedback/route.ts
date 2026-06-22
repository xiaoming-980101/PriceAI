import {
  createFeedbackRecollectionJob,
  getAdminPasswordFromRequest,
  listOfferFeedback,
  updateOfferFeedbackStatus,
  updateOfferFeedbackVerification,
} from "@/lib/admin";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import { clearAdminDataCache, listRawOffersByIds } from "@/lib/data";
import { requireAdminPassword } from "@/lib/env";
import { z } from "zod";

const statusSchema = z.enum(["pending", "resolved", "ignored"]);
const verificationStatusSchema = z.enum([
  "not_needed",
  "pending",
  "running",
  "auto_fixed",
  "recollection_created",
  "manual_review",
  "failed",
]);
const verificationResultSchema = z.enum([
  "offer_changed",
  "item_removed",
  "out_of_stock",
  "still_available",
  "recollection_created",
  "inconclusive",
  "blocked",
]);

const patchSchema = z.object({
  action: z.enum(["status", "verification", "recollect"]).optional(),
  id: z.string().min(1),
  status: statusSchema.optional(),
  reviewerNote: z.string().max(500).nullable().optional(),
  verificationStatus: verificationStatusSchema.optional(),
  verificationResult: verificationResultSchema.nullable().optional(),
  verificationMessage: z.string().max(500).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    requireAdminPassword(getAdminPasswordFromRequest(request));
    const { searchParams } = new URL(request.url);
    const status = statusSchema.catch("pending").parse(searchParams.get("status") || "pending");
    const feedback = await listOfferFeedback(status);
    const offers = await listRawOffersByIds(
      feedback
        .map((item) => item.offerId)
        .filter((id): id is string => Boolean(id)),
    );
    return Response.json({ ok: true, feedback, offers });
  } catch (error) {
    logApiError("admin feedback list", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "加载反馈失败。") },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    requireAdminPassword(getAdminPasswordFromRequest(request));
    const payload = patchSchema.parse(await request.json());
    const action = payload.action || "status";
    if (action === "recollect") {
      const result = await createFeedbackRecollectionJob({ feedbackId: payload.id });
      clearAdminDataCache();
      return Response.json({ ok: true, feedback: result.feedback, jobId: result.jobId });
    }

    if (action === "verification") {
      if (!payload.verificationStatus) {
        return Response.json({ ok: false, message: "缺少核验状态。" }, { status: 400 });
      }
      const feedback = await updateOfferFeedbackVerification({
        id: payload.id,
        verificationStatus: payload.verificationStatus,
        verificationResult: payload.verificationResult || null,
        verificationMessage: payload.verificationMessage || null,
        reviewerNote: payload.reviewerNote || null,
      });
      clearAdminDataCache();
      return Response.json({ ok: true, feedback });
    }

    if (!payload.status) {
      return Response.json({ ok: false, message: "缺少反馈处理状态。" }, { status: 400 });
    }

    const feedback = await updateOfferFeedbackStatus({
      id: payload.id,
      status: payload.status,
      reviewerNote: payload.reviewerNote || null,
    });
    clearAdminDataCache();
    return Response.json({ ok: true, feedback });
  } catch (error) {
    logApiError("admin feedback update", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "处理反馈失败。") },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
