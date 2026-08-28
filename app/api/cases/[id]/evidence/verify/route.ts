import { z } from "zod";
import { authorizeCaseRequest } from "@/lib/case-auth";
import { saveCaseVerifiedEvidence } from "@/lib/case-store";
import { normaliseEvidence } from "@/lib/evidence";
import { evidencePayloadSchema, interpretationSchema } from "@/lib/api-contracts";
import type { EvidenceItem, Interpretation } from "@/lib/types";

const bodySchema = z.object({
  interpretation: interpretationSchema,
  evidence: evidencePayloadSchema,
}).strict();

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await props.params;
  const authorization = await authorizeCaseRequest(request, caseId);
  if ("response" in authorization) return authorization.response;
  const { auth } = authorization;

  try {
    const input = bodySchema.parse(await request.json());
    const evidence = normaliseEvidence(input.evidence as EvidenceItem);
    evidence.isDemo = false;

    if (evidence.verificationStatus !== "confirmed") {
      return Response.json({ error: "Confirm the evidence details before adding them to the case." }, { status: 400 });
    }

    const result = await saveCaseVerifiedEvidence(
      caseId,
      auth.user,
      evidence,
      input.interpretation as Interpretation,
      auth.client
    );

    return Response.json({
      evidence,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Review each evidence detail before confirming it." }, { status: 400 });
    }
    console.error("Case evidence verification error:", error);
    return Response.json({ error: "We couldn't save verified evidence to this case." }, { status: 502 });
  }
}
