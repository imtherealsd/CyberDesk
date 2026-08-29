import { z } from "zod";
import { getAuthenticatedUser, type AuthContext } from "./auth-server";
import { getUserCaseRole } from "./case-store";
import type { CaseMemberRole } from "./types";

const uuidSchema = z.string().uuid();

type CaseAuthorization =
  | { auth: AuthContext }
  | { response: Response };

const ROLE_RANK: Record<CaseMemberRole, number> = {
  viewer: 0,
  collaborator: 1,
  owner: 2,
};

/**
 * Shared object-level authorization for case APIs. Invalid or inaccessible
 * case identifiers intentionally return the same 404 shape to avoid an
 * authenticated user probing whether another case exists.
 */
export async function authorizeCaseRequest(
  request: Request,
  caseId: string,
  options: { minimumRole?: Exclude<CaseMemberRole, "viewer"> | "viewer" } = {}
): Promise<CaseAuthorization> {
  if (!uuidSchema.safeParse(caseId).success) {
    return { response: Response.json({ error: "Case not found." }, { status: 404 }) };
  }

  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return { response: Response.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const role = await getUserCaseRole(caseId, auth.user.id, auth.client);
  if (!role) {
    return { response: Response.json({ error: "Case not found." }, { status: 404 }) };
  }
  if (options.minimumRole && ROLE_RANK[role] < ROLE_RANK[options.minimumRole]) {
    return { response: Response.json({ error: "You do not have permission to change this case." }, { status: 403 }) };
  }

  return { auth };
}
