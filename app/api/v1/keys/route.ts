import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { generateApiKey, type ApiKeyScope } from "@/lib/api-keys";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const createKeySchema = z.object({
  name: z.string().min(2).max(100),
  scopes: z.array(z.enum(["read:incidents", "write:incidents", "analyze:evidence", "generate:dossier", "manage:webhooks"])).default(["read:incidents", "write:incidents", "analyze:evidence"]),
});

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return Response.json({ error: "Authentication required to generate an API key." }, { status: 401 });
  }

  try {
    const body = createKeySchema.parse(await request.json());
    const generated = generateApiKey();
    const now = new Date().toISOString();

    const serviceClient = getSupabaseServiceRoleClient();
    if (serviceClient) {
      await serviceClient.from("api_keys").insert({
        id: crypto.randomUUID(),
        user_id: auth.user.id,
        name: body.name,
        key_prefix: generated.keyPrefix,
        hashed_key: generated.hashedKey,
        scopes: body.scopes,
        rate_limit: 60, // 60 requests/min
        created_at: now,
      });
    }

    return Response.json({
      success: true,
      apiKey: generated.rawKey, // Returned ONLY ONCE
      keyPrefix: generated.keyPrefix,
      name: body.name,
      scopes: body.scopes,
      rateLimit: 60,
      createdAt: now,
      warning: "Store this API key securely. It will not be shown again.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid key creation data.", details: error.errors }, { status: 400 });
    }
    console.error("API Key generation error:", error);
    return Response.json({ error: "Could not generate API key." }, { status: 500 });
  }
}
