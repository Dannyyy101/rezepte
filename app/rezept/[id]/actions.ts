"use server";

import { revalidatePath } from "next/cache";
import { angemeldeterBenutzer } from "@/lib/auth";
import { pool } from "@/lib/db";

/** Setzt die Bewertung des angemeldeten Nutzers, null entfernt sie. */
export async function bewerteRezept(rezeptId: number, sterne: number | null) {
  const benutzer = await angemeldeterBenutzer();

  if (!Number.isInteger(rezeptId) || rezeptId <= 0) {
    throw new Error("Ungültige Rezept-ID.");
  }

  if (sterne === null) {
    await pool.query("DELETE FROM bewertungen WHERE rezept_id = $1 AND benutzer_id = $2", [
      rezeptId,
      benutzer.id,
    ]);
  } else {
    if (!Number.isInteger(sterne) || sterne < 1 || sterne > 5) {
      throw new Error("Eine Bewertung hat 1 bis 5 Sterne.");
    }
    await pool.query(
      `INSERT INTO bewertungen (rezept_id, benutzer_id, sterne) VALUES ($1, $2, $3)
       ON CONFLICT (rezept_id, benutzer_id) DO UPDATE SET sterne = EXCLUDED.sterne, aktualisiert_am = now()`,
      [rezeptId, benutzer.id, sterne]
    );
  }

  // Schnitt auf Detailseite, Kategorie und Startseite
  revalidatePath("/", "layout");
}
