"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { Rezept } from "@/lib/db";
import type { FormularStatus } from "@/lib/rezept-formular";

// längste Seite nach dem Verkleinern im Browser, der Server verkleinert danach auf 2000 px
const MAX_KANTE = 2400;
// etwas unter dem Limit der Server Action (next.config.ts), der Rest des Formulars braucht auch Platz
const MAX_BYTES = 24 * 1024 * 1024;

/**
 * Verkleinert Fotos vor dem Hochladen: Handyfotos haben oft 5–15 MB, das dauert über
 * mobiles Netz lange und brach bisher ab. Kann der Browser das Bild nicht lesen
 * (z. B. HEIC in Chrome), geht das Original hoch und der Server wandelt es um.
 */
async function verkleinere(datei: File): Promise<File> {
  // animierte GIFs würden auf ein Standbild reduziert
  if (datei.type === "image/gif") return datei;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(datei, { imageOrientation: "from-image" });
  } catch {
    return datei;
  }

  try {
    const faktor = Math.min(1, MAX_KANTE / Math.max(bitmap.width, bitmap.height));
    // kleine JPEG/WebP lohnen das neue Kodieren nicht
    if (faktor === 1 && datei.size < 1.5 * 1024 * 1024 && /image\/(jpeg|webp)/.test(datei.type)) {
      return datei;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * faktor);
    canvas.height = Math.round(bitmap.height * faktor);
    const ctx = canvas.getContext("2d");
    if (!ctx) return datei;
    // JPEG kennt keine Transparenz, ohne Hintergrund würde sie schwarz
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88)
    );
    if (!blob || blob.size >= datei.size) return datei;
    const name = datei.name.replace(/\.[^.]*$/, "") || "foto";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return datei;
  } finally {
    bitmap.close();
  }
}

export default function RezeptFormular({
  action,
  rezept,
}: {
  action: (vorher: FormularStatus, formData: FormData) => Promise<FormularStatus>;
  rezept?: Rezept;
}) {
  const [status, formAction, speichert] = useActionState(action, { fehler: null });
  const [vorbereiten, setVorbereiten] = useState(false);
  const [lokalerFehler, setLokalerFehler] = useState<string | null>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);

  // die Vorschau-URL wieder freigeben, sonst bleibt das Bild im Speicher
  useEffect(
    () => () => {
      if (vorschau) URL.revokeObjectURL(vorschau);
    },
    [vorschau]
  );

  const beschaeftigt = vorbereiten || speichert;
  const fehler = lokalerFehler ?? status.fehler;

  // Eigenes onSubmit statt <form action>: React setzt das Formular nach einer Action zurück,
  // bei einem Fehler wären sonst Titel und Text weg. Außerdem wird hier das Bild verkleinert.
  async function absenden(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (beschaeftigt) return;
    const formData = new FormData(event.currentTarget);
    setLokalerFehler(null);

    const bild = formData.get("bild");
    if (bild instanceof File && bild.size > 0) {
      setVorbereiten(true);
      const klein = await verkleinere(bild);
      setVorbereiten(false);
      if (klein.size > MAX_BYTES) {
        setLokalerFehler(
          `Das Bild ist zu groß (${Math.round(klein.size / 1024 / 1024)} MB, höchstens 24 MB).`
        );
        return;
      }
      formData.set("bild", klein, klein.name);
    }

    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={absenden} className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        {rezept ? "Rezept bearbeiten" : "Neues Rezept"}
      </h1>

      {rezept && <input type="hidden" name="id" value={rezept.id} />}

      <fieldset className="mt-8">
        <legend className="mb-2 block font-medium text-stone-900">
          Kategorie
        </legend>
        <div className="flex gap-3">
          <label className="cursor-pointer rounded-full border-2 border-stone-200 bg-white px-5 py-2.5 font-medium text-stone-700 transition has-checked:border-amber-900 has-checked:bg-amber-900 has-checked:text-amber-50 has-focus-visible:ring-2 has-focus-visible:ring-yellow-400">
            <input
              type="radio"
              name="kategorie"
              value="kochen"
              defaultChecked={!rezept || rezept.kategorie === "kochen"}
              className="sr-only"
            />
            Kochen
          </label>
          <label className="cursor-pointer rounded-full border-2 border-stone-200 bg-white px-5 py-2.5 font-medium text-stone-700 transition has-checked:border-yellow-400 has-checked:bg-yellow-400 has-checked:text-stone-900 has-focus-visible:ring-2 has-focus-visible:ring-amber-900">
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
        {(vorschau || rezept?.bild_pfad) && (
          <div className="mb-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vorschau ?? rezept!.bild_pfad!}
              alt={vorschau ? "Vorschau des neuen Bildes" : rezept!.titel}
              className="h-20 w-20 rounded-xl border border-stone-200 bg-stone-100 object-cover"
            />
            {vorschau ? (
              <span className="text-sm text-stone-500">Neues Bild</span>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  name="bild_entfernen"
                  className="h-4 w-4 accent-amber-900"
                />
                Aktuelles Bild entfernen
              </label>
            )}
          </div>
        )}
        <input
          id="bild"
          name="bild"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(event) => {
            const datei = event.target.files?.[0];
            setLokalerFehler(null);
            // HEIC kann außer Safari kaum ein Browser anzeigen, dann bleibt die Vorschau leer
            setVorschau(datei ? URL.createObjectURL(datei) : null);
          }}
          className="w-full cursor-pointer rounded-xl border-2 border-dashed border-stone-300 bg-white px-4 py-3 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-amber-900 file:px-4 file:py-2 file:font-medium file:text-amber-50 hover:file:bg-amber-800"
        />
        {rezept?.bild_pfad && !vorschau && (
          <p className="mt-2 text-sm text-stone-400">
            Neues Bild auswählen, um das aktuelle zu ersetzen.
          </p>
        )}
      </div>

      {fehler && (
        <p role="alert" className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-red-800">
          {fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={beschaeftigt}
        className="mt-8 w-full cursor-pointer rounded-xl bg-stone-900 px-6 py-3.5 text-lg font-semibold text-yellow-50 transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-70"
      >
        {vorbereiten
          ? "Bild wird vorbereitet …"
          : speichert
            ? "Wird gespeichert …"
            : rezept
              ? "Änderungen speichern"
              : "Rezept speichern"}
      </button>
    </form>
  );
}
