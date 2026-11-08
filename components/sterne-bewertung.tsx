"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Stern } from "./sterne";

const BESCHRIFTUNG = ["", "Geht so", "Ganz okay", "Gut", "Sehr gut", "Hervorragend"];

/** Die eigene Bewertung: Klick auf einen Stern speichert sofort, erneuter Klick nimmt sie zurück. */
export default function SterneBewertung({
  rezeptId,
  eigeneSterne,
  bewerte,
}: {
  rezeptId: number;
  eigeneSterne: number | null;
  bewerte: (rezeptId: number, sterne: number | null) => Promise<void>;
}) {
  const [sterne, setzeOptimistisch] = useOptimistic(eigeneSterne);
  const [hover, setHover] = useState<number | null>(null);
  const [fehler, setFehler] = useState(false);
  const [, startTransition] = useTransition();

  const angezeigt = hover ?? sterne ?? 0;

  function waehle(n: number) {
    const neu = n === sterne ? null : n;
    setFehler(false);
    startTransition(async () => {
      setzeOptimistisch(neu);
      try {
        await bewerte(rezeptId, neu);
      } catch {
        setFehler(true);
      }
    });
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Deine Bewertung"
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={sterne === n}
            aria-label={`${n} ${n === 1 ? "Stern" : "Sterne"} – ${BESCHRIFTUNG[n]}`}
            onClick={() => waehle(n)}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            className="cursor-pointer rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-yellow-500"
          >
            <Stern fuellung={angezeigt >= n ? 1 : 0} className="h-8 w-8" />
          </button>
        ))}
        <span className="ml-2 text-sm text-stone-500">
          {hover
            ? BESCHRIFTUNG[hover]
            : sterne
              ? `Deine Bewertung: ${BESCHRIFTUNG[sterne]}`
              : "Wie fandest du es?"}
        </span>
      </div>
      {fehler && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Die Bewertung konnte nicht gespeichert werden.
        </p>
      )}
    </div>
  );
}
