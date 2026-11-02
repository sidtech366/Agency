/* SidTech 366 — Vercel serverless entry. Every page request comes here (see vercel.json). */
const { route } = require('../lib/render');

const EMPTY = { settings: {}, categories: [], portfolio: [], services: [], certificates: [], pages: {}, faqs: [], testimonials: [], counts: {} };
let MEM = { data: null, at: 0 };

async function getData(fresh) {
  const api = process.env.ST366_API;
  if (!api) return { data: EMPTY, ok: false, why: 'ST366_API is not set' };
  if (!fresh && MEM.data && Date.now() - MEM.at < 10 * 60 * 1000) return { data: MEM.data, ok: true };
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(api + (api.includes('?') ? '&' : '?') + 'api=site&_=' + Date.now(), { redirect: 'follow', signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j && j.ok) { MEM = { data: j, at: Date.now() }; return { data: j, ok: true }; }
    throw new Error((j && j.error) || 'Bad response');
  } catch (err) {
    if (MEM.data) return { data: MEM.data, ok: true, stale: true };       // purana data dikhao, site band na ho
    return { data: EMPTY, ok: false, why: String(err.message || err) };
  }
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'localhost'));
  const path = url.searchParams.get('__p') !== null ? url.searchParams.get('__p') : url.pathname;
  const query = Object.fromEntries(url.searchParams.entries()); delete query.__p;
  const fresh = 'refresh' in query;
  const origin = (process.env.SITE_URL || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host))).replace(/\/+$/, '');
  const { data, ok } = await getData(fresh);
  const out = route(data, origin, path, query);
  res.statusCode = out.status;
  res.setHeader('Content-Type', out.type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CDN cache: 10 min fresh, phir background me naya (stale-while-revalidate). ?refresh=1 = turant naya.
  res.setHeader('Cache-Control', fresh || !ok ? 'no-store' : (out.status === 200 ? 'public, s-maxage=600, stale-while-revalidate=86400' : 'public, s-maxage=60'));
  res.end(out.body);
};
