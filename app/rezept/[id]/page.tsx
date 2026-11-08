import Link from "next/link";
import { notFound } from "next/navigation";
import { pool, type Rezept } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RezeptSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { rows } = await pool.query<Rezept>(
    "SELECT * FROM rezepte WHERE id = $1",
    [id]
  );
  const rezept = rows[0];
  if (!rezept) notFound();

  const datum = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(
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
        <p className="mt-1 text-sm text-stone-400">vom {datum}</p>
        <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-stone-700">
          {rezept.inhalt}
        </p>
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
