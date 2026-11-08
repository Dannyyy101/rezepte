"use server";

import { redirect } from "next/navigation";
import { angemeldeterBenutzer } from "@/lib/auth";
import { loescheBild } from "@/lib/bilder";
import { pool } from "@/lib/db";
import {
  type FormularStatus,
  leseRezeptEingaben,
  speichereBildAusFormular,
} from "@/lib/rezept-formular";

export async function aktualisiereRezept(
  _vorher: FormularStatus,
  formData: FormData
): Promise<FormularStatus> {
  await angemeldeterBenutzer();

  const id = String(formData.get("id") ?? "");
  if (!/^\d+$/.test(id)) return { fehler: "Ungültige Rezept-ID." };

  const eingaben = leseRezeptEingaben(formData);
  if (typeof eingaben === "string") return { fehler: eingaben };

  const { rows } = await pool.query<{ bild_pfad: string | null }>(
    "SELECT bild_pfad FROM rezepte WHERE id = $1",
    [id]
  );
  if (rows.length === 0) return { fehler: "Das Rezept gibt es nicht mehr." };
  const altesBild = rows[0].bild_pfad;

  const hochgeladen = await speichereBildAusFormular(formData);
  if (hochgeladen && typeof hochgeladen === "object") return hochgeladen;

  let neuesBild = altesBild;
  if (hochgeladen) {
    neuesBild = hochgeladen;
  } else if (formData.get("bild_entfernen") === "on") {
    neuesBild = null;
  }

  try {
    await pool.query(
      "UPDATE rezepte SET titel = $1, kategorie = $2, inhalt = $3, bild_pfad = $4 WHERE id = $5",
      [eingaben.titel, eingaben.kategorie, eingaben.inhalt, neuesBild, id]
    );
  } catch (fehler) {
    if (hochgeladen) await loescheBild(hochgeladen);
    console.error("Rezept konnte nicht gespeichert werden", fehler);
    return { fehler: "Die Änderungen konnten nicht gespeichert werden, bitte versuch es noch einmal." };
  }

  if (altesBild && altesBild !== neuesBild) {
    await loescheBild(altesBild);
  }

  redirect(`/rezept/${id}`);
}
