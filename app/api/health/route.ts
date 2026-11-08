import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

// für die Probes in Kubernetes, ohne Login
export async function GET() {
  try {
    await pool.query("SELECT 1");
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "datenbank nicht erreichbar" }, { status: 503 });
  }
}
