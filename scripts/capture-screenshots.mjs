/**
 * Screenshot recapture (plan items 56-57): drives the exported web build with
 * Playwright, resizes the viewport to full content height per route, and
 * writes labeled fp/st captures into docs/screenshots/. Run:
 *
 *   node scripts/capture-screenshots.mjs
 *
 * Prereqs: `npx expo export --platform web --output-dir /tmp/wits-web`
 * and `npx serve /tmp/wits-web -l 8123`. Playwright is resolved from the
 * npx cache (no project dependency — keeps the dependency surface minimal).
 */
// Playwright is loaded from wherever it exists (audit P1: never a hardcoded
// machine path). Resolution order: PLAYWRIGHT_PATH env → project node_modules
// → the shared npx cache. Run `npm run shots:install` (or `npx playwright
// install chromium`) once to provision a browser.
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
async function resolvePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    'playwright', // normal Node resolution (project or parent node_modules)
    join(homedir(), '.npm/_npx'), // scan npx cache entries below
  ].filter(Boolean);
  for (const c of candidates) {
    if (c === join(homedir(), '.npm/_npx')) {
      // Newest npx cache entry that contains playwright.
      try {
        const entries = readdirSync(c)
          .map((d) => join(c, d, 'node_modules/playwright/index.mjs'))
          .filter((p) => existsSync(p));
        entries.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
        if (entries.length > 0) return await import(entries.at(-1));
      } catch {}
      continue;
    }
    try {
      if (c.includes('/')) {
        if (!existsSync(c)) continue;
        return await import(c);
      }
      return await import(require.resolve(c));
    } catch {}
  }
  throw new Error(
    'Playwright not found. Run `npx -y playwright install chromium` (and set PLAYWRIGHT_PATH if needed), or `npm i -D playwright`.',
  );
}

const { chromium } = await resolvePlaywright();

const WEB_DIR = process.env.SHOT_WEB_DIR ?? '/tmp/wits-web';
const PORT = 8127;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

// Serve the export from this process — sandboxed environments kill detached
// background servers between commands, so the capture must own its server.
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, BASE);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    let file = resolve(join(WEB_DIR, path));
    if (!file.startsWith(resolve(WEB_DIR))) {
      res.writeHead(403); res.end(); return;
    }
    let data;
    try {
      data = await readFile(file);
    } catch {
      // SPA fallback for Expo Router deep links.
      data = await readFile(join(WEB_DIR, 'index.html'));
      file = join(WEB_DIR, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(500); res.end();
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
console.log(`serving ${WEB_DIR} on ${BASE}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  { file: 'fp-01-login', route: '/(auth)/login', tapLabel: null },
  { file: 'fp-02-today', route: '/(student)/(tabs)/today' },
  { file: 'fp-03-academics', route: '/(student)/(tabs)/academics' },
  { file: 'fp-04-calendar', route: '/(student)/(tabs)/calendar' },
  { file: 'fp-05-messages', route: '/(student)/(tabs)/messages' },
  { file: 'fp-06-more', route: '/(student)/(tabs)/more' },
  { file: 'fp-07-assignments', route: '/(student)/assignments' },
  { file: 'fp-08-course', route: '/(student)/course/c-chem' },
  { file: 'fp-09-assignment', route: '/(student)/assignment/a-lab1' },
  { file: 'fp-10-attendance', route: '/(student)/attendance' },
  { file: 'fp-11-attendance-class', route: '/(student)/attendance/c-chem' },
  { file: 'fp-12-guidance', route: '/(student)/guidance' },
  { file: 'fp-13-resources', route: '/(student)/resources' },
  { file: 'fp-14-search', route: '/(student)/search' },
  { file: 'fp-15-notifications', route: '/(student)/notifications' },
  { file: 'fp-16-thread', route: '/(student)/messages/t1' },
  { file: 'fp-17-parent-today', route: '/(parent)/(tabs)/today', before: async (page) => { await page.evaluate(() => { window.localStorage.setItem('wits.role', 'parent'); window.localStorage.setItem('wits.logged-in', '1'); }); } },
  { file: 'fp-18-parent-students', route: '/(parent)/students' },
  { file: 'fp-19-parent-academics', route: '/(parent)/(tabs)/academics' },
  { file: 'fp-20-teacher-today', route: '/(teacher)/(tabs)/today', before: async (page) => { await page.evaluate(() => { window.localStorage.setItem('wits.role', 'teacher'); }); } },
  { file: 'fp-21-teacher-classes', route: '/(teacher)/(tabs)/classes' },
  { file: 'fp-22-teacher-students', route: '/(teacher)/(tabs)/students' },
  { file: 'fp-23-teacher-class', route: '/(teacher)/class/c-chem' },
  { file: 'fp-24-teacher-compose', route: '/(teacher)/compose' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

// Prime the session once (mock login persisted via AsyncStorage web shim).
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.localStorage.setItem('wits.logged-in', '1');
});
await page.reload({ waitUntil: 'networkidle' });

for (const shot of SHOTS) {
  try {
    if (shot.before) await shot.before(page);
    await page.goto(`${BASE}${shot.route}`, { waitUntil: 'networkidle' });
    await sleep(1400);
    // RN-web puts the scroll container inside #root, so measure the deepest
    // scrollable element instead of body.
    const height = await page.evaluate(() => {
      let max = 844;
      document.querySelectorAll('div').forEach((d) => {
        if (d.scrollHeight > max) max = d.scrollHeight;
      });
      return Math.max(max, document.body.scrollHeight, 844);
    });
    await page.setViewportSize({ width: 390, height: Math.min(height, 12000) });
    await sleep(700);
    await page.screenshot({ path: `${OUT}/${shot.file}.png` });
    console.log('captured', shot.file, `h=${Math.min(height, 12000)}`);
  } catch (e) {
    console.log('FAILED', shot.file, String(e).slice(0, 140));
  }
  await page.setViewportSize({ width: 390, height: 844 });
}

await browser.close();
server.close();
console.log('done');
