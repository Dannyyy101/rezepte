# Mein Rezeptbuch

Eine kleine Rezepte-Website mit drei Kategorien (**Kochen**, **Backen** und **Essens-Ideen**), Bild-Upload und Gelb-Braun-Theme.

**Stack:** Next.js (App Router) · PostgreSQL via Docker Compose · direkter `pg`-Connector (kein ORM) · Tailwind CSS

## Starten

```bash
# 1. Datenbank starten (legt die Tabelle beim ersten Start automatisch an)
docker compose up -d

# 2. Dev-Server starten
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen.

## Wie es funktioniert

| Pfad | Zweck |
| --- | --- |
| `/` | Startseite mit Kategorie-Auswahl und neuesten Rezepten |
| `/kochen`, `/backen` | Rezeptliste je Kategorie |
| `/rezept/[id]` | Detailseite – Text links, Bild rechts |
| `/ideen` | Zwei Spalten: Mittagessen links, Abendessen rechts – freie Ideen-Liste |
| `/neu` | Formular: Überschrift, ein Textfeld, optionales Bild |

- **Datenbank:** Schema in [db/init.sql](db/init.sql), Verbindung in [lib/db.ts](lib/db.ts) über `DATABASE_URL` (siehe [.env.local](.env.local)).
- **Bilder:** landen in `public/uploads/` und werden direkt von Next.js ausgeliefert.
- **Speichern:** läuft über eine Server Action ([app/neu/actions.ts](app/neu/actions.ts)) mit parametrisiertem SQL-INSERT.
- **Essens-Ideen:** eigene Tabelle `essens_ideen` (Spalte `mahlzeit`: `mittag` / `abend`). Weil `init.sql` nur bei einem frischen Volume läuft, legt `stelleIdeenTabelleSicher()` in [lib/db.ts](lib/db.ts) die Tabelle bei bestehenden Datenbanken zur Laufzeit an.

## Datenbank zurücksetzen

```bash
docker compose down -v && docker compose up -d
```
