import { z } from "zod";
import { interpretIncident } from "@/lib/ai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { generateFIRDraft, generateBankFreezeNotice } from "@/lib/legal-engine";
import { calculateSHA256 } from "@/lib/custody";

const incidentInputSchema = z.object({
  narrative: z.string().min(20).max(10000),
  category: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "unknown"]).optional(),
  complainantName: z.string().optional(),
  complainantContact: z.string().optional(),
  bankName: z.string().optional(),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return Response.json(
      { error: "Unauthorized. An API Key or Bearer Token is required." },
      { status: 401 }
    );
  }

  try {
    const body = incidentInputSchema.parse(await request.json());

    // 1. Run Gemini 3.6 Flash structured extraction
    const interpretation = await interpretIncident(body.narrative);

    const now = new Date().toISOString();
    const caseId = crypto.randomUUID();
    const incidentType = interpretation.incident_type || body.category || "Cyber Incident";
    const urgency = body.urgency || interpretation.urgency || "high";

    const verifiedFacts = [
      { label: "Incident Type", value: incidentType },
      { label: "Financial Loss", value: interpretation.amount ? `₹${interpretation.amount}` : "Unspecified" },
      { label: "Modus Operandi", value: interpretation.possible_method || "Digital impersonation" },
    ];

    // 2. Generate Police FIR Draft and Bank Section 91 Notice
    const firDraft = generateFIRDraft({
      complainantName: body.complainantName || "Citizen Complainant",
      complainantContact: body.complainantContact || "Verified via API",
      incidentType,
      description: body.narrative,
      verifiedFacts,
      evidenceFilenames: ["API_Payload_Record.json"],
    });

    const bankNotice = generateBankFreezeNotice({
      bankName: body.bankName || "Beneficiary Bank",
      complainantName: body.complainantName || "Complainant",
      transactions: interpretation.amount ? [{
        amount: `₹${interpretation.amount}`,
        utrOrRef: "Identified in investigation",
        beneficiaryAccountOrUpi: "Identified in transaction log",
        dateTime: now,
      }] : [],
    });

    // 3. Generate Cryptographic Integrity Hash for the incident record
    const custodyHash = calculateSHA256(JSON.stringify({ caseId, narrative: body.narrative, now }), "incident-record.json");

    // 4. Save to Database if service client is available
    const serviceClient = getSupabaseServiceRoleClient();
    if (serviceClient) {
      await serviceClient.from("incidents").insert({
        id: caseId,
        incident_type: incidentType,
        description: body.narrative,
        urgency,
        status: "submitted",
        is_demo: false,
        created_at: now,
        updated_at: now,
      });
    }

    return Response.json({
      success: true,
      apiVersion: "v1",
      caseId,
      caseReference: `CYB-PRO-${caseId.slice(0, 8).toUpperCase()}`,
      status: "submitted",
      interpretation: {
        incidentType,
        possibleMethod: interpretation.possible_method,
        financialLoss: interpretation.amount,
        urgency,
      },
      legalArtifacts: {
        firDraft,
        bankNotice,
        custodyHash,
      },
      metadata: {
        createdAt: now,
        poweredBy: "Google Gemini 3.6 Flash & CyberDesk LegalTech",
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload.", details: error.errors }, { status: 400 });
    }
    console.error("API v1 incident creation error:", error);
    return Response.json({ error: "Could not create incident.", message: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
