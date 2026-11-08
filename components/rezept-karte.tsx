import Link from "next/link";
import type { RezeptMitBewertung } from "@/lib/db";
import SterneAnzeige from "./sterne";

const KATEGORIE_STIL = {
  kochen: {
    label: "Kochen",
    badge: "bg-amber-100 text-amber-900",
    platzhalter: "bg-amber-100 text-amber-900/25",
  },
  backen: {
    label: "Backen",
    badge: "bg-yellow-100 text-yellow-800",
    platzhalter: "bg-yellow-100 text-yellow-800/25",
  },
} as const;

export default function RezeptKarte({ rezept }: { rezept: RezeptMitBewertung }) {
  const stil = KATEGORIE_STIL[rezept.kategorie];

  return (
    <Link
      href={`/rezept/${rezept.id}`}
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
    >
      <div
        className={`flex aspect-[4/3] items-center justify-center overflow-hidden ${stil.platzhalter}`}
      >
        {rezept.bild_pfad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rezept.bild_pfad}
            alt={rezept.titel}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-7xl font-bold">
            {rezept.titel.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        <h3 className="font-semibold text-stone-900 group-hover:text-amber-800">
          {rezept.titel}
        </h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stil.badge}`}
          >
            {stil.label}
          </span>
          <SterneAnzeige
            schnitt={rezept.sterne_schnitt}
            anzahl={rezept.anzahl_bewertungen}
            klein
          />
        </div>
      </div>
    </Link>
  );
}
