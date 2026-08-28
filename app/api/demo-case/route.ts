import { getDemoCase } from "@/lib/server-store";

export async function GET() {
  return Response.json(await getDemoCase());
}
