/** Reply-subject derivation, shared by the sweep (send time) and the platform
 *  form (live preview). Pure string work — no database, safe in a browser
 *  bundle, exported as `@vantrow/engine/subject`. */

/** Collapse any pile of leading Re:/RE: markers so threading never stacks
 *  "Re: Re:". Fwd: is left alone on purpose — forwarding is not threading. */
export function stripReplyPrefix(subject: string): string {
  return subject.replace(/^\s*(re\s*:\s*)+/i, "");
}

/** The subject a reply step sends, given the subject its thread opened with. */
export function replySubject(threadSubject: string): string {
  const base = stripReplyPrefix(threadSubject).trim();
  return base.length > 0 ? `Re: ${base}` : "Re:";
}
