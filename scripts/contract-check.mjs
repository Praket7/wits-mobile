/**
 * Contract consistency check (audit P0 item 4): the OpenAPI document is
 * authoritative. Fails when a `/v1/...` path referenced by the client
 * repositories or the demo server is absent from openapi/wits-mobile-v1.yaml.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spec = readFileSync(join(root, 'openapi/wits-mobile-v1.yaml'), 'utf8');

// Paths declared in the OpenAPI document, normalized to the client's `/v1`
// form (the spec carries `/v1` in its server URL rather than each path).
const declared = new Set();
for (const m of spec.matchAll(/^  (\/[^\s:]+):$/gm)) declared.add(`/v1${m[1]}`);

// Every /v1/... path referenced by the client or the demo server.
const referenced = new Set();
for (const f of ['src/data/httpRepository.ts', 'scripts/demo-server.mjs']) {
  const src = readFileSync(join(root, f), 'utf8');
  // Plain quoted paths.
  for (const m of src.matchAll(/['"](\/v1\/[A-Za-z0-9\-/]*)['"]/g)) referenced.add(m[1]);
  // Backtick templates → {param} placeholders.
  for (const m of src.matchAll(/`(\/v1\/[^`]+)`/g)) {
    referenced.add(m[1].replace(/\$\{[^}]+\}/g, '{param}'));
  }
}

// Compare by path shape so {param} placement must match exactly.
const shape = (s) => s.replace(/\{[^}]+\}/g, '{}');
const declaredShapes = new Map([...declared].map((d) => [shape(d), d]));

const missing = [];
for (const p of referenced) {
  const withoutQuery = p.split('?')[0];
  // Prefix literals like '/v1/teacher/classes/' are startsWith helpers, not routes.
  if (withoutQuery.endsWith('/')) continue;
  const hit = declaredShapes.get(shape(withoutQuery));
  if (!hit) missing.push(`path ${withoutQuery} (client/server) not in OpenAPI`);
}

if (missing.length > 0) {
  console.error('CONTRACT DRIFT — client/server paths missing from OpenAPI:');
  for (const m of missing) console.error('  ✗ ' + m);
  process.exit(1);
}
console.log(`contract OK — ${declared.size} OpenAPI paths, client & demo server in sync`);
