/** Google OAuth for the Gmail adapter (Gate 4, dogfood test mode).
 *  Plain REST against Google's token endpoint — no SDK. Everything takes an
 *  injectable fetch so the suite tests the wire protocol without Google. */

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface OAuthAppConfig {
  clientId: string;
  clientSecret: string;
  fetchImpl?: FetchLike;
  now?: () => number;
}

/** Something that can produce a live access token on demand. */
export interface TokenSource {
  accessToken(): Promise<string>;
  /** Drop any cached token (called after a 401 so the next call refreshes). */
  invalidate(): void;
}

/** The consent URL for the connect flow (offline access => refresh token). */
export function buildAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
  loginHint?: string;
}): string {
  const p = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: (opts.scopes ?? GMAIL_SCOPES).join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  if (opts.state) p.set("state", opts.state);
  if (opts.loginHint) p.set("login_hint", opts.loginHint);
  return `${AUTH_ENDPOINT}?${p.toString()}`;
}

export interface TokenGrant {
  refreshToken?: string;
  accessToken: string;
  expiresAt: number; // epoch ms
  scopes: string[];
}

async function tokenCall(
  cfg: OAuthAppConfig,
  body: Record<string, string>,
): Promise<TokenGrant> {
  const fetchImpl = cfg.fetchImpl ?? fetch;
  const now = cfg.now ?? Date.now;
  const res = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      ...body,
    }).toString(),
  });
  const json = (await res.json()) as {
    access_token?: string; refresh_token?: string; expires_in?: number;
    scope?: string; error?: string; error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      `oauth_${json.error ?? res.status}: ${json.error_description ?? "token request failed"}`,
    );
  }
  return {
    refreshToken: json.refresh_token,
    accessToken: json.access_token,
    expiresAt: now() + (json.expires_in ?? 3600) * 1000,
    scopes: (json.scope ?? "").split(" ").filter(Boolean),
  };
}

/** One-time code exchange for the connect flow. */
export function exchangeCode(
  cfg: OAuthAppConfig,
  code: string,
  redirectUri: string,
): Promise<TokenGrant> {
  return tokenCall(cfg, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

/** Which Google account a grant actually belongs to.
 *
 *  The connect flow needs this, not as a nicety: `login_hint` only PRE-FILLS
 *  the account chooser. Someone signed into two Google accounts can hand us a
 *  grant for the wrong one, and we would then store those credentials against
 *  a mailbox row bearing a different address — every send from that mailbox
 *  would go out from an identity nobody chose. Verifying the address closes
 *  that, and users.getProfile is already inside the gmail.readonly scope we
 *  hold, so it costs no extra consent. */
export async function grantedAddress(
  accessToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<string | null> {
  const res = await fetchImpl(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const json = await res.json() as { emailAddress?: unknown };
  return typeof json.emailAddress === "string" ? json.emailAddress : null;
}

/** Long-lived source backed by a refresh token; refreshes ~60s early and can
 *  persist each new access token (into mailbox_credentials). */
export class RefreshTokenSource implements TokenSource {
  private cached: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly cfg: OAuthAppConfig,
    private readonly refreshToken: string,
    private readonly persist?: (accessToken: string, expiresAt: Date) => Promise<void>,
  ) {}

  async accessToken(): Promise<string> {
    const now = this.cfg.now ?? Date.now;
    if (this.cached && this.cached.expiresAt - now() > 60_000) {
      return this.cached.token;
    }
    const grant = await tokenCall(this.cfg, {
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });
    this.cached = { token: grant.accessToken, expiresAt: grant.expiresAt };
    await this.persist?.(grant.accessToken, new Date(grant.expiresAt));
    return grant.accessToken;
  }

  invalidate(): void {
    this.cached = null;
  }
}
