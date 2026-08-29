import { z } from "zod";
import { authorizeCaseRequest } from "@/lib/case-auth";
import { getCaseEvidence, saveCaseVerifiedEvidence } from "@/lib/case-store";
import { EvidenceReviewError, reconcileEvidenceReview } from "@/lib/evidence";
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
  const authorization = await authorizeCaseRequest(request, caseId, { minimumRole: "collaborator" });
  if ("response" in authorization) return authorization.response;
  const { auth } = authorization;

  try {
    const input = bodySchema.parse(await request.json());
    if (input.evidence.verificationStatus !== "confirmed") {
      return Response.json({ error: "Confirm the evidence details before adding them to the case." }, { status: 400 });
    }
    const authoritativeEvidence = await getCaseEvidence(
      caseId,
      auth.user,
      input.evidence.id,
      auth.client
    );
    if (!authoritativeEvidence) {
      return Response.json({ error: "Evidence not found in this case." }, { status: 404 });
    }
    if (!["complete", "fallback"].includes(authoritativeEvidence.extractionStatus ?? "")) {
      return Response.json({ error: "Analyze the evidence before confirming its details." }, { status: 409 });
    }
    const evidence = reconcileEvidenceReview(
      authoritativeEvidence,
      input.evidence as EvidenceItem
    );

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
    if (error instanceof EvidenceReviewError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Case evidence verification error:", error);
    return Response.json({ error: "We couldn't save verified evidence to this case." }, { status: 502 });
  }
}
