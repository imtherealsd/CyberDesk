import { z } from "zod";
import { EVIDENCE_BUCKET, MAX_EVIDENCE_BYTES, getCategoryLabel, getNormalisedMimeType, isSupportedEvidenceFile, sanitiseFilename } from "@/lib/evidence";
import { persistEvidenceMetadata } from "@/lib/server-store";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import type { EvidenceCategory, EvidenceItem } from "@/lib/types";
import { rejectAuthenticatedDemoRequest } from "@/lib/auth-server";

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

export async function POST(request: Request) {
  try {
    const authError = await rejectAuthenticatedDemoRequest(request);
    if (authError) return authError;
    const form = await request.formData();
    const entry = form.get("file");
    const file = entry instanceof File ? entry : null;
    const categoryResult = categorySchema.safeParse(form.get("category") || "other");

    if (!file) return Response.json({ error: "Choose a file before uploading." }, { status: 400 });
    if (!categoryResult.success) return Response.json({ error: "Choose an evidence category before uploading." }, { status: 400 });
    if (file.size > MAX_EVIDENCE_BYTES) return Response.json({ error: "That file is too large. Try a file smaller than 5 MB." }, { status: 413 });

    const mimeType = getNormalisedMimeType(file.name, file.type);
    if (!isSupportedEvidenceFile(file.name, mimeType)) {
      return Response.json({ error: "That file type isn't supported yet. Try a JPG, PNG, PDF or TXT file." }, { status: 415 });
    }

    const id = crypto.randomUUID();
    const safeName = sanitiseFilename(file.name);
    const storagePath = `demo/hero-financial-fraud/${id}/${safeName}`;
    const supabase = getSupabaseServiceRoleClient();
    let uploadStatus: EvidenceItem["uploadStatus"] = "local_only";
    let storageReference: string | null = null;
    let storageMessage = "Private storage is not configured; this file will remain available in the current demo session only.";

    if (supabase && process.env.CYBERDESK_FORCE_LOCAL_STORE !== "1") {
      const { error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(storagePath, await file.arrayBuffer(), { contentType: mimeType, upsert: false });
      if (!error) {
        uploadStatus = "uploaded";
        storageReference = storagePath;
        storageMessage = "Stored in the private demo evidence vault. No public file link was created.";
      } else {
        uploadStatus = "failed";
        storageMessage = "Upload couldn't be completed to private storage. You can continue with this session's demo processing.";
        console.error("evidence storage upload failed", error);
      }
    }

    const category = categoryResult.data as EvidenceCategory;
    const evidence: EvidenceItem = {
      id,
      type: getCategoryLabel(category),
      category,
      filename: file.name,
      source: "Citizen uploaded file",
      description: `A ${getCategoryLabel(category).toLowerCase()} file selected for this synthetic prototype.`,
      mimeType,
      storageReference,
      uploadStatus,
      extractionStatus: "not_started",
      createdAt: new Date().toISOString(),
      isDemo: true,
      candidateFields: [],
      verificationStatus: "candidate",
    };
    const persistence = await persistEvidenceMetadata({ evidence });

    return Response.json({ evidence, storageMessage, metadataPersisted: persistence.persisted });
  } catch (error) {
    console.error("evidence upload failed", error);
    return Response.json({ error: "We couldn't receive that file. Check the file and try again, or continue with the synthetic demo evidence." }, { status: 502 });
  }
}
