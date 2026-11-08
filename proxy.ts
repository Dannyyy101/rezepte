import { NextRequest, NextResponse } from "next/server";
import {
  APP_URL,
  entschluesseleSession,
  erneuereSession,
  LOGIN_AUS,
  mussErneuertWerden,
  SESSION_COOKIE,
  sessionCookieOptionen,
  verschluesseleSession,
} from "@/lib/auth";

// Jede Seite, jede Server Action und jedes Bild läuft hier durch: ohne Anmeldung geht es zur Login-Seite.
// Hier und nur hier werden die Tokens erneuert, Server Components können keine Cookies schreiben.
export async function proxy(request: NextRequest) {
  if (LOGIN_AUS) return NextResponse.next();

  let session = await entschluesseleSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (session && mussErneuertWerden(session)) {
    try {
      session = await erneuereSession(session);
    } catch {
      // Zitadel nicht erreichbar: Session behalten, beim nächsten Request neu versuchen
      return NextResponse.next();
    }
    if (session) {
      const wert = await verschluesseleSession(session);
      // das neue Cookie für diesen Request, die Seite rendert nach dem Proxy
      request.cookies.set(SESSION_COOKIE, wert);
      const antwort = NextResponse.next({ request: { headers: request.headers } });
      // und für den Browser
      antwort.cookies.set(SESSION_COOKIE, wert, sessionCookieOptionen());
      return antwort;
    }
  }

  if (!session) {
    const anmelden = new URL("/anmelden", APP_URL);
    anmelden.searchParams.set("zurueck", request.nextUrl.pathname + request.nextUrl.search);
    const antwort = NextResponse.redirect(anmelden);
    antwort.cookies.delete(SESSION_COOKIE);
    return antwort;
  }

  return NextResponse.next();
}

export const config = {
  // frei: Health-Check, der Login selbst und die Assets der Login-Seite
  matcher: ["/((?!api/health|auth/|anmelden|_next/static|_next/image|favicon.ico).*)"],
};
