import { Pool } from "pg";

export type Rezept = {
  id: number;
  titel: string;
  kategorie: "kochen" | "backen";
  inhalt: string;
  bild_pfad: string | null;
  erstellt_am: Date;
};

/** Rezept mit dem Schnitt aller Bewertungen (null ohne Bewertung). */
export type RezeptMitBewertung = Rezept & {
  sterne_schnitt: number | null;
  anzahl_bewertungen: number;
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
  new Pool(
    // im Cluster kommen PGHOST, PGUSER, PGPASSWORD und PGDATABASE einzeln, die liest pg selbst
    process.env.PGHOST && !process.env.DATABASE_URL
      ? {}
      : {
          connectionString:
            process.env.DATABASE_URL ?? "postgres://rezepte:rezepte@localhost:5434/rezepte",
        }
  );

globalForDb.pool = pool;

/**
 * SELECT für Rezepte samt Bewertungs-Schnitt, Bedingungen und Sortierung hängt der Aufrufer an.
 * AVG liefert numeric, das pg als String zurückgibt, daher der Cast auf float.
 */
export const REZEPTE_MIT_BEWERTUNG = `
  SELECT r.*,
         b.sterne_schnitt::float AS sterne_schnitt,
         COALESCE(b.anzahl, 0)::int AS anzahl_bewertungen
  FROM rezepte r
  LEFT JOIN (
    SELECT rezept_id, AVG(sterne) AS sterne_schnitt, COUNT(*) AS anzahl
    FROM bewertungen
    GROUP BY rezept_id
  ) b ON b.rezept_id = r.id
`;
