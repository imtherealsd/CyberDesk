import { z } from "zod";
import { demoEvidenceExtraction, extractEvidence } from "@/lib/ai";
import { normaliseEvidence, MAX_TEXT_FOR_EXTRACTION } from "@/lib/evidence";
import { persistEvidenceMetadata } from "@/lib/server-store";
import { evidenceContentSchema, evidencePayloadSchema } from "@/lib/api-contracts";
import type { EvidenceItem } from "@/lib/types";
import { rejectAuthenticatedDemoRequest } from "@/lib/auth-server";

const bodySchema = z.object({ evidence: evidencePayloadSchema, content: evidenceContentSchema.optional() }).strict();

export async function POST(request: Request) {
  let evidence: EvidenceItem | null = null;
  try {
    const authError = await rejectAuthenticatedDemoRequest(request);
    if (authError) return authError;
    const body = bodySchema.parse(await request.json());
    evidence = normaliseEvidence(body.evidence as EvidenceItem);
    if (body.content?.kind === "text" && body.content.data.length > MAX_TEXT_FOR_EXTRACTION) {
      body.content.data = body.content.data.slice(0, MAX_TEXT_FOR_EXTRACTION);
    }

    let extraction;
    let fallbackReason = "";
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      extraction = demoEvidenceExtraction({ evidence, content: body.content });
      fallbackReason = "Gemini AI is not configured, so CyberDesk used the limited demo extractor.";
    } else {
      try {
        extraction = await extractEvidence({ evidence, content: body.content });
      } catch (error) {
        console.error("evidence extraction failed; using fallback", error);
        extraction = demoEvidenceExtraction({ evidence, content: body.content });
        fallbackReason = "Gemini AI was unavailable, so CyberDesk used the limited demo extractor.";
      }
    }

    const processedEvidence: EvidenceItem = {
      ...evidence,
      candidateFields: extraction.candidateFields,
      extractionStatus: (extraction.source === "gemini" || extraction.source === "openai") ? "complete" : "fallback",
      extractionNotes: extraction.extractionNotes,
    };
    const persistence = await persistEvidenceMetadata({ evidence: processedEvidence });
    return Response.json({
      evidence: processedEvidence,
      extraction,
      fallbackReason,
      metadataPersisted: persistence.persisted,
    });
  } catch (error) {
    console.error("evidence extraction request failed", error);
    return Response.json({
      error: "We couldn't process that evidence yet. You can keep the file in your session and continue with the synthetic demo evidence.",
      evidence,
    }, { status: 502 });
  }
}
