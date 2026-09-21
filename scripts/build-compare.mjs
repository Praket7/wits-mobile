import fs from 'node:fs';

// Side-by-side comparison of approved WCSD mockups (.mockup-reference/) against
// the current build's captures (docs/screenshots/). mock-03 is a byte-identical
// duplicate of mock-01 and is skipped. Rows may pair one mock with several
// build captures (e.g. list + detail screens).
const dir = 'docs/screenshots';
const pairs = [
  ['mock-01', 'Parent Today', ['fp-17-parent-today.png']],
  ['mock-02', 'Reference sheet (My Students · Teacher Today · Guidance · More · Search · Notifications · Welcome)', ['fp-06-more.png', 'fp-01-login.png']],
  ['mock-04', 'Attendance — overview & by class', ['fp-10-attendance.png', 'fp-11-attendance-class.png']],
  ['mock-05', 'Messages — inbox & thread', ['fp-05-messages.png', 'fp-16-thread.png']],
  ['mock-06', 'Student Today', ['fp-02-today.png']],
  ['mock-07', 'Welcome / sign-in', ['fp-01-login.png']],
  ['mock-08', 'Teacher Students', ['fp-22-teacher-students.png']],
  ['mock-09', 'Teacher Today', ['fp-20-teacher-today.png']],
];

const b64 = p => fs.readFileSync(p).toString('base64');
let html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#141414;font-family:-apple-system,sans-serif}
h2{color:#fff;font-size:15px;padding:14px 10px 4px;margin:0}
.row{display:flex;gap:10px;padding:6px 10px 14px;align-items:flex-start}
.cell{flex:1;min-width:0}
.cell img{width:100%;display:block;border-radius:10px}
.tag{font-size:12px;font-weight:700;color:#fff;padding:5px 8px;border-radius:6px;display:inline-block;margin-bottom:4px}
.m{background:#8b1a1a}.a{background:#444}
</style></head><body>`;
for (const [mock, label, shots] of pairs) {
  html += `<h2 id="row-${mock}">${label} — mockup vs build</h2><div class="row">`;
  html += `<div class="cell"><span class="tag m">APPROVED MOCKUP</span><img src="data:image/png;base64,${b64('.mockup-reference/' + mock + '.png')}"/></div>`;
  html += `<div class="cell"><span class="tag a">CURRENT BUILD</span>${shots.map(s => `<img src="data:image/png;base64,${b64(dir + '/' + s)}"/>`).join('')}</div>`;
  html += '</div>';
}
html += '</body></html>';
fs.writeFileSync('docs/compare.html', html);
console.log('wrote docs/compare.html', Math.round(html.length / 1024) + 'KB');
