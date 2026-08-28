import { z } from "zod";
import { normaliseEvidence } from "@/lib/evidence";
import { saveDemoJourney } from "@/lib/server-store";
import { evidencePayloadSchema, interpretationSchema } from "@/lib/api-contracts";
import type { EvidenceItem, Interpretation } from "@/lib/types";
import { rejectAuthenticatedDemoRequest } from "@/lib/auth-server";

const bodySchema = z.object({
  interpretation: interpretationSchema,
  evidence: evidencePayloadSchema.nullable(),
  complaintText: z.string().trim().min(40).max(8000),
});

export async function POST(request: Request) {
  try {
    const authError = await rejectAuthenticatedDemoRequest(request);
    if (authError) return authError;
    const input = bodySchema.parse(await request.json());
    return Response.json(await saveDemoJourney({
      interpretation: input.interpretation as Interpretation,
      evidence: input.evidence ? normaliseEvidence(input.evidence as EvidenceItem) : null,
      complaintText: input.complaintText,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Please complete the review before submitting the demo report." }, { status: 400 });
    console.error("mock report submission failed", error);
    return Response.json({ error: "The mock report could not be saved. Your draft is still available on this screen." }, { status: 502 });
  }
}
