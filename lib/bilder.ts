import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import convert from "heic-convert";
import sharp from "sharp";
import { BILD_GROESSEN } from "./bild-url";

export const UPLOADS_ORDNER = path.join(process.cwd(), "public", "uploads");

// längste Seite der gespeicherten Bilder, reicht auch für große Bildschirme
const MAX_KANTE = 2000;

/** Fehler mit einer Meldung, die der Nutzer sehen darf. */
export class BildFehler extends Error {}

// HEIC/HEIF erkennt man an der ftyp-Box, nicht am Dateinamen: iPhones schicken je nach
// Browser .heic, .HEIC, .jpeg (bereits umgewandelt) oder gar keine Endung.
function istHeic(daten: Buffer): boolean {
  if (daten.length < 12 || daten.toString("ascii", 4, 8) !== "ftyp") return false;
  const marke = daten.toString("ascii", 8, 12);
  return ["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"].includes(marke);
}

/**
 * Speichert ein hochgeladenes Bild als WebP und gibt den öffentlichen Pfad zurück.
 * Dreht es nach den EXIF-Angaben, verkleinert es und entfernt die Metadaten (u. a. den GPS-Ort).
 */
export async function speichereBild(bild: File): Promise<string> {
  let daten: Buffer = Buffer.from(await bild.arrayBuffer());

  if (istHeic(daten)) {
    // libvips in sharp kann HEIC (HEVC) nicht lesen, daher erst zu JPEG umwandeln
    try {
      daten = Buffer.from(await convert({ buffer: daten, format: "JPEG", quality: 0.92 }));
    } catch (fehler) {
      console.error("HEIC-Umwandlung fehlgeschlagen", fehler);
      throw new BildFehler("Das HEIC-Foto konnte nicht umgewandelt werden. Versuch es bitte als JPG.");
    }
  }

  let webp: Buffer;
  try {
    webp = await sharp(daten, { animated: true })
      .rotate()
      .resize({ width: MAX_KANTE, height: MAX_KANTE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (fehler) {
    console.error("Bild konnte nicht gelesen werden", bild.name, bild.type, bild.size, fehler);
    throw new BildFehler(
      "Die Datei ist kein unterstütztes Bild (erlaubt sind JPG, PNG, WebP, GIF, AVIF und HEIC)."
    );
  }

  const dateiname = `${randomUUID()}.webp`;
  await mkdir(UPLOADS_ORDNER, { recursive: true });
  await writeFile(path.join(UPLOADS_ORDNER, dateiname), webp);
  return `/uploads/${dateiname}`;
}

export async function loescheBild(bildPfad: string): Promise<void> {
  if (!bildPfad.startsWith("/uploads/")) return;
  const datei = path.basename(bildPfad);
  await unlink(path.join(UPLOADS_ORDNER, datei)).catch(() => {});
  // die verkleinerten Versionen (app/bild/[groesse]/[datei]/route.ts)
  for (const groesse of Object.keys(BILD_GROESSEN)) {
    await unlink(path.join(UPLOADS_ORDNER, ".cache", groesse, `${datei}.webp`)).catch(() => {});
  }
}
