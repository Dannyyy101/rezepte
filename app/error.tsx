"use client";

// statt der leeren Standard-Fehlerseite von Next.js
export default function Fehler({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Da ist etwas schiefgelaufen</h1>
      <p className="mt-2 text-stone-500">Bitte versuch es gleich noch einmal.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 cursor-pointer rounded-xl bg-stone-900 px-6 py-3 font-semibold text-yellow-50 transition hover:bg-stone-700"
      >
        Neu laden
      </button>
    </div>
  );
}
