import { pool } from "./db";

// Das Schema wird beim Start des Servers angelegt bzw. ergänzt (instrumentation.ts).
// Jede Anweisung muss mehrfach ausführbar sein, sie läuft bei jedem Start.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS rezepte (
    id SERIAL PRIMARY KEY,
    titel TEXT NOT NULL,
    kategorie TEXT NOT NULL CHECK (kategorie IN ('kochen', 'backen')),
    inhalt TEXT NOT NULL,
    bild_pfad TEXT,
    erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS essens_ideen (
    id SERIAL PRIMARY KEY,
    mahlzeit TEXT NOT NULL CHECK (mahlzeit IN ('mittag', 'abend')),
    titel TEXT NOT NULL,
    erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- eine Bewertung pro Nutzer (ID aus Zitadel) und Rezept, eine neue ersetzt die alte
  CREATE TABLE IF NOT EXISTS bewertungen (
    rezept_id INTEGER NOT NULL REFERENCES rezepte (id) ON DELETE CASCADE,
    benutzer_id TEXT NOT NULL,
    sterne SMALLINT NOT NULL CHECK (sterne BETWEEN 1 AND 5),
    aktualisiert_am TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (rezept_id, benutzer_id)
  );
`;

export async function legeSchemaAn(): Promise<void> {
  // Die Datenbank startet im Cluster evtl. gleichzeitig mit der App
  for (let versuch = 1; ; versuch++) {
    try {
      await pool.query(SCHEMA);
      return;
    } catch (fehler) {
      if (versuch >= 30) throw fehler;
      console.warn(`Datenbank nicht erreichbar (Versuch ${versuch}), neuer Versuch in 2 s`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
