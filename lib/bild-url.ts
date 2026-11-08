// längste Kante je Anzeigegröße: Karten sind höchstens ~400 px breit (doppelt für Retina),
// die Detailseite zeigt das Bild höchstens ~800 px breit
export const BILD_GROESSEN = { klein: 800, gross: 2000 } as const;
export type BildGroesse = keyof typeof BILD_GROESSEN;

/** URL eines hochgeladenen Bildes (bild_pfad = /uploads/<datei>) in der passenden Größe. */
export function bildUrl(bildPfad: string, groesse: BildGroesse): string {
  if (!bildPfad.startsWith("/uploads/")) return bildPfad;
  return `/bild/${groesse}/${encodeURIComponent(bildPfad.slice("/uploads/".length))}`;
}
