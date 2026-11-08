import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import convert from "heic-convert";

const ERLAUBTE_ENDUNGEN = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".heic",
  ".heif",
]);

const UPLOADS_ORDNER = path.join(process.cwd(), "public", "uploads");

export async function speichereBild(bild: File): Promise<string> {
  let endung = path.extname(bild.name).toLowerCase();
  if (!ERLAUBTE_ENDUNGEN.has(endung)) {
    throw new Error(
      "Nur Bilddateien sind erlaubt (JPG, PNG, WebP, GIF, AVIF, HEIC)."
    );
  }

  let daten = Buffer.from(await bild.arrayBuffer());
  // HEIC/HEIF können die meisten Browser nicht anzeigen, daher zu JPEG konvertieren
  if (endung === ".heic" || endung === ".heif") {
    daten = Buffer.from(
      await convert({ buffer: daten, format: "JPEG", quality: 0.9 })
    );
    endung = ".jpg";
  }

  const dateiname = `${randomUUID()}${endung}`;
  await mkdir(UPLOADS_ORDNER, { recursive: true });
  await writeFile(path.join(UPLOADS_ORDNER, dateiname), daten);
  return `/uploads/${dateiname}`;
}

export async function loescheBild(bildPfad: string): Promise<void> {
  if (!bildPfad.startsWith("/uploads/")) return;
  const datei = path.join(UPLOADS_ORDNER, path.basename(bildPfad));
  await unlink(datei).catch(() => {});
}
