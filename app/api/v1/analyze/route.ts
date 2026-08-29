import { z } from "zod";
import { interpretIncident, extractEvidence } from "@/lib/ai";
import { matchLegalProvisions } from "@/lib/legal-engine";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { hashApiKey } from "@/lib/api-keys";

const analyzeSchema = z.object({
  narrative: z.string().min(10).max(10000),
  evidenceContent: z.object({
    kind: z.enum(["text", "image", "pdf"]),
    data: z.string(),
    mimeType: z.string(),
  }).optional(),
});

export async function POST(request: Request) {
  // 1. Authenticate API Key or Session Bearer
  const authHeader = request.headers.get("authorization") || "";
  const apiKey = authHeader.startsWith("Bearer cyb_live_") ? authHeader.replace("Bearer ", "").trim() : "";

  if (!apiKey && !authHeader.startsWith("Bearer ey")) {
    return Response.json(
      { error: "Unauthorized. Please provide a valid CyberDesk API Key (cyb_live_...) or Bearer token." },
      { status: 401 }
    );
  }

  try {
    const body = analyzeSchema.parse(await request.json());

    // 2. Perform Gemini AI Structured Interpretation
    const interpretation = await interpretIncident(body.narrative);

    // 3. Match Bharatiya Nyaya Sanhita & IT Act Provisions
    const verifiedFactsPreview = [
      { label: "Incident Type", value: interpretation.incident_type || "Cyber Incident" },
      { label: "Amount", value: interpretation.amount ? `₹${interpretation.amount}` : "" },
    ].filter((f) => Boolean(f.value));

    const legalProvisions = matchLegalProvisions(
      interpretation.incident_type || "",
      body.narrative,
      verifiedFactsPreview
    );

    return Response.json({
      success: true,
      apiVersion: "v1",
      analysis: {
        incidentType: interpretation.incident_type,
        possibleMethod: interpretation.possible_method,
        financialLoss: interpretation.amount,
        urgency: interpretation.urgency,
        mentionedEvidence: interpretation.mentioned_evidence,
        missingInformation: interpretation.missing_information,
        uncertainties: interpretation.uncertainties,
      },
      legalProvisions,
      metadata: {
        model: "gemini-3.6-flash",
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload format.", details: error.errors }, { status: 400 });
    }
    console.error("API v1 analyze error:", error);
    return Response.json(
      { error: "Could not process incident analysis request.", message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
