/**
 * Screenshot regression diff (audit P1: the gallery alone is not a regression
 * test). Zero-dependency PNG comparison:
 *   • flags dimension changes outright
 *   • flags missing/new captures
 *   • decodes PNGs with zlib and computes mean absolute pixel delta on
 *     grayscale thumbnails
 *
 * Usage:
 *   node scripts/screenshot-diff.mjs [baselineDir] [currentDir] [threshold]
 * Defaults: docs/screenshots-baseline docs/screenshots 2.5% coarse / 1.0% detail.
 * The optional final argument sets the detail-tier threshold, also as a percent.
 * Exit code 1 on regressions so CI can block unintentional UI drift.
 *
 * Intentional redesigns: re-baseline with
 *   npm run shots:baseline   (copies current captures over the baseline)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselineDir = join(root, process.argv[2] ?? 'docs/screenshots-baseline');
const currentDir = join(root, process.argv[3] ?? 'docs/screenshots');
const THRESHOLD = Number(process.argv[4] ?? 2.5) / 100;
const DETAIL_THRESHOLD = Number(process.argv[5] ?? 1.0) / 100;

// ---------------------------------------------------------------------------
// Minimal PNG decoder — enough for 8-bit RGB(A)/grayscale IDAT via zlib.
function decodePng(buf, T = 32) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
      if (colorType !== 0 && colorType !== 2 && colorType !== 6) {
        throw new Error(`unsupported color type ${colorType} (palette PNGs not supported)`);
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : 4;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  // Undo per-scanline filters.
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rowIn + x];
      const left = x >= channels ? out[rowOut + x - channels] : 0;
      const up = y > 0 ? out[rowOut - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? out[rowOut - stride + x - channels] : 0;
      let val;
      switch (filter) {
        case 0: val = rawByte; break;
        case 1: val = rawByte + left; break;
        case 2: val = rawByte + up; break;
        case 3: val = rawByte + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          val = rawByte + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default: throw new Error(`bad filter ${filter}`);
      }
      out[rowOut + x] = val & 0xff;
    }
  }
  // Downsample to a small grayscale thumbnail for stable comparison.
  const thumb = new Float64Array(T * T);
  for (let ty = 0; ty < T; ty++) {
    for (let tx = 0; tx < T; tx++) {
      const sy = Math.floor((ty * height) / T);
      const sx = Math.floor((tx * width) / T);
      const o = sy * stride + sx * channels;
      let g;
      if (channels === 1) g = out[o];
      else g = 0.299 * out[o] + 0.587 * out[o + 1] + 0.114 * out[o + 2];
      thumb[ty * T + tx] = g;
    }
  }
  return { width, height, thumb };
}

function meanDelta(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length / 255;
}

function listPngs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.png'));
}

const baseline = listPngs(baselineDir);
const current = listPngs(currentDir);
const baselineSet = new Set(baseline);
const currentSet = new Set(current);

const problems = [];
for (const f of current) {
  if (!baselineSet.has(f)) {
    problems.push(`NEW capture (not in baseline): ${f}`);
    continue;
  }
  const aBytes = readFileSync(join(baselineDir, f));
  const bBytes = readFileSync(join(currentDir, f));
  const a = decodePng(aBytes);
  const b = decodePng(bBytes);
  if (a.width !== b.width || a.height !== b.height) {
    problems.push(`DIMENSION drift: ${f} ${a.width}x${a.height} → ${b.width}x${b.height}`);
    continue;
  }
  for (const [size, threshold, tier] of [[32, THRESHOLD, 'coarse'], [128, DETAIL_THRESHOLD, 'detail']]) {
    const d = meanDelta(decodePng(aBytes, size).thumb, decodePng(bBytes, size).thumb);
    if (d > threshold) problems.push(`PIXEL drift (${tier} ${size}×${size}): ${f} mean delta ${(d * 100).toFixed(1)}% > ${(threshold * 100).toFixed(1)}%`);
  }
}
for (const f of baseline) {
  if (!currentSet.has(f)) problems.push(`MISSING capture (in baseline, not current): ${f}`);
}

if (problems.length > 0) {
  console.error(`Screenshot regression check FAILED (${problems.length}):`);
  for (const p of problems) console.error('  ✗ ' + p);
  console.error('\nIf the change is intentional, re-baseline: npm run shots:baseline');
  process.exit(1);
}
console.log(`screenshot regression OK — ${current.length} captures match baseline (32×32 ${(THRESHOLD * 100).toFixed(1)}%, 128×128 ${(DETAIL_THRESHOLD * 100).toFixed(1)}%)`);
