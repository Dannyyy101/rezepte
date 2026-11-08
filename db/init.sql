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
