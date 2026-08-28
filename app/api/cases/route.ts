import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { createCase, getUserCases } from "@/lib/case-store";
import { interpretationSchema } from "@/lib/api-contracts";
import type { CreateCaseInput, Interpretation } from "@/lib/types";

const createCaseSchema = z.object({
  incidentType: z.string().trim().max(200).optional(),
  description: z.string().trim().min(5).max(10000),
  urgency: z.enum(["low", "medium", "high", "unknown"]).optional(),
  interpretation: interpretationSchema.nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return Response.json({ error: "Authentication required to view cases." }, { status: 401 });
  }

  try {
    const cases = await getUserCases(auth.user, auth.client);
    return Response.json({ cases });
  } catch (error) {
    console.error("GET /api/cases error:", error);
    return Response.json({ error: "Could not retrieve cases." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return Response.json({ error: "Authentication required to create a case." }, { status: 401 });
  }

  try {
    const body = createCaseSchema.parse(await request.json());
    const input: CreateCaseInput = {
      incidentType: body.incidentType,
      description: body.description,
      urgency: body.urgency,
      interpretation: body.interpretation as Interpretation | null | undefined,
    };

    const newCase = await createCase(auth.user, input, auth.client);
    return Response.json({ case: newCase }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Please provide a valid case description." }, { status: 400 });
    }
    console.error("POST /api/cases error:", error);
    return Response.json({ error: "Could not create case." }, { status: 500 });
  }
}
