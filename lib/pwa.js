/* SidTech 366 — "Add to Home screen" support for each school's own address (/schoolname).
   Everything is generated on the fly from the school's name: manifest, icon (PNG), service worker. No image files needed. */
const zlib = require('zlib');

/* 5x7 pixel letters for the auto icon */
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#..##', '#.#.#', '#.#.#', '#.#.#', '##..#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.']
};
/* fallback glyph (school house) for names with no A-Z / 0-9 letters, e.g. Hindi-only names */
const HOUSE = ['..#..', '.###.', '#####', '#...#', '#.#.#', '#.#.#', '#####'];

function hash(str) { let h = 7; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}
const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
const brand = (p) => hsl(hash(p.name) % 360, 55, 36);
function initials(name) {
  const w = String(name || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  const t = (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '').slice(0, 1));
  return t;
}

let CRC;
function crc32(buf) {
  if (!CRC) { CRC = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/* square PNG, full-bleed colour (works as a "maskable" icon too), white letters kept inside the safe centre */
function icon(p, size) {
  const bg = brand(p), txt = initials(p.name), rows = txt ? null : HOUSE;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) { const o = y * (size * 3 + 1); raw[o] = 0; for (let x = 0; x < size; x++) { raw[o + 1 + x * 3] = bg[0]; raw[o + 2 + x * 3] = bg[1]; raw[o + 3 + x * 3] = bg[2]; } }
  const glyphs = txt ? txt.split('').map((c) => FONT[c]) : [rows];
  const u = Math.max(1, Math.floor(size * 0.4 / 7)), gap = 1, wUnits = glyphs.length * 5 + (glyphs.length - 1) * gap;
  const x0 = Math.round((size - wUnits * u) / 2), y0 = Math.round((size - 7 * u) / 2);
  glyphs.forEach((g, gi) => g.forEach((row, ry) => row.split('').forEach((ch, rx) => {
    if (ch !== '#') return;
    const px = x0 + (gi * (5 + gap) + rx) * u, py = y0 + ry * u;
    for (let yy = py; yy < py + u; yy++) for (let xx = px; xx < px + u; xx++) { const o = yy * (size * 3 + 1) + 1 + xx * 3; raw[o] = 255; raw[o + 1] = 255; raw[o + 2] = 255; }
  })));
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function manifest(p) {
  const base = '/' + p.pageSlug + '/', short = String(p.name).length > 12 ? String(p.name).slice(0, 12).trim() : p.name;
  const ic = (s, purpose) => ({ src: base + 'icon-' + s + '.png', sizes: s + 'x' + s, type: 'image/png', purpose });
  return JSON.stringify({
    id: base, name: p.appName || p.name, short_name: String(p.appName || short).slice(0, 12), description: p.name,
    start_url: base, scope: base, display: 'standalone', orientation: 'any',
    background_color: '#ffffff', theme_color: p.themeColor && /^#[0-9a-f]{6}$/i.test(p.themeColor) ? p.themeColor : hex(brand(p)),
    icons: [ic(192, 'any'), ic(512, 'any'), ic(192, 'maskable'), ic(512, 'maskable')]
  });
}

/* minimal service worker: only there so the browser treats the page as an installable app (no caching = school data is always live) */
const SW = "self.addEventListener('install',function(){self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});self.addEventListener('fetch',function(){});";

/* answers /<slug>/manifest.webmanifest, /sw.js, /icon-<n>.png ; returns null if the file name is unknown */
function file(p, name) {
  if (name === 'manifest.webmanifest') return { status: 200, type: 'application/manifest+json; charset=utf-8', body: manifest(p) };
  if (name === 'sw.js') return { status: 200, type: 'application/javascript; charset=utf-8', body: SW };
  const m = /^icon-(180|192|512)\.png$/.exec(name);
  if (m && /^https?:\/\//i.test(String(p.appIcon || ''))) return { status: 302, type: 'text/plain', body: '', location: p.appIcon };   // custom App Icon (Admin panel) wins; blank = auto letters icon
  if (m) return { status: 200, type: 'image/png', body: icon(p, +m[1]) };
  return null;
}

module.exports = { file, brand, hex };
