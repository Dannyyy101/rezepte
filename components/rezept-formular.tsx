import type { Rezept } from "@/lib/db";

export default function RezeptFormular({
  action,
  rezept,
}: {
  action: (formData: FormData) => Promise<void>;
  rezept?: Rezept;
}) {
  return (
    <form action={action} className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        {rezept ? "Rezept bearbeiten" : "Neues Rezept"}
      </h1>

      {rezept && <input type="hidden" name="id" value={rezept.id} />}

      <fieldset className="mt-8">
        <legend className="mb-2 block font-medium text-stone-900">
          Kategorie
        </legend>
        <div className="flex gap-3">
          <label className="cursor-pointer rounded-full border-2 border-stone-200 bg-white px-5 py-2.5 font-medium text-stone-700 transition has-checked:border-amber-900 has-checked:bg-amber-900 has-checked:text-amber-50">
            <input
              type="radio"
              name="kategorie"
              value="kochen"
              defaultChecked={!rezept || rezept.kategorie === "kochen"}
              className="sr-only"
            />
            Kochen
          </label>
          <label className="cursor-pointer rounded-full border-2 border-stone-200 bg-white px-5 py-2.5 font-medium text-stone-700 transition has-checked:border-yellow-400 has-checked:bg-yellow-400 has-checked:text-stone-900">
            <input
              type="radio"
              name="kategorie"
              value="backen"
              defaultChecked={rezept?.kategorie === "backen"}
              className="sr-only"
            />
            Backen
          </label>
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="titel" className="mb-2 block font-medium text-stone-900">
          Überschrift
        </label>
        <input
          id="titel"
          name="titel"
          type="text"
          required
          defaultValue={rezept?.titel}
          placeholder="z. B. Omas Apfelkuchen"
          className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-yellow-400"
        />
      </div>

      <div className="mt-6">
        <label htmlFor="inhalt" className="mb-2 block font-medium text-stone-900">
          Rezept
        </label>
        <textarea
          id="inhalt"
          name="inhalt"
          required
          rows={12}
          defaultValue={rezept?.inhalt}
          placeholder={"Zutaten und Zubereitung – schreib einfach drauflos …"}
          className="w-full resize-y rounded-xl border-2 border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-yellow-400"
        />
      </div>

      <div className="mt-6">
        <label htmlFor="bild" className="mb-2 block font-medium text-stone-900">
          Bild <span className="font-normal text-stone-400">(optional)</span>
        </label>
        {rezept?.bild_pfad && (
          <div className="mb-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rezept.bild_pfad}
              alt={rezept.titel}
              className="h-20 w-20 rounded-xl border border-stone-200 object-cover"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                name="bild_entfernen"
                className="h-4 w-4 accent-amber-900"
              />
              Aktuelles Bild entfernen
            </label>
          </div>
        )}
        <input
          id="bild"
          name="bild"
          type="file"
          accept="image/*,.heic,.heif"
          className="w-full cursor-pointer rounded-xl border-2 border-dashed border-stone-300 bg-white px-4 py-3 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-amber-900 file:px-4 file:py-2 file:font-medium file:text-amber-50 hover:file:bg-amber-800"
        />
        {rezept?.bild_pfad && (
          <p className="mt-2 text-sm text-stone-400">
            Neues Bild auswählen, um das aktuelle zu ersetzen.
          </p>
        )}
      </div>

      <button
        type="submit"
        className="mt-10 w-full cursor-pointer rounded-xl bg-stone-900 px-6 py-3.5 text-lg font-semibold text-yellow-50 transition hover:bg-stone-700"
      >
        {rezept ? "Änderungen speichern" : "Rezept speichern"}
      </button>
    </form>
  );
}
