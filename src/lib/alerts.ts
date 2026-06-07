import "server-only";

type AlertSeverity = "info" | "warning" | "critical";

export async function notifyOperationalIssue(input: {
  event: string;
  title: string;
  severity?: AlertSeverity;
  details?: Record<string, unknown>;
}): Promise<void> {
  const webhookUrl = process.env.PRICEAI_ALERT_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    product: "PriceAI",
    event: input.event,
    title: input.title,
    severity: input.severity || "warning",
    timestamp: new Date().toISOString(),
    details: input.details || {},
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error("Operational alert failed:", error);
  }
}
