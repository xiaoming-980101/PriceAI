import { loadTargets, runPriceCollection } from "../../../../../scripts/collect-prices.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  return runCronCollection(request);
}

export async function POST(request: Request) {
  return runCronCollection(request);
}

async function runCronCollection(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const startedAt = new Date().toISOString();
  const url = new URL(request.url);
  const source = url.searchParams.get("source") || url.searchParams.get("sourceId") || undefined;
  const endpoint = process.env.CRON_PUBLIC_BASE_URL || url.origin;

  try {
    if (url.searchParams.get("list") === "1") {
      const targets = await loadTargets();

      return Response.json({
        ok: true,
        startedAt,
        finishedAt: new Date().toISOString(),
        targetCount: targets.length,
        supportedCount: targets.filter((target) => target.kind).length,
        targets: targets.map((target) => ({
          sourceId: target.sourceId,
          sourceName: target.sourceName,
          sourceUrl: target.sourceUrl,
          kind: target.kind,
        })),
      });
    }

    const result = await runPriceCollection({
      all: !source,
      source,
      post: true,
      endpoint,
      password: process.env.ADMIN_PASSWORD,
      silent: true,
    });

    return Response.json({
      ...result,
      ok: true,
      startedAt: result.startedAt || startedAt,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        startedAt,
        finishedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "定时采集失败。",
      },
      { status: 500 },
    );
  }
}

function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!secret && process.env.NODE_ENV === "production") {
    return Response.json(
      { ok: false, message: "CRON_SECRET 未配置，已拒绝执行定时采集。" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (secret && authorization === `Bearer ${secret}`) return null;

  const adminHeader = request.headers.get("x-admin-password");
  if (adminPassword && adminHeader === adminPassword) return null;

  return Response.json({ ok: false, message: "无权执行定时采集。" }, { status: 401 });
}
