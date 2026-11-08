"use server";

import { revalidatePath } from "next/cache";
import { pool, stelleIdeenTabelleSicher } from "@/lib/db";

export async function erstelleIdee(formData: FormData) {
  const mahlzeit = String(formData.get("mahlzeit") ?? "");
  const titel = String(formData.get("titel") ?? "").trim();

  if (mahlzeit !== "mittag" && mahlzeit !== "abend") {
    throw new Error("Ungültige Mahlzeit.");
  }
  if (!titel) return;

  await stelleIdeenTabelleSicher();
  await pool.query("INSERT INTO essens_ideen (mahlzeit, titel) VALUES ($1, $2)", [
    mahlzeit,
    titel,
  ]);

  revalidatePath("/ideen");
}

export async function loescheIdee(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^\d+$/.test(id)) {
    throw new Error("Ungültige Ideen-ID.");
  }

  await stelleIdeenTabelleSicher();
  await pool.query("DELETE FROM essens_ideen WHERE id = $1", [id]);

  revalidatePath("/ideen");
}
