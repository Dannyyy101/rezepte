import Link from "next/link";
import { notFound } from "next/navigation";
import RezeptKarte from "@/components/rezept-karte";
import { pool, REZEPTE_MIT_BEWERTUNG, type RezeptMitBewertung } from "@/lib/db";

export const dynamic = "force-dynamic";

const KATEGORIEN = {
  kochen: { titel: "Kochen", beschreibung: "Herzhaftes für Herd und Pfanne." },
  backen: { titel: "Backen", beschreibung: "Süßes aus dem Ofen." },
} as const;

export default async function KategorieSeite({
  params,
}: {
  params: Promise<{ kategorie: string }>;
}) {
  const { kategorie } = await params;
  if (!(kategorie in KATEGORIEN)) notFound();
  const info = KATEGORIEN[kategorie as keyof typeof KATEGORIEN];

  const { rows: rezepte } = await pool.query<RezeptMitBewertung>(
    `${REZEPTE_MIT_BEWERTUNG} WHERE r.kategorie = $1 ORDER BY r.erstellt_am DESC`,
    [kategorie]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        {info.titel}
      </h1>
      <p className="mt-2 text-stone-500">{info.beschreibung}</p>
      {rezepte.length === 0 ? (
        <p className="mt-8 text-stone-500">
          Hier ist noch nichts –{" "}
          <Link
            href="/neu"
            className="font-semibold text-amber-800 underline underline-offset-2"
          >
            füge das erste Rezept hinzu!
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {rezepte.map((rezept) => (
            <RezeptKarte key={rezept.id} rezept={rezept} />
          ))}
        </div>
      )}
    </div>
  );
}
