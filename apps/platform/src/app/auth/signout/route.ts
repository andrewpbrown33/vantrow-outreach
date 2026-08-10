/** Sign out. POST only — a GET would let any page log someone out with an
 *  <img> tag. */

import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/signin", req.url), { status: 303 });
}
