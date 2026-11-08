import { readFile } from "fs/promises";
import path from "path";

// Der Produktions-Server liefert nur public/-Dateien aus, die beim Start
// schon existierten. Neu hochgeladene Bilder landen deshalb hier: Dateien,
// die nicht als statisches Asset gefunden werden, liest dieser Handler
// direkt von der Platte.

const UPLOADS_ORDNER = path.join(process.cwd(), "public", "uploads");

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
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Nicht gefunden", { status: 404 });
  }
}
