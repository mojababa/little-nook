import { getAuth } from "@/server/auth";

// Better Auth's endpoints (sign-up, sign-in, sign-out, email verification,
// password reset…), called by the auth client in src/lib/auth-client.ts.
export function GET(request: Request) {
  return getAuth().handler(request);
}

export function POST(request: Request) {
  return getAuth().handler(request);
}
