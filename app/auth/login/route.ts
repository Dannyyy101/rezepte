import { NextRequest, NextResponse } from "next/server";
import { cookieOptionen, LOGIN_COOKIE, loginUrl, verschluesseleLoginStatus } from "@/lib/auth";

// leitet zum Login von Zitadel weiter, von dort geht es zurück zu /auth/callback
export async function GET(request: NextRequest) {
  const { url, status } = await loginUrl(request.nextUrl.searchParams.get("zurueck") ?? "/");

  const antwort = NextResponse.redirect(url);
  antwort.cookies.set(LOGIN_COOKIE, await verschluesseleLoginStatus(status), cookieOptionen(600));
  return antwort;
}
