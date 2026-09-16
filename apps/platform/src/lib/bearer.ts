/** Bearer-token gate for the machine endpoints (the cron tick, the family
 *  console's metrics). One rule, in one place: an unset secret means LOCKED,
 *  never open, and the comparison is constant-time so a wrong guess costs
 *  the same as a nearly-right one. */

import { timingSafeEqual } from "node:crypto";

export function authorizedBearer(req: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  const a = Buffer.from(header.slice(prefix.length));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
