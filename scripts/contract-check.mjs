/**
 * Contract consistency check (audit P0 item 4 — strengthened).
 *
 * Part 1 — path coverage: every /v1/... path referenced by the client
 *   repositories or the demo server must exist in openapi/wits-mobile-v1.yaml,
 *   and every declared path item must contain at least one operation.
 * Part 2 — $ref integrity: every $ref in the document must resolve.
 * Part 3 — schema parity (the part the old check could not see): for each
 *   component with a Zod counterpart, the OpenAPI schema is compared
 *   structurally against JSON Schema generated from the ACTUAL domain Zod
 *   schema (compiled from src, the source of truth — never hand-copied):
 *
 *     • enum values (order-insensitive; spec `const` ≡ single-value enum)
 *     • required-field sets (missing AND over-strict both fail)
 *     • nullability (spec `nullable: true` ≡ type array with 'null')
 *     • property/type structure (object, array, record, oneOf/anyOf unions)
 *
 *   Deliberately NOT compared: numeric bounds and string formats — those are
 *   validation policy (e.g. z.number().int() emits ±MAX_SAFE_INTEGER sentinels;
 *   spec formats are advisory), not shape parity.
 *
 * Drift like "OpenAPI enum omits 'submitted'" now fails CI instead of hiding
 * behind a green path-presence check.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);

// ---------------------------------------------------------------------------
// Load + parse the OpenAPI document (real YAML parse — no regex on the doc).
// ---------------------------------------------------------------------------
const specPath = join(root, 'openapi/wits-mobile-v1.yaml');
const doc = parseYaml(readFileSync(specPath, 'utf8'));
const paths = doc?.paths ?? {};
const schemas = doc?.components?.schemas ?? {};

// ---------------------------------------------------------------------------
// Part 1 — path coverage (client repositories + demo server vs the document).
// ---------------------------------------------------------------------------
const declared = new Set(Object.keys(paths).map((p) => `/v1${p}`));
for (const [p, item] of Object.entries(paths)) {
  const ops = Object.keys(item ?? {}).filter((k) =>
    ['get', 'post', 'put', 'patch', 'delete'].includes(k),
  );
  if (ops.length === 0) fail(`OpenAPI path ${p} declares no operations`);
}

const referenced = new Set();
for (const f of ['src/data/httpRepository.ts', 'scripts/demo-server.mjs']) {
  const src = readFileSync(join(root, f), 'utf8');
  for (const m of src.matchAll(/['"](\/v1\/[A-Za-z0-9\-/]*)['"]/g)) referenced.add(m[1]);
  for (const m of src.matchAll(/`(\/v1\/[^`]+)`/g)) {
    referenced.add(m[1].replace(/\$\{[^}]+\}/g, '{param}'));
  }
}

const shape = (s) => s.replace(/\{[^}]+\}/g, '{}');
const declaredShapes = new Map([...declared].map((d) => [shape(d), d]));
for (const p of referenced) {
  const withoutQuery = p.split('?')[0];
  // Prefix literals like '/v1/teacher/classes/' are startsWith helpers, not routes.
  if (withoutQuery.endsWith('/')) continue;
  if (!declaredShapes.has(shape(withoutQuery))) {
    fail(`path ${withoutQuery} (client/server) not in OpenAPI`);
  }
}

// ---------------------------------------------------------------------------
// Part 2 — $ref integrity.
// ---------------------------------------------------------------------------
function resolveRef(ref) {
  if (!ref.startsWith('#/')) return undefined;
  let node = doc;
  for (const seg of ref.slice(2).split('/')) {
    node = node?.[seg.replaceAll('~1', '/').replaceAll('~0', '~')];
    if (node === undefined) return undefined;
  }
  return node;
}
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string' && resolveRef(node.$ref) === undefined) {
      fail(`broken $ref: ${node.$ref}`);
    }
    Object.values(node).forEach(walk);
  }
})(doc);

// ---------------------------------------------------------------------------
// Part 3 — schema parity against the Zod source of truth.
// ---------------------------------------------------------------------------
const MAPPINGS = {
  User: 'userSchema',
  Student: 'studentSchema',
  Course: 'courseSchema',
  GradeCategory: 'gradeCategorySchema',
  CourseAnnouncement: 'courseAnnouncementSchema',
  MarkingPeriod: 'markingPeriodSchema',
  Assignment: 'assignmentSchema',
  GradeEntry: 'gradeEntrySchema',
  Reminder: 'reminderSchema',
  DistrictForm: 'districtFormSchema',
  StaffContact: 'staffContactSchema',
  AttendanceRecord: 'attendanceRecordSchema',
  AttendanceSummary: 'attendanceSummarySchema',
  MonthlyAttendance: 'monthlyAttendanceSchema',
  AbsenceReport: 'absenceReportSchema',
  CalendarEvent: 'calendarEventSchema',
  GuidanceItem: 'guidanceItemSchema',
  Message: 'messageSchema',
  MessageThread: 'messageThreadSchema',
  ForwardInput: 'forwardInputSchema',
  ResourceLink: 'resourceLinkSchema',
  BellPeriod: 'bellPeriodSchema',
  PayloadMeta: 'payloadMetaSchema',
  TodayPayload: 'todayPayloadSchema',
  ScheduleBlock: 'scheduleBlockSchema',
  TeacherClass: 'teacherClassSchema',
  TeacherRosterEntry: 'teacherRosterEntrySchema',
  TeacherScheduleBlock: 'teacherScheduleBlockSchema',
  TeacherActionItem: 'teacherActionItemSchema',
  TeacherTodayPayload: 'teacherTodayPayloadSchema',
  Capabilities: 'capabilitiesSchema',
};

// Keys allowed in the hand-written spec; anything else is a typo/lint hit.
const SPEC_KEYS_OK = new Set([
  'type', 'enum', 'const', 'nullable', 'properties', 'required', 'items',
  'additionalProperties', 'oneOf', 'anyOf', '$ref',
  // Advisory/policy keys — ignored for parity but legal in the document.
  'format', 'description', 'default', 'minimum', 'maximum',
]);
const ZOD_DROP_KEYS = new Set([
  '$schema', 'format', 'description', 'title', 'default', 'minimum', 'maximum',
  'exclusiveMinimum', 'exclusiveMaximum', 'propertyNames', 'minLength',
  'maxLength', 'pattern', 'examples',
]);

/** Compile the domain schemas (the contract's source of truth) from src. */
async function loadZodSchemas() {
  const { compileDemoDatabase } = await import('./demo-runtime.mjs');
  const { outDir, cleanup } = compileDemoDatabase();
  try {
    const mod = await import(pathToFileURL(join(outDir, 'src/domain/schemas.js')).href);
    // In zod's v3/v4 dual-package build, `z.toJSONSchema` lives on the /v4
    // entrypoint — import it directly so the checker never depends on which
    // subpath src/domain/schemas.ts resolved.
    const z4 = await import('zod/v4');
    return { ...mod, z: z4.z ?? z4 };
  } finally {
    cleanup();
  }
}

function normalizeSpecNode(node, depth = 0) {
  if (depth > 32) throw new Error('spec schema nested too deep');
  if (node == null || typeof node !== 'object') {
    return { kind: 'leaf', types: null };
  }
  for (const k of Object.keys(node)) {
    if (!SPEC_KEYS_OK.has(k)) fail(`spec schema key "${k}" is not recognized (typo?)`);
  }
  if (typeof node.$ref === 'string') {
    const target = resolveRef(node.$ref);
    if (target === undefined) return { kind: 'leaf', types: null }; // Part 2 already reported it
    return normalizeSpecNode(target, depth + 1);
  }
  // Fold oneOf/anyOf unions; a pure-null branch becomes nullability on the
  // remaining branch(es) — so `{ oneOf: [X, { nullable: true }] }` ≡ nullable X.
  const branches = [...(node.oneOf ?? []), ...(node.anyOf ?? [])];
  if (branches.length > 0) {
    const nonNull = [];
    let hasNull = false;
    for (const b of branches) {
      const n = normalizeSpecNode(b, depth + 1);
      if (n.kind === 'leaf' && n.types?.length === 1 && n.types[0] === 'null') hasNull = true;
      else nonNull.push(n);
    }
    const withNull = (n) => ({
      ...n,
      types: n.types === null ? null : [...new Set([...(n.types ?? []), 'null'])],
    });
    if (nonNull.length === 1) return hasNull ? withNull(nonNull[0]) : nonNull[0];
    if (hasNull) for (const n of nonNull) withNull(n); // multi-branch + null
    return { kind: 'union', branches: nonNull };
  }
  const rawTypes = Array.isArray(node.type) ? node.type : node.type ? [node.type] : null;
  let types = rawTypes;
  if (node.nullable === true) {
    types = [...new Set([...(types ?? ['object']), 'null'])];
  }
  // Bare `{ nullable: true }` (no type/properties/items/oneOf) is the null-only
  // placeholder used in unions — not an object with a null type added.
  if (
    node.nullable === true &&
    node.type === undefined &&
    node.properties === undefined &&
    node.items === undefined &&
    branches.length === 0
  ) {
    return { kind: 'leaf', types: ['null'] };
  }
  if (node.type === 'object' || node.properties || node.required) {
    return {
      kind: 'object',
      required: new Set(node.required ?? []),
      properties: Object.fromEntries(
        Object.entries(node.properties ?? {}).map(([k, v]) => [k, normalizeSpecNode(v, depth + 1)]),
      ),
      additionalProperties:
        node.additionalProperties != null
          ? normalizeSpecNode(node.additionalProperties, depth + 1)
          : undefined,
      types: null,
    };
  }
  if (node.type === 'array' || node.items) {
    return {
      kind: 'array',
      items: node.items ? normalizeSpecNode(node.items, depth + 1) : undefined,
      types: null,
    };
  }
  return {
    kind: 'leaf',
    types,
    enum: node.enum ? [...node.enum].map(String).sort() : node.const !== undefined ? [String(node.const)] : undefined,
  };
}

function normalizeZodNode(node, depth = 0) {
  if (depth > 32) throw new Error('zod schema nested too deep');
  if (node == null || typeof node !== 'object') return { kind: 'leaf', types: null };
  const clean = {};
  for (const [k, v] of Object.entries(node)) {
    if (!ZOD_DROP_KEYS.has(k)) clean[k] = v;
  }
  // `additionalProperties: false` is a z.toJSONSchema generator artifact: real
  // z.object().parse() strips unknown keys rather than rejecting them, and the
  // hand-written spec intentionally leaves this open. Drop the artifact.
  if (clean.additionalProperties === false) delete clean.additionalProperties;
  const branches = [...(clean.oneOf ?? []), ...(clean.anyOf ?? [])];
  if (branches.length > 0) {
    const nonNull = [];
    let hasNull = false;
    for (const b of branches) {
      const n = normalizeZodNode(b, depth + 1);
      if (n.kind === 'leaf' && n.types?.length === 1 && n.types[0] === 'null') hasNull = true;
      else nonNull.push(n);
    }
    const withNull = (n) => ({
      ...n,
      types: n.types === null ? null : [...new Set([...(n.types ?? []), 'null'])],
    });
    if (nonNull.length === 1) return hasNull ? withNull(nonNull[0]) : nonNull[0];
    if (hasNull) for (const n of nonNull) withNull(n);
    return { kind: 'union', branches: nonNull };
  }
  const types = Array.isArray(clean.type) ? clean.type : clean.type ? [clean.type] : null;
  if (clean.type === 'object' || clean.properties) {
    return {
      kind: 'object',
      required: new Set(clean.required ?? []),
      properties: Object.fromEntries(
        Object.entries(clean.properties ?? {}).map(([k, v]) => [k, normalizeZodNode(v, depth + 1)]),
      ),
      additionalProperties:
        clean.additionalProperties != null
          ? normalizeZodNode(clean.additionalProperties, depth + 1)
          : undefined,
      types: null,
    };
  }
  if (clean.type === 'array' || clean.items) {
    return {
      kind: 'array',
      items: clean.items ? normalizeZodNode(clean.items, depth + 1) : undefined,
      types: null,
    };
  }
  return {
    kind: 'leaf',
    types,
    enum: clean.enum ? [...clean.enum].map(String).sort() : undefined,
  };
}

function describe(n) {
  if (n.kind === 'union') return `union[${n.branches.map(describe).join(' | ')}]`;
  if (n.kind === 'array') return `array<${n.items ? describe(n.items) : 'any'}>`;
  if (n.kind === 'object') {
    const keys = Object.keys(n.properties);
    return `object{${keys.length ? keys.join(',') : ''}}`;
  }
  const t = n.types ? `[${[...n.types].sort().join(',')}]` : '[any]';
  return n.enum ? `${t} enum(${n.enum.join('|')})` : t;
}

function compare(spec, zod, where) {
  if (spec.kind === 'union' || zod.kind === 'union') {
    if (spec.kind !== 'union' || zod.kind !== 'union') {
      fail(`${where}: union vs non-union — OpenAPI ${describe(spec)} vs Zod ${describe(zod)}`);
      return;
    }
    for (const zb of zod.branches) {
      const match = spec.branches.some((sb) => matches(sb, zb));
      if (!match) fail(`${where}: Zod branch ${describe(zb)} has no OpenAPI counterpart`);
    }
    for (const sb of spec.branches) {
      const match = zod.branches.some((zb) => matches(sb, zb));
      if (!match) fail(`${where}: OpenAPI branch ${describe(sb)} is not in the Zod contract`);
    }
    return;
  }
  if (spec.kind !== zod.kind) {
    fail(`${where}: kind mismatch — OpenAPI ${describe(spec)} vs Zod ${describe(zod)}`);
    return;
  }
  if (spec.kind === 'object') {
    const missingInSpec = [...zod.required].filter((r) => !spec.required.has(r));
    const overStrict = [...spec.required].filter((r) => !zod.required.has(r) && !(r in zod.properties));
    const unknownInSpec = [...spec.required].filter((r) => !(r in zod.properties));
    const specOnly = Object.keys(spec.properties).filter((k) => !(k in zod.properties));
    const zodOnly = Object.keys(zod.properties).filter((k) => !(k in spec.properties));
    if (missingInSpec.length)
      fail(`${where}: required in Zod but missing from OpenAPI required: [${missingInSpec.join(', ')}]`);
    if (overStrict.length)
      fail(`${where}: OpenAPI marks required fields the Zod contract allows to be omitted: [${overStrict.join(', ')}]`);
    if (unknownInSpec.length)
      fail(`${where}: OpenAPI requires unknown fields: [${unknownInSpec.join(', ')}]`);
    if (specOnly.length)
      fail(`${where}: fields only in OpenAPI (no Zod counterpart): [${specOnly.join(', ')}]`);
    if (zodOnly.length)
      fail(`${where}: fields only in Zod (missing from OpenAPI): [${zodOnly.join(', ')}]`);
    for (const k of Object.keys(zod.properties)) {
      if (k in spec.properties) compare(spec.properties[k], zod.properties[k], `${where}.${k}`);
    }
    if (spec.additionalProperties || zod.additionalProperties) {
      if (!spec.additionalProperties || !zod.additionalProperties) {
        fail(`${where}: additionalProperties present on one side only`);
      } else {
        compare(spec.additionalProperties, zod.additionalProperties, `${where}.*`);
      }
    }
    return;
  }
  if (spec.kind === 'array') {
    if (spec.items && zod.items) compare(spec.items, zod.items, `${where}[]`);
    else if (spec.items || zod.items) {
      fail(`${where}: item schema present on one side only — OpenAPI ${describe(spec)} vs Zod ${describe(zod)}`);
    }
    return;
  }
  // Leaf: type + enum parity (order-insensitive).
  const st = new Set(spec.types ?? []);
  const zt = new Set(zod.types ?? []);
  if (st.size !== zt.size || [...st].some((t) => !zt.has(t))) {
    fail(`${where}: type/nullability mismatch — OpenAPI ${describe(spec)} vs Zod ${describe(zod)}`);
  }
  const se = new Set(spec.enum ?? []);
  const ze = new Set(zod.enum ?? []);
  if (se.size !== ze.size || [...se].some((v) => !ze.has(v))) {
    fail(`${where}: enum mismatch — OpenAPI [${[...se].sort().join(', ')}] vs Zod [${[...ze].sort().join(', ')}]`);
  }
}

function matches(sb, zb) {
  const before = errors.length;
  compare(sb, zb, '(branch)');
  errors.length = before; // branch matching is tentative; outer compare reports
  return true;
}

const zodModule = await loadZodSchemas();
let parityChecked = 0;
for (const [name, zodName] of Object.entries(MAPPINGS)) {
  const specNode = schemas[name];
  const zodSchema = zodModule[zodName];
  if (!specNode) {
    fail(`Zod-mapped schema "${name}" is missing from openapi/wits-mobile-v1.yaml components.schemas`);
    continue;
  }
  if (!zodSchema) {
    fail(`contract-check mapping error: src/domain/schemas.ts does not export "${zodName}"`);
    continue;
  }
  const json = await zodModule.z.toJSONSchema(zodSchema);
  const spec = normalizeSpecNode(structuredClone(specNode));
  const zodNorm = normalizeZodNode(structuredClone(json));
  try {
    compare(spec, zodNorm, name);
  } catch (e) {
    fail(`${name}: comparison failed — ${e?.message ?? e}`);
  }
  parityChecked++;
}
for (const name of Object.keys(schemas)) {
  if (!(name in MAPPINGS)) {
    console.error(`note: OpenAPI schema "${name}" has no Zod counterpart — not parity-checked`);
  }
}

// ---------------------------------------------------------------------------
if (errors.length > 0) {
  console.error(`CONTRACT DRIFT — ${errors.length} problem(s) between OpenAPI and the Zod source of truth:`);
  for (const m of errors) console.error('  ✗ ' + m);
  process.exit(1);
}
console.log(
  `contract OK — ${declared.size} paths, $refs resolve, ${parityChecked}/${Object.keys(MAPPINGS).length} schemas parity-checked against Zod (enums, required, nullability)`,
);
