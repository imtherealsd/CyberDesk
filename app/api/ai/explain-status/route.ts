import { z } from "zod";
import { demoStatusExplanation, explainStatus } from "@/lib/ai";
import { statusExplanationRequestSchema } from "@/lib/api-contracts";
import { redactSensitiveText } from "@/lib/evidence";

const MAX_STATUS_CONTEXT_BYTES = 24_000;

function sanitiseStatusContext(context: Record<string, unknown>) {
  const priorEvents = Array.isArray(context.prior_events)
    ? context.prior_events.map((event) => {
        if (typeof event === "string") return redactSensitiveText(event);
        if (!event || typeof event !== "object") return event;
        const item = event as Record<string, unknown>;
        return {
          ...item,
          at: typeof item.at === "string" ? redactSensitiveText(item.at) : item.at,
          description: typeof item.description === "string" ? redactSensitiveText(item.description) : item.description,
          status: typeof item.status === "string" ? redactSensitiveText(item.status) : item.status,
        };
      })
    : context.prior_events;

  return {
    ...context,
    status_label: typeof context.status_label === "string" ? redactSensitiveText(context.status_label) : context.status_label,
    case_id: typeof context.case_id === "string" ? redactSensitiveText(context.case_id) : context.case_id,
    last_updated: typeof context.last_updated === "string" ? redactSensitiveText(context.last_updated) : context.last_updated,
    prior_events: priorEvents,
    verified_context: Array.isArray(context.verified_context)
      ? context.verified_context.map((item) => typeof item === "string" ? redactSensitiveText(item) : item)
      : context.verified_context,
  };
}

export async function POST(request: Request) {
  let context: Record<string, unknown> = {};
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_STATUS_CONTEXT_BYTES) {
      return Response.json({ error: "That status request is too large." }, { status: 413 });
    }
    context = statusExplanationRequestSchema.parse(JSON.parse(rawBody));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return Response.json({ error: "Please provide a valid status request." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Please provide a valid status request." }, { status: 400 });
    }
    console.error("status request validation failed", error);
    return Response.json({ error: "Please provide a valid status request." }, { status: 400 });
  }

  try {
    const safeContext = sanitiseStatusContext(context);
    if (!process.env.OPENAI_API_KEY) return Response.json(demoStatusExplanation(safeContext));
    return Response.json(await explainStatus(safeContext));
  } catch (error) {
    console.error("status explanation failed", error);
    return Response.json({
      ...demoStatusExplanation(context),
      fallback_reason: "OpenAI was unavailable, so this explanation was generated deterministically from the same synthetic case facts.",
    });
  }
}
