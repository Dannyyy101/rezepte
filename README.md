# Mein Rezeptbuch

Eine kleine Rezepte-Website mit drei Kategorien (**Kochen**, **Backen** und **Essens-Ideen**), Bild-Upload,
Sterne-Bewertungen und Gelb-Braun-Theme. Läuft unter <https://rezepte.project101.tech>, Anmeldung über Zitadel
(dieselben Konten wie labs-101), jeder angemeldete Nutzer darf alles.

**Stack:** Next.js (App Router) · PostgreSQL · direkter `pg`-Connector (kein ORM) · Tailwind CSS · sharp

## Lokal starten

```bash
cp .env.example .env.local   # AUTH_DEAKTIVIERT=true: lokal ohne Login
docker compose up -d         # nur die Datenbank
npm run dev
```

## Wie es funktioniert

| Pfad | Zweck |
| --- | --- |
| `/` | Startseite mit Kategorie-Auswahl und neuesten Rezepten |
| `/kochen`, `/backen` | Rezeptliste je Kategorie |
| `/rezept/[id]` | Detailseite – Text links, Bild rechts, eigene Bewertung |
| `/ideen` | Zwei Spalten: Mittagessen links, Abendessen rechts |
| `/neu` | Formular: Überschrift, ein Textfeld, optionales Bild |
| `/anmelden`, `/auth/*` | Login über Zitadel (OIDC, Code Flow mit PKCE) |
| `/api/health` | Health-Check für Kubernetes, ohne Login |

- **Datenbank:** Das Schema legt [lib/schema.ts](lib/schema.ts) beim Start des Servers an bzw. ergänzt es
  ([instrumentation.ts](instrumentation.ts)), Verbindung über `DATABASE_URL`.
- **Login:** [proxy.ts](proxy.ts) schickt jeden ohne Session zu `/anmelden`, [lib/auth.ts](lib/auth.ts) hält die
  Tokens verschlüsselt im Cookie und erneuert sie. Server Actions prüfen die Anmeldung zusätzlich selbst.
- **Bewertungen:** Tabelle `bewertungen`, eine pro Nutzer (Zitadel-ID) und Rezept, 1–5 Sterne.
- **Bilder:** werden im Browser auf 2400 px verkleinert, auf dem Server erkannt (am Inhalt, nicht an der Endung),
  HEIC umgewandelt, gedreht, auf 2000 px verkleinert, ohne Metadaten (GPS!) als WebP in `public/uploads/`
  gespeichert. Im Cluster liegt der Ordner auf einem Volume.

## Deployment

Jeder Push auf `main` baut `ghcr.io/dannyyy101/rezepte:<sha>` ([.github/workflows/image.yaml](.github/workflows/image.yaml))
und schreibt den Tag nach `values/rezepte.yaml` im [infra-Repo](https://github.com/Dannyyy101/infra), Argo CD
deployt ihn. Chart: `helm/rezepte` im infra-Repo.
