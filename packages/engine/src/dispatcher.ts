/** The dispatcher seam (Gate 5): the engine's only door to the outside world.
 *  Whatever executes sends — Gmail adapter (B3), or a Temporal-class runner
 *  someday — implements this interface; engine semantics never change.
 *
 *  Contract:
 *  - `send` MUST be idempotent by `idempotencyKey` (I1): a retry carrying a
 *    key that already sent returns the original outcome, it does not resend.
 *  - `checkSent` answers whether ANY attempt for a touch (enrollment x step,
 *    epoch-agnostic) reached the wire. The sweep consults it before firing a
 *    bumped-epoch retry, closing I8's crash-after-ack window. The Gmail
 *    adapter implements it as a sent-mail search on the touch-ref header.
 */

export interface SendRequest {
  /** `${enrollmentId}:${stepOrder}:${attemptEpoch}` — also goes on the wire. */
  idempotencyKey: string;
  /** `${enrollmentId}:${stepOrder}` — epoch-agnostic touch identity. */
  touchRef: string;
  workspaceId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  threadAsReply: boolean;
}

export type SendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string };

export interface Provider {
  send(req: SendRequest): Promise<SendResult>;
  checkSent(touchRef: string): Promise<{ sent: boolean; providerMessageId?: string }>;
}

/** In-memory provider for the invariant suite and demo mode. Dedupes by key
 *  like the real adapter must, and can simulate transport failures and the
 *  crash-after-provider-ack window. */
export class FakeProvider implements Provider {
  private readonly delivered = new Map<string, { req: SendRequest; result: SendResult }>();
  /** Every send() call's key, in order — including deduped and failed ones. */
  readonly attempts: string[] = [];
  private readonly failKeys = new Set<string>();
  private readonly crashAfterAckKeys = new Set<string>();

  failNext(idempotencyKey: string): void {
    this.failKeys.add(idempotencyKey);
  }

  /** The named key's send succeeds at the provider, then the caller dies
   *  before it can record anything (throws after recording delivery). */
  crashAfterAck(idempotencyKey: string): void {
    this.crashAfterAckKeys.add(idempotencyKey);
  }

  async send(req: SendRequest): Promise<SendResult> {
    this.attempts.push(req.idempotencyKey);
    const prior = this.delivered.get(req.idempotencyKey);
    if (prior) return prior.result;
    if (this.failKeys.has(req.idempotencyKey)) {
      this.failKeys.delete(req.idempotencyKey);
      return { ok: false, error: "simulated transport failure" };
    }
    const result: SendResult = {
      ok: true,
      providerMessageId: `fake-${this.delivered.size + 1}`,
    };
    this.delivered.set(req.idempotencyKey, { req, result });
    if (this.crashAfterAckKeys.has(req.idempotencyKey)) {
      this.crashAfterAckKeys.delete(req.idempotencyKey);
      throw new Error("simulated crash after provider ack");
    }
    return result;
  }

  async checkSent(touchRef: string): Promise<{ sent: boolean; providerMessageId?: string }> {
    for (const [key, entry] of this.delivered) {
      if (key.startsWith(`${touchRef}:`) && entry.result.ok) {
        return { sent: true, providerMessageId: entry.result.providerMessageId };
      }
    }
    return { sent: false };
  }

  /** Distinct messages that actually reached the wire. */
  uniqueSendCount(): number {
    return this.delivered.size;
  }
}
