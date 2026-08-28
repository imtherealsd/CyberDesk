import { z } from "zod";
import { authorizeCaseRequest } from "@/lib/case-auth";
import { submitCaseReport } from "@/lib/case-store";

const bodySchema = z.object({
  complaintText: z.string().trim().min(20).max(8000),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await props.params;
  const authorization = await authorizeCaseRequest(request, caseId);
  if ("response" in authorization) return authorization.response;
  const { auth } = authorization;

  try {
    const input = bodySchema.parse(await request.json());
    const result = await submitCaseReport(caseId, auth.user, input.complaintText, auth.client);
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Please provide a complete complaint narrative." }, { status: 400 });
    }
    console.error("Case report submission error:", error);
    return Response.json({ error: "Could not submit case report." }, { status: 500 });
  }
}
