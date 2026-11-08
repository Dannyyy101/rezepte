import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { abmelden } from "./anmelden/actions";
import { holeSession } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mein Rezeptbuch",
  description: "Rezepte zum Kochen und Backen",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await holeSession();

  return (
    <html lang="de" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-10 bg-yellow-400 shadow-sm">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 sm:py-4">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-stone-900"
            >
              Mein Rezeptbuch
            </Link>
            {session && (
              <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Link
                  href="/kochen"
                  className="rounded-full px-3 py-2 font-medium text-stone-900 transition hover:bg-yellow-300 sm:px-4"
                >
                  Kochen
                </Link>
                <Link
                  href="/backen"
                  className="rounded-full px-3 py-2 font-medium text-stone-900 transition hover:bg-yellow-300 sm:px-4"
                >
                  Backen
                </Link>
                <Link
                  href="/ideen"
                  className="rounded-full px-3 py-2 font-medium text-stone-900 transition hover:bg-yellow-300 sm:px-4"
                >
                  Ideen
                </Link>
                <Link
                  href="/neu"
                  className="ml-1 rounded-full bg-stone-900 px-4 py-2 font-semibold text-yellow-50 transition hover:bg-stone-700"
                >
                  Neues Rezept
                </Link>
                <form action={abmelden}>
                  <button
                    type="submit"
                    title={`Abmelden (${session.benutzer.name || session.benutzer.email})`}
                    className="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-yellow-300"
                  >
                    Abmelden
                  </button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-400">
          Selbst gemacht schmeckt’s am besten.
        </footer>
      </body>
    </html>
  );
}
