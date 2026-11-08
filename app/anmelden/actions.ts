"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as oidc from "openid-client";
import { APP_URL, holeSession, oidcKonfiguration, SESSION_COOKIE } from "@/lib/auth";

// beendet die Session hier und bei Zitadel, sonst wäre man beim nächsten Login sofort wieder drin
export async function abmelden() {
  const session = await holeSession();
  (await cookies()).delete(SESSION_COOKIE);

  let url = `${APP_URL}/anmelden`;
  try {
    url = oidc.buildEndSessionUrl(await oidcKonfiguration(), {
      post_logout_redirect_uri: url,
      ...(session?.idToken ? { id_token_hint: session.idToken } : {}),
    }).href;
  } catch (fehler) {
    // Zitadel nicht erreichbar, wenigstens die Session hier ist weg
    console.error("Abmelden bei Zitadel fehlgeschlagen", fehler);
  }
  redirect(url);
}
