import { NextRequest, NextResponse } from "next/server";
import * as oidc from "openid-client";
import {
  APP_URL,
  CALLBACK_URL,
  entschluesseleLoginStatus,
  LOGIN_COOKIE,
  oidcKonfiguration,
  SESSION_COOKIE,
  sessionAusTokens,
  sessionCookieOptionen,
  verschluesseleSession,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const login = await entschluesseleLoginStatus(request.cookies.get(LOGIN_COOKIE)?.value);
  if (!login) {
    // Login hat zu lange gedauert oder wurde in einem anderen Browser begonnen
    return NextResponse.redirect(`${APP_URL}/anmelden?fehler=abgelaufen`);
  }

  try {
    // die URL, zu der Zitadel weitergeleitet hat, request.url ist hinter dem Tunnel die interne
    const aktuelleUrl = new URL(CALLBACK_URL);
    aktuelleUrl.search = request.nextUrl.search;

    const tokens = await oidc.authorizationCodeGrant(await oidcKonfiguration(), aktuelleUrl, {
      pkceCodeVerifier: login.codeVerifier,
      expectedState: login.state,
    });

    const antwort = NextResponse.redirect(`${APP_URL}${login.zurueckZu}`);
    antwort.cookies.set(
      SESSION_COOKIE,
      await verschluesseleSession(await sessionAusTokens(tokens)),
      sessionCookieOptionen()
    );
    antwort.cookies.delete(LOGIN_COOKIE);
    return antwort;
  } catch (fehler) {
    console.error("Anmeldung fehlgeschlagen", fehler);
    return NextResponse.redirect(`${APP_URL}/anmelden?fehler=fehlgeschlagen`);
  }
}
