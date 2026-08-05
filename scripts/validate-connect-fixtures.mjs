#!/usr/bin/env node
/**
 * Validates every Vantrow Connect fixture against the normative JSON Schemas.
 *
 * The spec's own words: "fixtures/ is the contract's test suite … if they ever
 * diverge, the fixtures win." Subsidiary #1 never wired this check into CI and
 * shipped a 0%-implemented producer; this repo runs it from the first commit
 * (CI job "Vantrow Connect spec + fixtures") so the producer build (Phase 4)
 * inherits a green, mechanically-checked contract. When the outreach.*
 * extension schemas land (Gate 6), add their fixtures to the maps below.
 *
 * Exit code 0 = every fixture validates; 1 = any failure (details on stderr).
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const addFormats = require("ajv-formats").default;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const specDir = join(root, "docs", "specs", "vantrow-connect");
const schemasDir = join(specDir, "schemas");
const fixturesDir = join(specDir, "fixtures");

const SCHEMA_BASE = "https://connect.vantrow.example/schemas/v0/";

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

// Register every schema under its $id so relative $refs resolve.
for (const dir of [schemasDir, join(schemasDir, "events")]) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    ajv.addSchema(JSON.parse(readFileSync(join(dir, file), "utf8")));
  }
}

const listEnvelope = (itemSchemaId) => ({
  type: "object",
  additionalProperties: false,
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: { $ref: SCHEMA_BASE + itemSchemaId } },
    meta: {
      type: "object",
      additionalProperties: false,
      required: ["limit", "next_cursor"],
      properties: {
        limit: { type: "integer", minimum: 1 },
        next_cursor: { type: ["string", "null"] },
      },
    },
  },
});

const itemEnvelope = (itemSchemaId) => ({
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: { data: { $ref: SCHEMA_BASE + itemSchemaId } },
});

// GET /v1/metrics returns the full metric set for the tenant — no pagination.
const bareListEnvelope = (itemSchemaId) => ({
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: {
    data: { type: "array", items: { $ref: SCHEMA_BASE + itemSchemaId } },
  },
});

/** Endpoint fixtures → the schema that validates them. */
const ENDPOINT_FIXTURES = {
  "health.json": {
    type: "object",
    additionalProperties: false,
    required: ["status", "version", "time"],
    properties: {
      status: { const: "ok" },
      version: { const: "v1" },
      time: { type: "string", format: "date-time" },
    },
  },
  "tenant.json": { $ref: SCHEMA_BASE + "tenant.schema.json" },
  "project.get.json": itemEnvelope("project.schema.json"),
  "projects.list.json": listEnvelope("project.schema.json"),
  "contacts.list.json": listEnvelope("contact.schema.json"),
  "invoices.list.json": listEnvelope("invoice.schema.json"),
  "metrics.get.json": bareListEnvelope("metric.schema.json"),
};

let failures = 0;
const fail = (name, errors) => {
  failures++;
  console.error(`✗ ${name}`);
  for (const e of errors ?? []) {
    console.error(`    ${e.instancePath || "/"} ${e.message}`);
  }
};

// 1. Endpoint fixtures — every file must be mapped, every mapping must exist.
const endpointFiles = readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
for (const file of endpointFiles) {
  const schema = ENDPOINT_FIXTURES[file];
  if (!schema) {
    fail(`fixtures/${file}`, [{ instancePath: "", message: "no schema mapping in validate-connect-fixtures.mjs — add one" }]);
    continue;
  }
  const data = JSON.parse(readFileSync(join(fixturesDir, file), "utf8"));
  const validate = ajv.compile(schema);
  if (validate(data)) console.log(`✓ fixtures/${file}`);
  else fail(`fixtures/${file}`, validate.errors);
}
for (const mapped of Object.keys(ENDPOINT_FIXTURES)) {
  if (!endpointFiles.includes(mapped)) {
    fail(`fixtures/${mapped}`, [{ instancePath: "", message: "mapped fixture file is missing" }]);
  }
}

// 2. Event fixtures — envelope + type-specific data schema + filename/type match.
const eventsDir = join(fixturesDir, "events");
const envelopeValidate = ajv.getSchema(SCHEMA_BASE + "event-envelope.schema.json");
for (const file of readdirSync(eventsDir).filter((f) => f.endsWith(".json"))) {
  const name = `fixtures/events/${file}`;
  const event = JSON.parse(readFileSync(join(eventsDir, file), "utf8"));

  if (!envelopeValidate(event)) {
    fail(`${name} (envelope)`, envelopeValidate.errors);
    continue;
  }
  const expectedType = file.replace(/\.json$/, "");
  if (event.type !== expectedType) {
    fail(name, [{ instancePath: "/type", message: `is "${event.type}" but the fixture filename says "${expectedType}"` }]);
    continue;
  }
  const dataValidate = ajv.getSchema(`${SCHEMA_BASE}events/${expectedType}.data.schema.json`);
  if (!dataValidate) {
    fail(name, [{ instancePath: "/data", message: `no data schema found for event type "${expectedType}"` }]);
    continue;
  }
  if (dataValidate(event.data)) console.log(`✓ ${name}`);
  else fail(`${name} (data)`, dataValidate.errors);
}

if (failures > 0) {
  console.error(`\n${failures} fixture(s) failed validation.`);
  process.exit(1);
}
console.log("\nAll Vantrow Connect fixtures validate against the schemas.");
