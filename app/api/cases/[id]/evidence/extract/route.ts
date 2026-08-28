import { z } from "zod";
import { demoEvidenceExtraction, extractEvidence } from "@/lib/ai";
import { normaliseEvidence, MAX_TEXT_FOR_EXTRACTION } from "@/lib/evidence";
import { authorizeCaseRequest } from "@/lib/case-auth";
import { saveCaseEvidence } from "@/lib/case-store";
import { evidenceContentSchema, evidencePayloadSchema } from "@/lib/api-contracts";
import type { EvidenceItem } from "@/lib/types";

const bodySchema = z.object({
  evidence: evidencePayloadSchema,
  content: evidenceContentSchema.optional(),
}).strict();

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await props.params;
  const authorization = await authorizeCaseRequest(request, caseId);
  if ("response" in authorization) return authorization.response;
  const { auth } = authorization;

  let evidence: EvidenceItem | null = null;
  try {
    const body = bodySchema.parse(await request.json());
    evidence = normaliseEvidence(body.evidence as EvidenceItem);
    evidence.isDemo = false;

    if (body.content?.kind === "text" && body.content.data.length > MAX_TEXT_FOR_EXTRACTION) {
      body.content.data = body.content.data.slice(0, MAX_TEXT_FOR_EXTRACTION);
    }

    let extraction;
    let fallbackReason = "";
    if (!process.env.OPENAI_API_KEY) {
      extraction = demoEvidenceExtraction({ evidence, content: body.content });
      fallbackReason = "OpenAI is not configured; using deterministic extractor.";
    } else {
      try {
        extraction = await extractEvidence({ evidence, content: body.content });
      } catch (error) {
        console.error("AI extraction error; falling back:", error);
        extraction = demoEvidenceExtraction({ evidence, content: body.content });
        fallbackReason = "OpenAI was unavailable; using deterministic extractor.";
      }
    }

    const processedEvidence: EvidenceItem = {
      ...evidence,
      candidateFields: extraction.candidateFields,
      extractionStatus: extraction.source === "openai" ? "complete" : "fallback",
      extractionNotes: extraction.extractionNotes,
    };

    const persistence = await saveCaseEvidence(caseId, auth.user, processedEvidence, auth.client);

    return Response.json({
      evidence: processedEvidence,
      extraction,
      fallbackReason,
      metadataPersisted: persistence.persisted,
    });
  } catch (error) {
    console.error("Case evidence extraction error:", error);
    return Response.json(
      { error: "Could not extract details from this evidence file.", evidence },
      { status: 502 }
    );
  }
}
