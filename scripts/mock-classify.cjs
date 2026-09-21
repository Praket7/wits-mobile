// Classify mockup PNGs by coarse color thumbnails (no deps — zlib is built into Node).
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(path) {
  const buf = fs.readFileSync(path);
  // PNG signature 8 bytes, then chunks: len(4) type(4) data crc(4)
  let off = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(off + 8);
      height = buf.readUInt32BE(off + 12);
      bitDepth = buf[off + 16];
      colorType = buf[off + 17];
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(off + 8, off + 8 + len));
    }
    off += 12 + len;
  }
  if (bitDepth !== 8) throw new Error('unsupported bit depth ' + bitDepth);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = channels;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v = (v + a) & 0xff; break;
        case 2: v = (v + b) & 0xff; break;
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          break;
        }
      }
      cur[x] = v;
    }
  }
  return { width, height, channels, data: out };
}

function classify(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min > 40 && r === max && g < r * 0.55) return 'R'; // red (any darkness)
  if (r > 180 && g > 130 && b < 110 && max - min > 50) return 'G'; // gold
  if (g === max && g > 110 && r < g * 0.75) return 'V'; // green
  if (r > 235 && g > 235 && b > 235) return '.'; // white
  if (r > 205 && g > 205 && b > 205) return '-'; // light gray
  if (r < 70 && g < 70 && b < 70) return '#'; // near black
  if (r > 120 && g > 120 && b > 120) return '+'; // mid gray
  return '?';
}

for (const f of process.argv.slice(2)) {
  const img = decodePNG(f);
  const { width, height, channels, data } = img;
  const COLS = 24, ROWS = 36;
  let out = f + '  ' + width + 'x' + height + '\n';
  for (let ry = 0; ry < ROWS; ry++) {
    let line = '';
    for (let rx = 0; rx < COLS; rx++) {
      // average cell
      let rs = 0, gs = 0, bs = 0, n = 0;
      const x0 = Math.floor((rx * width) / COLS), x1 = Math.floor(((rx + 1) * width) / COLS);
      const y0 = Math.floor((ry * height) / ROWS), y1 = Math.floor(((ry + 1) * height) / ROWS);
      for (let y = y0; y < y1; y += 8) {
        for (let x = x0; x < x1; x += 8) {
          const i = (y * width + x) * channels;
          rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
        }
      }
      line += classify(rs / n, gs / n, bs / n);
    }
    out += line + '\n';
  }
  console.log(out);
}
