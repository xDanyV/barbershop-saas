import { NextResponse } from "next/server";
import {
  ACTIVE_BUSINESS_COOKIE,
  MANAGED_BARBER_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    expires: new Date(0),
  });

  response.cookies.delete(ACTIVE_BUSINESS_COOKIE);
  response.cookies.delete(MANAGED_BARBER_COOKIE);

  return response;
}
