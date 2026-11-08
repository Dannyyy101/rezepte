import { sichererPfad } from "@/lib/auth";

const FEHLER: Record<string, string> = {
  abgelaufen: "Die Anmeldung hat zu lange gedauert, bitte versuch es noch einmal.",
  fehlgeschlagen: "Die Anmeldung ist fehlgeschlagen, bitte versuch es noch einmal.",
};

export default async function AnmeldenSeite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { fehler, zurueck } = await searchParams;
  const ziel = sichererPfad(typeof zurueck === "string" ? zurueck : "/");
  const loginHref = `/auth/login?zurueck=${encodeURIComponent(ziel)}`;

  return (
    <div className="mx-auto mt-8 max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:mt-16">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Anmelden</h1>
      <p className="mt-2 text-stone-500">
        Das Rezeptbuch ist privat. Melde dich mit deinem Konto von project101 an.
      </p>
      {typeof fehler === "string" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {FEHLER[fehler] ?? FEHLER.fehlgeschlagen}
        </p>
      )}
      {/* ein normaler Link, der Route Handler leitet zu Zitadel weiter */}
      <a
        href={loginHref}
        className="mt-6 block w-full rounded-xl bg-stone-900 px-6 py-3.5 text-center text-lg font-semibold text-yellow-50 transition hover:bg-stone-700"
      >
        Anmelden
      </a>
    </div>
  );
}
