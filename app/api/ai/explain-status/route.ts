import { demoStatusExplanation, explainStatus } from "@/lib/ai";

export async function POST(request: Request) {
  let context: unknown = {};
  try {
    context = await request.json();
    if (!process.env.OPENAI_API_KEY) return Response.json(demoStatusExplanation(context));
    return Response.json(await explainStatus(context));
  } catch (error) {
    console.error("status explanation failed", error);
    return Response.json({
      ...demoStatusExplanation(context),
      fallback_reason: "OpenAI was unavailable, so this explanation was generated deterministically from the same synthetic case facts.",
    });
  }
}
