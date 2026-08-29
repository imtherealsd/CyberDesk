import { z } from "zod";
import { interpretIncident } from "@/lib/ai";

const bodySchema = z.object({ description: z.string().trim().min(20).max(3000) });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    return Response.json(await interpretIncident(body.description));
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Please describe what happened in at least a few words." }, { status: 400 });
    if (error instanceof Error && (error.message === "GEMINI_NOT_CONFIGURED" || error.message === "OPENAI_NOT_CONFIGURED")) {
      return Response.json({ error: "Gemini AI is not configured for this environment." }, { status: 503 });
    }
    console.error("incident interpretation failed", error);
    return Response.json({ error: "The AI explanation could not be completed. Your description is still safe and unchanged." }, { status: 502 });
  }
}
