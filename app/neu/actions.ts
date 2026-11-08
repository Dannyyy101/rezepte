"use server";

import { redirect } from "next/navigation";
import { speichereBild } from "@/lib/bilder";
import { pool } from "@/lib/db";

export async function erstelleRezept(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  const kategorie = String(formData.get("kategorie") ?? "");
  const inhalt = String(formData.get("inhalt") ?? "").trim();

  if (!titel || !inhalt || (kategorie !== "kochen" && kategorie !== "backen")) {
    throw new Error("Bitte Titel, Kategorie und Rezepttext ausfüllen.");
  }

  let bildPfad: string | null = null;
  const bild = formData.get("bild");
  if (bild instanceof File && bild.size > 0) {
    bildPfad = await speichereBild(bild);
  }

  const { rows } = await pool.query<{ id: number }>(
    "INSERT INTO rezepte (titel, kategorie, inhalt, bild_pfad) VALUES ($1, $2, $3, $4) RETURNING id",
    [titel, kategorie, inhalt, bildPfad]
  );

  redirect(`/rezept/${rows[0].id}`);
}
