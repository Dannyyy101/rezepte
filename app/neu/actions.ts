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

export async function erstelleRezept(
  _vorher: FormularStatus,
  formData: FormData
): Promise<FormularStatus> {
  await angemeldeterBenutzer();

  const eingaben = leseRezeptEingaben(formData);
  if (typeof eingaben === "string") return { fehler: eingaben };

  const bild = await speichereBildAusFormular(formData);
  if (bild && typeof bild === "object") return bild;

  let id: number;
  try {
    const { rows } = await pool.query<{ id: number }>(
      "INSERT INTO rezepte (titel, kategorie, inhalt, bild_pfad) VALUES ($1, $2, $3, $4) RETURNING id",
      [eingaben.titel, eingaben.kategorie, eingaben.inhalt, bild]
    );
    id = rows[0].id;
  } catch (fehler) {
    // sonst bliebe ein Bild ohne Rezept auf der Platte liegen
    if (bild) await loescheBild(bild);
    console.error("Rezept konnte nicht gespeichert werden", fehler);
    return { fehler: "Das Rezept konnte nicht gespeichert werden, bitte versuch es noch einmal." };
  }

  redirect(`/rezept/${id}`);
}
