/** The producer proved against the CONTRACT ITSELF: every payload we emit is
 *  validated with the spec's own normative JSON Schemas (the same ones the CI
 *  fixture job uses), not against our idea of them. Eaverow specced Connect
 *  and shipped 0% because nothing mechanically checked the producer — this is
 *  that check. */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  buildEnvelope, connectId, mapSequenceStatus, newEventId, prospectToContact,
  sequenceToProject, signPayload, verifySignature,
} from "./index";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const addFormats = require("ajv-formats").default;

const specDir = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..", "..", "..", "docs", "specs", "vantrow-connect",
);
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
for (const dir of [join(specDir, "schemas"), join(specDir, "schemas", "events")]) {
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    ajv.addSchema(JSON.parse(readFileSync(join(dir, f), "utf8")));
  }
}
const BASE = "https://connect.vantrow.example/schemas/v0/";
const validateWith = (schemaId: string, data: unknown): string => {
  const v = ajv.getSchema(BASE + schemaId)!;
  return v(data) ? "" : JSON.stringify(v.errors);
};

const TENANT = "ten_0f1e2d3c4b5a69788796a5b4c3d2e1f0";
const SEQ = {
  id: "7c4db95a-1b2c-4d3e-8f90-a1b2c3d4e5f6",
  workspace_id: "00000000-0000-4000-8000-000000000001",
  name: "Vantrow intro — industrials",
  state: "active" as const,
  created_at: new Date("2026-08-01T12:00:00Z"),
  updated_at: new Date("2026-08-09T09:41:00Z"),
};

describe("Gate 6 mapping: project = sequence", () => {
  it("maps every sequence state onto the frozen core enum", () => {
    expect(mapSequenceStatus("draft")).toEqual({ status: "lead", status_detail: "draft" });
    expect(mapSequenceStatus("scheduled")).toEqual({ status: "quoted", status_detail: "scheduled" });
    expect(mapSequenceStatus("active")).toEqual({ status: "in_progress", status_detail: "active" });
    // Paused shares in_progress; the native word survives in the detail —
    // dashboards display it, never branch on it.
    expect(mapSequenceStatus("paused")).toEqual({ status: "in_progress", status_detail: "paused" });
    expect(mapSequenceStatus("finished")).toEqual({ status: "completed", status_detail: "finished" });
    expect(mapSequenceStatus("archived")).toEqual({ status: "closed", status_detail: "archived" });
    expect(mapSequenceStatus("canceled")).toEqual({ status: "canceled", status_detail: "canceled" });
  });

  it("emits a project that validates against the normative schema", () => {
    const project = sequenceToProject(SEQ, TENANT, {
      enrolled: 41, active: 21, replied: 9,
      finished_no_reply: 6, bounced: 1, sent: 116,
    });
    expect(validateWith("project.schema.json", project)).toBe("");
    expect(project.id).toBe("proj_7c4db95a1b2c4d3e8f90a1b2c3d4e5f6");
    // Dot-namespaced per the extensions schema; consumers ignore what they
    // don't know.
    expect(project.extensions).toEqual({
      "outreach.sequence": { enrolled: 41, active: 21, replied: 9,
        finished_no_reply: 6, bounced: 1, sent: 116 },
    });
  });

  it("emits a contact that validates against the normative schema", () => {
    const contact = prospectToContact({
      id: "9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
      email: "derek@meridian.com", first_name: "Derek", last_name: "Smith",
      company: "Meridian Fasteners",
      created_at: new Date("2026-08-02T10:00:00Z"),
      updated_at: new Date("2026-08-02T10:00:00Z"),
    }, TENANT);
    expect(validateWith("contact.schema.json", contact)).toBe("");
    expect(contact.phone).toBeNull(); // no telephony, ever (R-REQ)
  });

  it("keeps Connect ids deterministic — the same row always maps the same", () => {
    expect(connectId("proj", SEQ.id)).toBe(connectId("proj", SEQ.id.toUpperCase()));
    expect(connectId("ten", "00000000-0000-4000-8000-000000000001"))
      .toMatch(/^ten_[0-9a-z]{8,32}$/);
  });
});

describe("event envelope", () => {
  it("validates against the envelope schema and carries occurred_at, not now", () => {
    const occurred = new Date("2026-08-09T09:41:00Z");
    const env = buildEnvelope({
      type: "project.status_changed",
      tenantId: TENANT,
      occurredAt: occurred,
      data: {
        project: sequenceToProject(SEQ, TENANT),
        previous_status: "lead",
        previous_status_detail: "draft",
      },
    });
    expect(validateWith("event-envelope.schema.json", env)).toBe("");
    expect(env.occurred_at).toBe("2026-08-09T09:41:00.000Z");
    // And the type-specific data schema, which is the part that actually
    // constrains the payload.
    expect(validateWith("events/project.status_changed.data.schema.json", env.data)).toBe("");
  });

  it("mints ids inside the contract's pattern", () => {
    for (let i = 0; i < 50; i++) expect(newEventId()).toMatch(/^evt_[0-9a-z]{8,32}$/);
  });

  it("project.created data validates too", () => {
    const env = buildEnvelope({
      type: "project.created", tenantId: TENANT,
      occurredAt: new Date("2026-08-01T12:00:00Z"),
      data: { project: sequenceToProject({ ...SEQ, state: "draft" }, TENANT) },
    });
    expect(validateWith("events/project.created.data.schema.json", env.data)).toBe("");
  });
});

describe("HMAC signatures (events.md)", () => {
  const secret = "whsec_testsecret";
  const body = JSON.stringify({ id: "evt_abc", hello: "world" });

  it("signs and verifies round-trip in the documented header format", () => {
    const at = Date.UTC(2026, 7, 9, 12, 0, 0);
    const header = signPayload(body, secret, at);
    expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/);
    expect(verifySignature(header, body, secret, at)).toBe(true);
  });

  it("rejects a tampered body, a wrong secret, and a stale timestamp", () => {
    const at = Date.UTC(2026, 7, 9, 12, 0, 0);
    const header = signPayload(body, secret, at);
    expect(verifySignature(header, body + " ", secret, at)).toBe(false);
    expect(verifySignature(header, body, "whsec_other", at)).toBe(false);
    // Replay window is 5 minutes.
    expect(verifySignature(header, body, secret, at + 301_000)).toBe(false);
    expect(verifySignature(header, body, secret, at + 299_000)).toBe(true);
  });

  it("accepts any active secret during rotation (multi-v1 header)", () => {
    const at = Date.UTC(2026, 7, 9, 12, 0, 0);
    const old = signPayload(body, "whsec_old", at).split(",")[1]!;
    const rotated = `${signPayload(body, secret, at)},${old}`;
    expect(verifySignature(rotated, body, secret, at)).toBe(true);
    expect(verifySignature(rotated, body, "whsec_old", at)).toBe(true);
    expect(verifySignature(rotated, body, "whsec_never", at)).toBe(false);
  });
});
