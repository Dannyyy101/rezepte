import { notFound } from "next/navigation";
import RezeptFormular from "@/components/rezept-formular";
import { pool, type Rezept } from "@/lib/db";
import { aktualisiereRezept } from "./actions";

export const dynamic = "force-dynamic";

export default async function BearbeitenSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { rows } = await pool.query<Rezept>(
    "SELECT * FROM rezepte WHERE id = $1",
    [id]
  );
  const rezept = rows[0];
  if (!rezept) notFound();

  return <RezeptFormular action={aktualisiereRezept} rezept={rezept} />;
}
