import { z } from "zod";
import { normaliseEvidence } from "@/lib/evidence";
import { persistVerifiedEvidence } from "@/lib/server-store";
import { evidencePayloadSchema, interpretationSchema } from "@/lib/api-contracts";
import type { EvidenceItem, Interpretation } from "@/lib/types";
import { rejectAuthenticatedDemoRequest } from "@/lib/auth-server";

const bodySchema = z.object({
  interpretation: interpretationSchema,
  evidence: evidencePayloadSchema,
}).strict();

export async function POST(request: Request) {
  try {
    const authError = await rejectAuthenticatedDemoRequest(request);
    if (authError) return authError;
    const input = bodySchema.parse(await request.json());
    const evidence = normaliseEvidence(input.evidence as EvidenceItem);
    if (evidence.verificationStatus !== "confirmed") {
      return Response.json({ error: "Confirm the evidence details before adding them to the incident record." }, { status: 400 });
    }
    const result = await persistVerifiedEvidence({ evidence, interpretation: input.interpretation as Interpretation });
    return Response.json({ evidence, ...result, confirmedFieldCount: evidence.candidateFields.filter((field) => field.verificationStatus === "confirmed").length });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Review each evidence detail before confirming it." }, { status: 400 });
    console.error("evidence verification failed", error);
    return Response.json({ error: "We couldn't save the verified evidence yet. Your corrections are still available in this session." }, { status: 502 });
  }
}
