import Link from "next/link";
import { notFound } from "next/navigation";
import SterneAnzeige from "@/components/sterne";
import SterneBewertung from "@/components/sterne-bewertung";
import { holeSession } from "@/lib/auth";
import { pool, REZEPTE_MIT_BEWERTUNG, type RezeptMitBewertung } from "@/lib/db";
import { bewerteRezept } from "./actions";

export const dynamic = "force-dynamic";

export default async function RezeptSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const session = await holeSession();
  const [{ rows }, { rows: eigene }] = await Promise.all([
    pool.query<RezeptMitBewertung>(`${REZEPTE_MIT_BEWERTUNG} WHERE r.id = $1`, [id]),
    pool.query<{ sterne: number }>(
      "SELECT sterne FROM bewertungen WHERE rezept_id = $1 AND benutzer_id = $2",
      [id, session?.benutzer.id ?? ""]
    ),
  ]);
  const rezept = rows[0];
  if (!rezept) notFound();

  // der Server läuft in UTC, ohne Zeitzone wäre ein Rezept von 0:30 Uhr einen Tag zu früh datiert
  const datum = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "long",
    timeZone: "Europe/Berlin",
  }).format(
    new Date(rezept.erstellt_am)
  );

  return (
    <article className="flex flex-col gap-8 md:flex-row md:gap-12">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
              rezept.kategorie === "kochen"
                ? "bg-amber-100 text-amber-900"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {rezept.kategorie === "kochen" ? "Kochen" : "Backen"}
          </span>
          <Link
            href={`/rezept/${rezept.id}/bearbeiten`}
            className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:bg-white"
          >
            Bearbeiten
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          {rezept.titel}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <SterneAnzeige
            schnitt={rezept.sterne_schnitt}
            anzahl={rezept.anzahl_bewertungen}
          />
          <span className="text-sm text-stone-400">vom {datum}</span>
        </div>
        <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-stone-700">
          {rezept.inhalt}
        </p>
        <section className="mt-10 rounded-2xl border border-stone-200 bg-white px-5 py-4">
          <h2 className="mb-2 font-semibold text-stone-900">Bewerten</h2>
          <SterneBewertung
            rezeptId={rezept.id}
            eigeneSterne={eigene[0]?.sterne ?? null}
            bewerte={bewerteRezept}
          />
        </section>
      </div>
      {rezept.bild_pfad && (
        // Auf dem Handy zuerst das Foto, ab md rechts neben dem Text mitlaufend
        <div className="order-first md:order-0 md:sticky md:top-24 md:w-2/5 md:shrink-0 md:self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rezept.bild_pfad}
            alt={rezept.titel}
            className="w-full rounded-3xl border border-stone-200 object-cover shadow-md"
          />
        </div>
      )}
    </article>
  );
}
