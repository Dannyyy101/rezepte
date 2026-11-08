import { readFile } from "fs/promises";
import path from "path";
import { UPLOADS_ORDNER } from "@/lib/bilder";

// Der Produktions-Server liefert nur public/-Dateien aus, die beim Start schon existierten.
// Neu hochgeladene Bilder landen deshalb hier: Dateien, die nicht als statisches Asset
// gefunden werden, liest dieser Handler direkt von der Platte (im Cluster ein Volume).

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ datei: string }> }
) {
  const { datei } = await params;
  const contentType = CONTENT_TYPES[path.extname(datei).toLowerCase()];
  if (!contentType) return new Response("Nicht gefunden", { status: 404 });

  try {
    // basename verhindert Pfad-Ausbrüche wie ../../
    const daten = await readFile(path.join(UPLOADS_ORDNER, path.basename(datei)));
    return new Response(new Uint8Array(daten), {
      headers: {
        "Content-Type": contentType,
        // private: die Bilder gibt es nur angemeldet, Cloudflare soll sie nicht für alle cachen.
        // Dateinamen sind UUIDs, ein Bild ändert sich nie.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Nicht gefunden", { status: 404 });
  }
}
