import { BildFehler, speichereBild } from "./bilder";

/** Rückgabe der Formular-Actions: bei Erfolg wird weitergeleitet, sonst kommt eine Meldung zurück. */
export type FormularStatus = { fehler: string | null };

export type RezeptEingaben = {
  titel: string;
  kategorie: "kochen" | "backen";
  inhalt: string;
};

export function leseRezeptEingaben(formData: FormData): RezeptEingaben | string {
  const titel = String(formData.get("titel") ?? "").trim();
  const kategorie = String(formData.get("kategorie") ?? "");
  const inhalt = String(formData.get("inhalt") ?? "").trim();

  if (!titel || !inhalt || (kategorie !== "kochen" && kategorie !== "backen")) {
    return "Bitte Überschrift, Kategorie und Rezepttext ausfüllen.";
  }
  return { titel, kategorie, inhalt };
}

/** Das neue Bild aus dem Formular, null ohne Bild, ein String bei einem Fehler. */
export async function speichereBildAusFormular(formData: FormData): Promise<string | null | { fehler: string }> {
  const bild = formData.get("bild");
  if (!(bild instanceof File) || bild.size === 0) return null;
  try {
    return await speichereBild(bild);
  } catch (fehler) {
    if (fehler instanceof BildFehler) return { fehler: fehler.message };
    console.error("Bild konnte nicht gespeichert werden", fehler);
    return { fehler: "Das Bild konnte nicht gespeichert werden, bitte versuch es noch einmal." };
  }
}
