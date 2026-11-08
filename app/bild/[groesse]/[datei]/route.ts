import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { UPLOADS_ORDNER } from "@/lib/bilder";
import { BILD_GROESSEN, type BildGroesse } from "@/lib/bild-url";

// Liefert ein hochgeladenes Bild in der Größe, in der es angezeigt wird. Die Originale (alte bis 3 MB)
// über den Tunnel zu schicken dauerte ewig. Erzeugte Versionen liegen in uploads/.cache/<groesse>/.

const CACHE = path.join(UPLOADS_ORDNER, ".cache");
// dieselbe Datei nicht parallel mehrfach verkleinern (die Startseite fragt alle Karten auf einmal)
const inArbeit = new Map<string, Promise<Buffer>>();

async function erzeuge(datei: string, groesse: BildGroesse): Promise<Buffer> {
  const ziel = path.join(CACHE, groesse, `${datei}.webp`);
  try {
    return await readFile(ziel);
  } catch {
    // noch nicht erzeugt
  }
  const original = await readFile(path.join(UPLOADS_ORDNER, datei));
  const kante = BILD_GROESSEN[groesse];
  const daten = await sharp(original, { animated: true })
    .rotate()
    .resize({ width: kante, height: kante, fit: "inside", withoutEnlargement: true })
    .webp({ quality: groesse === "klein" ? 75 : 82 })
    .toBuffer();
  await mkdir(path.dirname(ziel), { recursive: true });
  // erst unter anderem Namen schreiben, damit nie eine halbe Datei gelesen wird
  const temp = `${ziel}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, daten);
  await rename(temp, ziel);
  return daten;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groesse: string; datei: string }> }
) {
  const { groesse, datei: roh } = await params;
  // basename verhindert Pfad-Ausbrüche wie ../../, versteckte Dateien (.cache) gibt es nicht
  const datei = path.basename(roh);
  if (!(groesse in BILD_GROESSEN) || datei.startsWith(".")) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const schluessel = `${groesse}/${datei}`;
  let arbeit = inArbeit.get(schluessel);
  if (!arbeit) {
    arbeit = erzeuge(datei, groesse as BildGroesse);
    inArbeit.set(schluessel, arbeit);
    arbeit.finally(() => inArbeit.delete(schluessel)).catch(() => {});
  }

  try {
    const daten = await arbeit;
    return new Response(new Uint8Array(daten), {
      headers: {
        "Content-Type": "image/webp",
        // private: nur angemeldet, Cloudflare soll es nicht für alle cachen. Im Browser bleibt es,
        // die Dateinamen sind UUIDs und ändern sich nie
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Nicht gefunden", { status: 404 });
  }
}
