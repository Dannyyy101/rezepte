import Link from "next/link";
import RezeptKarte from "@/components/rezept-karte";
import { pool, type Rezept } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { rows: neueste } = await pool.query<Rezept>(
    "SELECT * FROM rezepte ORDER BY erstellt_am DESC LIMIT 6"
  );

  return (
    <div className="space-y-16">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Was machst du heute?
        </h1>
        <p className="mt-2 text-stone-500">
          Deine Rezepte – Kochen, Backen und Ideen fürs Essen.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <Link
            href="/kochen"
            className="group rounded-3xl bg-amber-900 p-8 text-amber-50 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/20 sm:p-10"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-200/70">
              Kategorie
            </span>
            <span className="mt-2 block text-3xl font-bold">Kochen</span>
            <span className="mt-4 inline-block text-sm font-medium text-amber-200/80 transition group-hover:translate-x-1">
              Zu den Rezepten →
            </span>
          </Link>
          <Link
            href="/backen"
            className="group rounded-3xl bg-yellow-400 p-8 text-stone-900 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-400/30 sm:p-10"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-yellow-800/60">
              Kategorie
            </span>
            <span className="mt-2 block text-3xl font-bold">Backen</span>
            <span className="mt-4 inline-block text-sm font-medium text-yellow-900/70 transition group-hover:translate-x-1">
              Zu den Rezepten →
            </span>
          </Link>
          <Link
            href="/ideen"
            className="group rounded-3xl bg-orange-400 p-8 text-stone-900 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-400/30 sm:col-span-2 sm:p-10 lg:col-span-1"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-900/60">
              Kategorie
            </span>
            <span className="mt-2 block text-3xl font-bold">Essens-Ideen</span>
            <span className="mt-4 inline-block text-sm font-medium text-orange-900/70 transition group-hover:translate-x-1">
              Mittag- &amp; Abendessen →
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Neueste Rezepte
        </h2>
        {neueste.length === 0 ? (
          <p className="mt-4 text-stone-500">
            Noch keine Rezepte –{" "}
            <Link
              href="/neu"
              className="font-semibold text-amber-800 underline underline-offset-2"
            >
              leg gleich das erste an!
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {neueste.map((rezept) => (
              <RezeptKarte key={rezept.id} rezept={rezept} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
