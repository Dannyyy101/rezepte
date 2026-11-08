import { Pool } from "pg";

export type Rezept = {
  id: number;
  titel: string;
  kategorie: "kochen" | "backen";
  inhalt: string;
  bild_pfad: string | null;
  erstellt_am: Date;
};

export type Mahlzeit = "mittag" | "abend";

export type EssensIdee = {
  id: number;
  mahlzeit: Mahlzeit;
  titel: string;
  erstellt_am: Date;
};

// Pool nur einmal anlegen, damit der Dev-Hot-Reload nicht ständig neue Verbindungen öffnet
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://rezepte:rezepte@localhost:5432/rezepte",
  });

globalForDb.pool = pool;

// init.sql läuft nur beim ersten Start eines frischen Volumes – für bestehende
// Datenbanken legen wir die Ideen-Tabelle einmalig zur Laufzeit an.
const globalForSchema = globalThis as unknown as { ideenSchema?: Promise<void> };

export function stelleIdeenTabelleSicher(): Promise<void> {
  globalForSchema.ideenSchema ??= pool
    .query(`
      CREATE TABLE IF NOT EXISTS essens_ideen (
        id SERIAL PRIMARY KEY,
        mahlzeit TEXT NOT NULL CHECK (mahlzeit IN ('mittag', 'abend')),
        titel TEXT NOT NULL,
        erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    .then(() => undefined)
    .catch((fehler) => {
      // Bei einem Fehler nicht dauerhaft cachen, sonst bleibt die Seite kaputt
      globalForSchema.ideenSchema = undefined;
      throw fehler;
    });

  return globalForSchema.ideenSchema;
}
