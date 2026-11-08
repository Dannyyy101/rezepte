import IdeenSpalte from "@/components/ideen-spalte";
import { pool, type EssensIdee } from "@/lib/db";
import { erstelleIdee, loescheIdee } from "./actions";

export const dynamic = "force-dynamic";

export default async function IdeenSeite() {

  const { rows: ideen } = await pool.query<EssensIdee>(
    "SELECT * FROM essens_ideen ORDER BY erstellt_am, id"
  );

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        Essens-Ideen
      </h1>
      <p className="mt-2 text-stone-500">
        Eine freie Liste – links Mittagessen, rechts Abendessen.
      </p>

      <div className="mt-8 grid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:grid-cols-2 sm:divide-x sm:divide-stone-200">
        <IdeenSpalte
          mahlzeit="mittag"
          titel="Mittagessen"
          akzent="bg-amber-900 text-amber-50"
          ideen={ideen.filter((idee) => idee.mahlzeit === "mittag")}
          erstelleIdee={erstelleIdee}
          loescheIdee={loescheIdee}
        />
        <IdeenSpalte
          mahlzeit="abend"
          titel="Abendessen"
          akzent="bg-yellow-400 text-stone-900"
          ideen={ideen.filter((idee) => idee.mahlzeit === "abend")}
          erstelleIdee={erstelleIdee}
          loescheIdee={loescheIdee}
        />
      </div>
    </div>
  );
}
