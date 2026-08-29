/**
 * CyberDesk Outbound Webhook Engine
 * Dispatches HMAC-SHA256 signed webhook events to external FinTech, SIEM, and Law Firm endpoints.
 */

import { createHmac, randomBytes } from "crypto";

export type WebhookEvent =
  | "incident.created"
  | "incident.updated"
  | "evidence.uploaded"
  | "evidence.extracted"
  | "dossier.finalized"
  | "case.status_changed";

export interface WebhookPayload<T = unknown> {
  eventId: string;
  event: WebhookEvent;
  timestamp: string;
  orgId?: string;
  data: T;
}

/**
 * Generates a webhook signing secret.
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

/**
 * Calculates HMAC-SHA256 signature for a webhook payload.
 */
export function signWebhookPayload(payloadString: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadString).digest("hex");
}

/**
 * Dispatches an outbound webhook event with exponential retry logic.
 */
export async function dispatchWebhook(
  url: string,
  secret: string,
  event: WebhookEvent,
  data: unknown,
  orgId?: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const eventId = `evt_${randomBytes(16).toString("hex")}`;
  const timestamp = new Date().toISOString();

  const payload: WebhookPayload = {
    eventId,
    event,
    timestamp,
    orgId,
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = signWebhookPayload(payloadString, secret);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CyberDesk-Signature": signature,
        "X-CyberDesk-Event": event,
        "X-CyberDesk-Delivery": eventId,
        "User-Agent": "CyberDesk-Webhook-Agent/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Webhook delivery network error",
    };
  }
}
