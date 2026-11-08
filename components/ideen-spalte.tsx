"use client";

import { useRef } from "react";
import type { EssensIdee, Mahlzeit } from "@/lib/db";

export default function IdeenSpalte({
  mahlzeit,
  titel,
  akzent,
  ideen,
  erstelleIdee,
  loescheIdee,
}: {
  mahlzeit: Mahlzeit;
  titel: string;
  akzent: string;
  ideen: EssensIdee[];
  erstelleIdee: (formData: FormData) => Promise<void>;
  loescheIdee: (formData: FormData) => Promise<void>;
}) {
  const formular = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col">
      <h2
        className={`px-5 py-3 text-lg font-bold tracking-tight ${akzent}`}
      >
        {titel}
      </h2>

      <ul className="divide-y divide-stone-200">
        {ideen.length === 0 && (
          <li className="px-5 py-4 text-stone-400">Noch keine Ideen.</li>
        )}
        {ideen.map((idee) => (
          <li
            key={idee.id}
            className="group flex items-center justify-between gap-3 px-5 py-3"
          >
            <span className="font-medium text-stone-800">{idee.titel}</span>
            <form action={loescheIdee}>
              <input type="hidden" name="id" value={idee.id} />
              <button
                type="submit"
                aria-label={`„${idee.titel}“ löschen`}
                className="cursor-pointer rounded-full px-2 text-xl leading-none text-stone-300 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:text-stone-700 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              >
                ×
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form
        ref={formular}
        action={async (formData) => {
          await erstelleIdee(formData);
          formular.current?.reset();
        }}
        className="mt-auto flex gap-2 border-t border-stone-200 p-3"
      >
        <input type="hidden" name="mahlzeit" value={mahlzeit} />
        <input
          name="titel"
          type="text"
          required
          placeholder="Neue Idee …"
          className="w-full min-w-0 rounded-xl border-2 border-stone-200 bg-white px-3 py-2 outline-none transition focus:border-yellow-400"
        />
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-xl bg-stone-900 px-4 py-2 font-semibold text-yellow-50 transition hover:bg-stone-700"
        >
          +
        </button>
      </form>
    </div>
  );
}
