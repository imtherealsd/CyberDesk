import { z } from "zod";
import { authorizeCaseRequest } from "@/lib/case-auth";
import { saveCaseEvidence } from "@/lib/case-store";
import {
  EVIDENCE_BUCKET,
  MAX_EVIDENCE_BYTES,
  getCategoryLabel,
  getNormalisedMimeType,
  isSupportedEvidenceFile,
  sanitiseFilename,
} from "@/lib/evidence";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import type { EvidenceCategory, EvidenceItem } from "@/lib/types";

const categorySchema = z.enum([
  "transaction",
  "bank_communication",
  "sms",
  "whatsapp_message",
  "email",
  "screenshot",
  "link",
  "caller_contact",
  "other",
]);

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await props.params;
  const authorization = await authorizeCaseRequest(request, caseId);
  if ("response" in authorization) return authorization.response;
  const { auth } = authorization;

  try {
    const form = await request.formData();
    const entry = form.get("file");
    const file = entry instanceof File ? entry : null;
    const categoryResult = categorySchema.safeParse(form.get("category") || "other");

    if (!file) return Response.json({ error: "Choose a file before uploading." }, { status: 400 });
    if (!categoryResult.success) return Response.json({ error: "Choose an evidence category." }, { status: 400 });
    if (file.size > MAX_EVIDENCE_BYTES) return Response.json({ error: "That file is too large (max 5 MB)." }, { status: 413 });

    const mimeType = getNormalisedMimeType(file.name, file.type);
    if (!isSupportedEvidenceFile(file.name, mimeType)) {
      return Response.json({ error: "That file type isn't supported yet. Try JPG, PNG, PDF or TXT." }, { status: 415 });
    }

    const id = crypto.randomUUID();
    const safeName = sanitiseFilename(file.name);
    const storagePath = `cases/${caseId}/${id}/${safeName}`;
    const supabase = getSupabaseServiceRoleClient();
    let uploadStatus: EvidenceItem["uploadStatus"] = "local_only";
    let storageReference: string | null = null;
    let storageMessage = "Evidence stored in local session vault.";

    if (supabase && process.env.CYBERDESK_FORCE_LOCAL_STORE !== "1") {
      const { error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(storagePath, await file.arrayBuffer(), { contentType: mimeType, upsert: false });
      if (!error) {
        uploadStatus = "uploaded";
        storageReference = storagePath;
        storageMessage = "Stored in the private case evidence vault.";
      } else {
        uploadStatus = "failed";
        storageMessage = "Upload to private cloud storage failed; stored locally in current session.";
        console.error("Storage upload error:", error);
      }
    }

    const category = categoryResult.data as EvidenceCategory;
    const evidence: EvidenceItem = {
      id,
      type: getCategoryLabel(category),
      category,
      filename: file.name,
      source: "Citizen uploaded file",
      description: `A ${getCategoryLabel(category).toLowerCase()} file uploaded for this case.`,
      mimeType,
      storageReference,
      uploadStatus,
      extractionStatus: "not_started",
      createdAt: new Date().toISOString(),
      isDemo: false,
      candidateFields: [],
      verificationStatus: "candidate",
    };

    const persistence = await saveCaseEvidence(caseId, auth.user, evidence, auth.client);

    return Response.json({ evidence, storageMessage, metadataPersisted: persistence.persisted });
  } catch (error) {
    console.error("Case evidence upload failed:", error);
    return Response.json({ error: "We couldn't upload that evidence file." }, { status: 502 });
  }
}
