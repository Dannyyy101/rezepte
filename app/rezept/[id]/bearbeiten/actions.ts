"use server";

import { redirect } from "next/navigation";
import { loescheBild, speichereBild } from "@/lib/bilder";
import { pool } from "@/lib/db";

export async function aktualisiereRezept(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();
  const kategorie = String(formData.get("kategorie") ?? "");
  const inhalt = String(formData.get("inhalt") ?? "").trim();

  if (!/^\d+$/.test(id)) {
    throw new Error("Ungültige Rezept-ID.");
  }
  if (!titel || !inhalt || (kategorie !== "kochen" && kategorie !== "backen")) {
    throw new Error("Bitte Titel, Kategorie und Rezepttext ausfüllen.");
  }

  const { rows } = await pool.query<{ bild_pfad: string | null }>(
    "SELECT bild_pfad FROM rezepte WHERE id = $1",
    [id]
  );
  if (rows.length === 0) {
    throw new Error("Rezept nicht gefunden.");
  }
  const altesBild = rows[0].bild_pfad;

  let neuesBild = altesBild;
  const bild = formData.get("bild");
  if (bild instanceof File && bild.size > 0) {
    neuesBild = await speichereBild(bild);
  } else if (formData.get("bild_entfernen") === "on") {
    neuesBild = null;
  }

  await pool.query(
    "UPDATE rezepte SET titel = $1, kategorie = $2, inhalt = $3, bild_pfad = $4 WHERE id = $5",
    [titel, kategorie, inhalt, neuesBild, id]
  );

  if (altesBild && altesBild !== neuesBild) {
    await loescheBild(altesBild);
  }

  redirect(`/rezept/${id}`);
}
