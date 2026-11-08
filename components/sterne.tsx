// Anzeige des Bewertungs-Schnitts, Sterne werden anteilig gefüllt (z. B. 4,5 = viereinhalb Sterne)

export function Stern({ fuellung, className }: { fuellung: number; className?: string }) {
  const prozent = Math.max(0, Math.min(1, fuellung)) * 100;
  return (
    <span className={`relative inline-block ${className ?? "h-5 w-5"}`} aria-hidden="true">
      <SternForm className="absolute inset-0 h-full w-full text-stone-300" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${prozent}%` }}>
        <SternForm className="h-full w-auto max-w-none text-yellow-500" />
      </span>
    </span>
  );
}

function SternForm({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ aspectRatio: "1" }}>
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

const formatiere = (zahl: number) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(zahl);

export default function SterneAnzeige({
  schnitt,
  anzahl,
  klein = false,
}: {
  schnitt: number | null;
  anzahl: number;
  klein?: boolean;
}) {
  const groesse = klein ? "h-4 w-4" : "h-5 w-5";

  if (schnitt === null || anzahl === 0) {
    return (
      <span className={`text-stone-400 ${klein ? "text-xs" : "text-sm"}`}>
        Noch nicht bewertet
      </span>
    );
  }

  const text = `${formatiere(schnitt)} von 5 Sternen, ${anzahl} ${anzahl === 1 ? "Bewertung" : "Bewertungen"}`;
  return (
    <span className="inline-flex items-center gap-1.5" title={text}>
      <span className="sr-only">{text}</span>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Stern key={n} fuellung={schnitt - (n - 1)} className={groesse} />
        ))}
      </span>
      <span className={`font-medium text-stone-600 ${klein ? "text-xs" : "text-sm"}`} aria-hidden="true">
        {formatiere(schnitt)} <span className="text-stone-400">({anzahl})</span>
      </span>
    </span>
  );
}
