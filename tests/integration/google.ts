import { randomUUID } from "node:crypto";

import { vi } from "vitest";

import type { Auth } from "@/server/auth/auth";

import { testBaseUrl, uniqueEmail } from "./fixtures";

/** The parts of a Google ID token Little Nook reads. */
export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
};

/** A Google account that hasn't been seen before, with a verified email. */
export function googleProfile(
  overrides: Partial<GoogleProfile> = {},
): GoogleProfile {
  return {
    sub: randomUUID(),
    email: uniqueEmail(),
    email_verified: true,
    name: "Ana",
    ...overrides,
  };
}

const tokenEndpoint = "https://oauth2.googleapis.com/token";

/**
 * Stands in for Google's token endpoint. The authorization code the test
 * "brings back from Google" is the profile itself, so the token response
 * carries an ID token for that profile. Other requests go to the real fetch.
 * Returns a function that restores fetch.
 */
export function fakeGoogleTokenEndpoint(): () => void {
  const realFetch = globalThis.fetch;
  const spy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      if (request.url !== tokenEndpoint) return realFetch(input, init);
      const code = new URLSearchParams(await request.text()).get("code");
      return Response.json({
        access_token: `access-${randomUUID()}`,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email profile",
        id_token: unsignedJwt(decodeCode(code!)),
      });
    });
  return () => spy.mockRestore();
}

function encodeCode(profile: GoogleProfile): string {
  return Buffer.from(JSON.stringify(profile)).toString("base64url");
}

function decodeCode(code: string): GoogleProfile {
  return JSON.parse(Buffer.from(code, "base64url").toString());
}

function unsignedJwt(profile: GoogleProfile): string {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return [
    part({ alg: "none", typ: "JWT" }),
    part({
      iss: "https://accounts.google.com",
      aud: "test-google-client",
      iat: now,
      exp: now + 3600,
      ...profile,
    }),
    "",
  ].join(".");
}

/**
 * A browser talking to the auth endpoints: it keeps the cookies they set and
 * sends them back, like a real one.
 */
export function createBrowser(auth: Auth) {
  const cookies = new Map<string, string>();

  async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("origin", testBaseUrl);
    if (cookies.size) {
      headers.set(
        "cookie",
        [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
      );
    }
    const response = await auth.handler(
      new Request(new URL(path, testBaseUrl), { ...init, headers }),
    );
    for (const cookie of response.headers.getSetCookie()) {
      const [pair, ...attributes] = cookie.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      const expired = attributes.some((a) => /^\s*max-age=0\s*$/i.test(a));
      if (expired || !value) cookies.delete(name.trim());
      else cookies.set(name.trim(), value);
    }
    return response;
  }

  async function post(path: string, body: object) {
    return request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  /** Where Google sends the browser back to after the user picks `profile`. */
  async function returnFromGoogle(
    authorizationUrl: string,
    profile: GoogleProfile,
  ) {
    const state = new URL(authorizationUrl).searchParams.get("state");
    const response = await request(
      `/api/auth/callback/google?code=${encodeCode(profile)}&state=${state}`,
    );
    const location = response.headers.get("location");
    if (!location) {
      throw new Error(`Callback didn't redirect (${response.status})`);
    }
    return new URL(location, testBaseUrl);
  }

  return {
    request,
    post,

    /** Logs in with email and password. */
    async logIn(email: string, password: string) {
      const response = await post("/api/auth/sign-in/email", {
        email,
        password,
      });
      if (!response.ok) throw new Error(`Log-in failed: ${response.status}`);
    },

    /**
     * "Continue with Google" as the sign-up and log-in pages do it, choosing
     * `profile` at Google. Resolves to where the app lands the browser.
     */
    async continueWithGoogle(profile: GoogleProfile) {
      const response = await post("/api/auth/sign-in/social", {
        provider: "google",
        callbackURL: "/home",
        newUserCallbackURL: "/welcome",
        errorCallbackURL: "/login",
        disableRedirect: true,
      });
      const { url } = await response.json();
      return returnFromGoogle(url, profile);
    },

    /** "Link Google" in settings, choosing `profile` at Google. */
    async linkGoogle(profile: GoogleProfile) {
      const response = await post("/api/auth/link-social", {
        provider: "google",
        callbackURL: "/settings",
        errorCallbackURL: "/settings",
        disableRedirect: true,
      });
      if (!response.ok) throw new Error(`Link failed: ${response.status}`);
      const { url } = await response.json();
      return returnFromGoogle(url, profile);
    },

    /** The logged-in user, or null. */
    async currentUser(): Promise<{ id: string; email: string } | null> {
      const response = await request("/api/auth/get-session");
      return (await response.json())?.user ?? null;
    },

    /** The logged-in user's sign-in methods, e.g. ["credential", "google"]. */
    async signInMethods(): Promise<{ id: string; providerId: string }[]> {
      const response = await request("/api/auth/list-accounts");
      return response.json();
    },
  };
}

export type Browser = ReturnType<typeof createBrowser>;
