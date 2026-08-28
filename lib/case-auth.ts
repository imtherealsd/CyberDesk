import { z } from "zod";
import { getAuthenticatedUser, type AuthContext } from "./auth-server";
import { isUserCaseMember } from "./case-store";

const uuidSchema = z.string().uuid();

type CaseAuthorization =
  | { auth: AuthContext }
  | { response: Response };

/**
 * Shared object-level authorization for case APIs. Invalid or inaccessible
 * case identifiers intentionally return the same 404 shape to avoid an
 * authenticated user probing whether another case exists.
 */
export async function authorizeCaseRequest(request: Request, caseId: string): Promise<CaseAuthorization> {
  if (!uuidSchema.safeParse(caseId).success) {
    return { response: Response.json({ error: "Case not found." }, { status: 404 }) };
  }

  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return { response: Response.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (!(await isUserCaseMember(caseId, auth.user.id, auth.client))) {
    return { response: Response.json({ error: "Case not found." }, { status: 404 }) };
  }

  return { auth };
}
