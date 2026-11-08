"use server";

import { revalidatePath } from "next/cache";
import { angemeldeterBenutzer } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function erstelleIdee(formData: FormData) {
  await angemeldeterBenutzer();
  const mahlzeit = String(formData.get("mahlzeit") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();

  if (mahlzeit !== "mittag" && mahlzeit !== "abend") {
    throw new Error("Ungültige Mahlzeit.");
  }
  if (!titel) return;

  await pool.query("INSERT INTO essens_ideen (mahlzeit, titel) VALUES ($1, $2)", [
    mahlzeit,
    titel,
  ]);

  revalidatePath("/ideen");
}

export async function loescheIdee(formData: FormData) {
  await angemeldeterBenutzer();
  const id = String(formData.get("id") ?? "");
  if (!/^\d+$/.test(id)) {
    throw new Error("Ungültige Ideen-ID.");
  }

  await pool.query("DELETE FROM essens_ideen WHERE id = $1", [id]);

  revalidatePath("/ideen");
}
