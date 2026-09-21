/**
 * Shared demo runtime (used by scripts/demo-server.mjs and the HTTP smoke
 * test): compiles the src tree to plain ESM in a temp dir, rewrites the
 * '@/...' alias to absolute file URLs, stubs AsyncStorage, and exposes the
 * demo /v1 route handler so both the standalone server and the smoke test
 * serve the exact same contract from the same demo database.
 */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, symlinkSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function compileDemoDatabase() {
  const root = resolve(new URL('..', import.meta.url).pathname);
  const TSCONFIG = join(root, 'tsconfig.demo.json');
  const outDir = mkdtempSync(join(tmpdir(), 'wits-demo-'));

  const base = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'));
  base.compilerOptions = {
    ...base.compilerOptions,
    noEmit: false,
    outDir,
    module: 'esnext',
    moduleResolution: 'bundler',
    target: 'es2020',
    noImplicitAny: false,
    types: ['jest'],
  };
  writeFileSync(TSCONFIG, JSON.stringify(base, null, 2));

  const tsc = spawnSync('npx', ['tsc', '--project', TSCONFIG], {
    cwd: root,
    stdio: 'inherit',
  });
  if (tsc.status !== 0) {
    throw new Error('demo runtime: failed to compile demo database');
  }

  // Rewrite the '@/x' alias to absolute file URLs into the compiled tree.
  function walkJs(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) out.push(...walkJs(p));
      else if (name.endsWith('.js')) out.push(p);
    }
    return out;
  }
  const srcUrl = pathToFileURL(outDir + '/src').href;
  for (const file of walkJs(outDir)) {
    let code = readFileSync(file, 'utf8');
    code = code.replace(/(['"])@\/([^'"]+)\1/g, (m, q, p) => `${q}${srcUrl}/${p}.js${q}`);
    code = code.replace(/from '(\.\.?\/[^']+?)'/g, (m, p1) =>
      p1.endsWith('.js') ? m : `from '${p1}.js'`,
    );
    code = code.replace(
      /import AsyncStorage from ['"][^'"]*async-storage['"];?/g,
      `import AsyncStorage from '${pathToFileURL(join(outDir, 'wits-stub-async-storage.js')).href}';`,
    );
    writeFileSync(file, code);
  }

  writeFileSync(
    join(outDir, 'wits-stub-async-storage.js'),
    'export default { getItem: async () => null, setItem: async () => {} };\n',
  );

  // Bare imports (zod etc.) resolve by walking parents — symlink node_modules.
  symlinkSync(join(root, 'node_modules'), join(outDir, 'node_modules'), 'dir');

  return {
    outDir,
    cleanup() {
      rmSync(outDir, { recursive: true, force: true });
      try { rmSync(TSCONFIG); } catch {}
    },
  };
}

/** The /v1 demo route handler shared by the server and the smoke test. */
export function createDemoRequestHandler(db) {
  const json = (res, code, body) => {
    const payload = JSON.stringify(body);
    res.writeHead(code, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'X-Demo-Server': 'wits-mobile',
    });
    res.end(payload);
  };

  return function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/$/, '') || '/';
    const q = url.searchParams;

    const me = () =>
      // Role is derived server-side (OpenAPI /me) — the request carries no role.
      ({ id: 'stu-alex', name: 'Alex Williams', role: 'student', initials: 'AW', school: 'Williamsville East High School' });

    const studentId = q.get('studentId') ?? 'stu-alex';

    if (req.method !== 'GET') {
      return json(res, 405, { error: { code: 'validation', message: 'Demo server is read-only' } });
    }

    try {
      switch (true) {
        case path === '/health':
          return json(res, 200, { ok: true, version: 'demo-0.1.0' });
        case path === '/v1/me':
          return json(res, 200, me());
        case path === '/v1/me/students':
          return json(res, 200, db.students);
        case path === '/v1/capabilities':
          return json(res, 200, {
            messagingReply: true,
            messagingCompose: true,
            attendanceReporting: true,
            teacherAttendanceWrite: true,
            teacherAnnouncements: true,
            forms: true,
            transportation: false,
            lunch: false,
            googleClassroomLinks: true,
            notificationPush: false,
            eventReminders: true,
            reportCards: true,
          });
        case path === `/v1/students/${studentId}/courses`:
          return json(res, 200, db.coursesByStudent[studentId] ?? []);
        case path === `/v1/students/${studentId}/assignments`:
          return json(res, 200, db.assignmentsByStudent[studentId] ?? []);
        case path === `/v1/students/${studentId}/grades`:
          return json(res, 200, db.gradesByStudent[studentId] ?? []);
        case path === `/v1/students/${studentId}/attendance`:
          return json(res, 200, db.attendanceByStudent[studentId] ?? []);
        case path === `/v1/students/${studentId}/calendar`: {
          const isPrimary = studentId === 'stu-alex';
          const events = isPrimary
            ? db.events.filter((e) => !e.id.startsWith('me'))
            : db.events.filter((e) => e.id.startsWith('me') || e.audience === 'families');
          return json(res, 200, events);
        }
        case path === `/v1/students/${studentId}/guidance`:
          return json(res, 200, db.guidanceByStudent[studentId] ?? []);
        case path === `/v1/students/${studentId}/forms`:
          return json(res, 200, db.forms.filter((f) => f.studentId === studentId));
        case path.startsWith(`/v1/students/${studentId}/attendance/monthly`): {
          const year = Number(q.get('year') ?? 2026);
          const month = Number(q.get('month') ?? 9);
          const key = `${year}-${String(month).padStart(2, '0')}`;
          return json(res, 200, db.monthlyAttendanceByStudent[studentId]?.[key] ?? {});
        }
        case path === `/v1/students/${studentId}/today`: {
          const assignments = db.assignmentsByStudent[studentId] ?? [];
          const due = assignments.filter((a) => a.status === 'upcoming').length;
          return json(res, 200, {
            meta: { fetchedAt: new Date().toISOString(), source: 'demo', stale: false },
            greetingDateLabel: 'Thursday, September 17, 2026',
            dayLabel: 'B Day',
            schedule: [],
            assignmentsDueCount: due,
            assignmentsDueSoonCount: due,
            eventsTodayCount: 0,
            unreadMessagesCount: 0,
            announcements: [],
            recentActivity: [],
          });
        }
        case path === '/v1/schedules/bell':
          return json(res, 200, db.bellSchedule);
        case path === '/v1/reminders':
          return json(res, 200, db.reminders.map((text, i) => ({ id: `rem-${i + 1}`, text })));
        case path === '/v1/resources':
          return json(res, 200, db.resources);
        case path === '/v1/staff':
          return json(res, 200, [
            { id: 'tea-morgan', name: 'Mr. Morgan', title: 'Science — AP Chemistry' },
            { id: 'cou-ramirez', name: 'Ms. Ramirez', title: 'Guidance Counselor (A–L)' },
          ]);
        case path === '/v1/teacher/classes':
          return json(res, 200, db.teacherClasses);
        case path === '/v1/teacher/today':
          return json(res, 200, db.teacherToday);
        case path.startsWith('/v1/teacher/classes/') && path.endsWith('/roster'):
          return json(res, 200, db.rostersByClass[path.split('/')[4]] ?? []);
        default:
          return json(res, 404, { error: { code: 'not-found', message: `No demo route for ${req.method} ${path}` } });
      }
    } catch (e) {
      return json(res, 500, { error: { code: 'server', message: String(e) } });
    }
  };
}

/** Convenience: compile once and start an in-process server on an ephemeral port. */
export async function startDemoServer({ port = 0 } = {}) {
  const { outDir, cleanup } = compileDemoDatabase();
  const { createDemoDatabase } = await import(
    pathToFileURL(join(outDir, 'src/data/demo/db.js')).href
  );
  const db = createDemoDatabase();
  const server = createServer(createDemoRequestHandler(db));
  await new Promise((resolveListen) => server.listen(port, resolveListen));
  return {
    port: server.address().port,
    server,
    shutdown() {
      server.close();
      cleanup();
    },
  };
}
