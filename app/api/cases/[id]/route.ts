import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getCaseDetail } from "@/lib/case-store";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await props.params;
  if (!z.string().uuid().safeParse(caseId).success) {
    return Response.json({ error: "Case not found." }, { status: 404 });
  }
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const detail = await getCaseDetail(caseId, auth.user, auth.client);
    if (!detail) {
      return Response.json(
        { error: "Case not found or you do not have permission to view it." },
        { status: 404 }
      );
    }

    return Response.json({ case: detail });
  } catch (error) {
    console.error(`GET /api/cases/${caseId} error:`, error);
    return Response.json({ error: "Could not load case details." }, { status: 500 });
  }
}
