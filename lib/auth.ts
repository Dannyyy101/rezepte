import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import * as oidc from "openid-client";

// Angemeldet wird nur über Zitadel (derselbe Login wie bei labs-101). Die App hat keine eigene
// Nutzertabelle: die Tokens liegen verschlüsselt in einem Cookie, jeder Nutzer aus Zitadel darf alles.

export const SESSION_COOKIE = "rezepte_session";
export const LOGIN_COOKIE = "rezepte_login";

export type Benutzer = {
  id: string;
  name: string;
  email: string;
};

export type Session = {
  benutzer: Benutzer;
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  // Sekunden seit 1970
  laeuftAbUm: number;
};

/** Was zwischen der Weiterleitung zu Zitadel und dem Callback bekannt sein muss. */
type LoginStatus = {
  codeVerifier: string;
  state: string;
  zurueckZu: string;
};

const ISSUER = process.env.AUTH_ISSUER ?? "https://auth.project101.tech";
const CLIENT_ID = process.env.AUTH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? "";
// öffentliche URL der App, hinter dem Tunnel kennt request.url nur den Container
export const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const CALLBACK_URL = `${APP_URL}/auth/callback`;

/**
 * Nur für die lokale Entwicklung ohne Zitadel: AUTH_DEAKTIVIERT=true. In Produktion wird der Schalter ignoriert.
 */
export const LOGIN_AUS =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DEAKTIVIERT === "true";
const DEV_SESSION: Session = {
  benutzer: { id: "dev", name: "Entwicklung", email: "dev@localhost" },
  accessToken: "",
  refreshToken: null,
  idToken: null,
  laeuftAbUm: Number.MAX_SAFE_INTEGER,
};

// offline_access für das Refresh-Token
const SCOPE = "openid profile email offline_access";
// eine Minute früher erneuern, damit das Token nicht zwischen Prüfung und Nutzung abläuft
const ERNEUERN_VORLAUF_SEKUNDEN = 60;
// wie lange eine Anmeldung hält, entscheidet Zitadel (Refresh-Token), das Cookie darf nicht früher ablaufen.
// Browser begrenzen Cookies auf 400 Tage.
const SESSION_MAX_AGE_SEKUNDEN = 60 * 60 * 24 * 400;

let konfiguration: Promise<oidc.Configuration> | null = null;

export function oidcKonfiguration(): Promise<oidc.Configuration> {
  konfiguration ??= oidc
    .discovery(new URL(ISSUER), CLIENT_ID, CLIENT_SECRET, undefined, {
      // nur lokal läuft Zitadel ohne TLS
      execute: ISSUER.startsWith("http://") ? [oidc.allowInsecureRequests] : [],
    })
    .catch((fehler) => {
      // beim nächsten Request neu versuchen, statt den Fehler zu cachen
      konfiguration = null;
      throw fehler;
    });
  return konfiguration;
}

async function schluessel(): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET ist nicht gesetzt");
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))
  );
}

async function verschluessele(inhalt: object, maxAgeSekunden: number): Promise<string> {
  return new EncryptJWT({ ...inhalt })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSekunden}s`)
    .encrypt(await schluessel());
}

async function entschluessele<T>(wert: string | undefined): Promise<T | null> {
  if (!wert) return null;
  try {
    const { payload } = await jwtDecrypt(wert, await schluessel());
    return payload as T;
  } catch {
    // manipuliert, abgelaufen oder mit einem alten Secret verschlüsselt
    return null;
  }
}

export const cookieOptionen = (maxAge: number) => ({
  httpOnly: true,
  secure: APP_URL.startsWith("https://"),
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export const verschluesseleSession = (session: Session) =>
  verschluessele(session, SESSION_MAX_AGE_SEKUNDEN);
export const entschluesseleSession = (wert: string | undefined) =>
  entschluessele<Session>(wert);
export const sessionCookieOptionen = () => cookieOptionen(SESSION_MAX_AGE_SEKUNDEN);

export const verschluesseleLoginStatus = (status: LoginStatus) => verschluessele(status, 600);
export const entschluesseleLoginStatus = (wert: string | undefined) =>
  entschluessele<LoginStatus>(wert);

export const mussErneuertWerden = (session: Session) =>
  session.laeuftAbUm - ERNEUERN_VORLAUF_SEKUNDEN <= Date.now() / 1000;

type Tokens = oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;

/**
 * Session aus den Tokens von Zitadel. Name und E-Mail kommen vom Userinfo-Endpunkt,
 * im ID-Token stehen sie nur, wenn "User Info inside ID Token" in Zitadel an ist.
 */
export async function sessionAusTokens(tokens: Tokens, vorher?: Session): Promise<Session> {
  const claims = tokens.claims();
  const subject = claims?.sub ?? vorher?.benutzer.id;
  const info = subject ? await userInfo(tokens.access_token, subject) : null;
  const daten = { ...claims, ...info };
  const benutzer: Benutzer = daten.sub
    ? {
        id: daten.sub,
        name: String(daten.name ?? daten.preferred_username ?? daten.email ?? ""),
        email: String(daten.email ?? ""),
      }
    : vorher!.benutzer;
  return {
    benutzer,
    accessToken: tokens.access_token,
    // Zitadel rotiert Refresh-Tokens, kommt keins zurück, das alte behalten
    refreshToken: tokens.refresh_token ?? vorher?.refreshToken ?? null,
    idToken: tokens.id_token ?? vorher?.idToken ?? null,
    laeuftAbUm: Math.floor(Date.now() / 1000) + (tokens.expiresIn() ?? 300),
  };
}

// ein fehlgeschlagener Userinfo-Request darf den Login nicht verhindern, dann gilt das ID-Token
async function userInfo(accessToken: string, subject: string) {
  try {
    return await oidc.fetchUserInfo(await oidcKonfiguration(), accessToken, subject);
  } catch (fehler) {
    console.error("Userinfo konnte nicht geladen werden", fehler);
    return null;
  }
}

// Zitadel rotiert das Refresh-Token bei jeder Nutzung. Seite, Prefetches und Server Actions, die mit demselben
// alten Cookie ankommen, müssen sich eine Erneuerung teilen, eine zweite mit dem alten Token würde abgelehnt
// und den Nutzer abmelden. Das Ergebnis bleibt eine Weile für Nachzügler erhalten.
const WIEDERVERWENDEN_MS = 2 * 60 * 1000;
const erneuerungen = new Map<string, Promise<Session | null>>();

/**
 * Neue Tokens für eine ablaufende Session, null wenn das Refresh-Token nicht mehr gilt.
 * Wirft, wenn Zitadel nicht erreichbar war, die Session ist dann noch in Ordnung.
 */
export function erneuereSession(session: Session): Promise<Session | null> {
  const refreshToken = session.refreshToken;
  if (!refreshToken) return Promise.resolve(null);

  let erneuerung = erneuerungen.get(refreshToken);
  if (!erneuerung) {
    erneuerung = frageErneuerungAn(session, refreshToken);
    erneuerungen.set(refreshToken, erneuerung);
    erneuerung.then(
      () => setTimeout(() => erneuerungen.delete(refreshToken), WIEDERVERWENDEN_MS),
      () => erneuerungen.delete(refreshToken)
    );
  }
  return erneuerung;
}

async function frageErneuerungAn(session: Session, refreshToken: string): Promise<Session | null> {
  try {
    const tokens = await oidc.refreshTokenGrant(await oidcKonfiguration(), refreshToken);
    return await sessionAusTokens(tokens, session);
  } catch (fehler) {
    // nur invalid_grant heißt: abgelaufen oder widerrufen
    if (fehler instanceof oidc.ResponseBodyError && fehler.error === "invalid_grant") {
      console.warn("Refresh-Token abgelehnt, Nutzer wird abgemeldet", fehler.error_description);
      return null;
    }
    console.error("Session konnte nicht erneuert werden", fehler);
    throw fehler;
  }
}

/** Nur relative Pfade dieser App, sonst wäre der Login eine offene Weiterleitung. */
export const sichererPfad = (pfad: string | null | undefined) =>
  pfad && pfad.startsWith("/") && !pfad.startsWith("//") && !pfad.startsWith("/\\") ? pfad : "/";

export async function loginUrl(zurueckZu: string): Promise<{ url: URL; status: LoginStatus }> {
  const config = await oidcKonfiguration();
  const status: LoginStatus = {
    codeVerifier: oidc.randomPKCECodeVerifier(),
    state: oidc.randomState(),
    zurueckZu: sichererPfad(zurueckZu),
  };
  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: CALLBACK_URL,
    scope: SCOPE,
    code_challenge: await oidc.calculatePKCECodeChallenge(status.codeVerifier),
    code_challenge_method: "S256",
    state: status.state,
  });
  return { url, status };
}

/** Die Session des angemeldeten Nutzers, der Proxy hat die Tokens schon erneuert. */
export async function holeSession(): Promise<Session | null> {
  if (LOGIN_AUS) return DEV_SESSION;
  return entschluesseleSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Für Server Actions: Der Proxy schützt die Seiten, Actions prüfen trotzdem selbst. */
export async function angemeldeterBenutzer(): Promise<Benutzer> {
  const session = await holeSession();
  if (!session) throw new Error("Nicht angemeldet");
  return session.benutzer;
}
