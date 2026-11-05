/* SidTech 366 — Razorpay payments (Vercel serverless). Reached as /rzp.json?step=order|verify|webhook|check  (see vercel.json)

   Keys live ONLY in Vercel -> Settings -> Environment Variables (never in the Google Sheet):
     RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, (optional) RAZORPAY_WEBHOOK_SECRET
   Admin panel -> Settings -> "How should clients pay?" (PayMode = manual | razorpay | both) decides if the website offers it.

   Flow:  order   -> we create a Razorpay order (amount is calculated HERE from the service price, never trusted from the browser)
          verify  -> browser sends the payment result; we check the signature, ask Razorpay itself if the money is captured,
                     then save the order in the Google Sheet (same "Orders" list as before, already verified).
          webhook -> safety net: if the client closes the page after paying, Razorpay tells us and we save the order anyway. */
const crypto = require('crypto');
const { getData } = require('../lib/data');

const env = (k) => String(process.env[k] || '').trim();
const clip = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
const DONE = new Set();      // payment ids already saved (this server instance)
const HITS = new Map();      // tiny per-IP limiter for order creation

class Pub extends Error { constructor(msg, status) { super(msg); this.expose = true; this.status = status || 400; } }
const send = (res, code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const hmac = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('hex');
const payMode = (d) => String(((d && d.settings) || {}).PayMode || env('PAY_MODE') || 'manual').toLowerCase().trim();   // Admin setting wins; PAY_MODE (Vercel) is only a fallback
const keysSet = () => !!(env('RAZORPAY_KEY_ID') && env('RAZORPAY_KEY_SECRET'));
const onlineOn = (d) => keysSet() && (payMode(d) === 'razorpay' || payMode(d) === 'both');

/* what the client pays first = same rule as the website's order box */
function firstAmount(s) {
  const pr = +s.price || 0, inst = s.installments;
  return Math.round(pr * ((inst && inst.length) ? (+inst[0].percent || 0) : (+s.advance || 0)) / 100);
}

async function rzp(path, method, body) {
  const r = await fetch('https://api.razorpay.com/v1' + path, {
    method: method || 'GET',
    headers: { Authorization: 'Basic ' + Buffer.from(env('RAZORPAY_KEY_ID') + ':' + env('RAZORPAY_KEY_SECRET')).toString('base64'), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.description) || 'Razorpay error (' + r.status + ')');
  return j;
}

/* same public endpoint the website itself uses to save an order */
async function appsPost(obj) {
  const api = env('ST366_API'); if (!api) return { ok: false, error: 'ST366_API is not set' };
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(obj), redirect: 'follow', signal: ctl.signal });
    clearTimeout(t); return await r.json();
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
}

/* save the verified payment as an order in the sheet */
async function record(order, pay) {
  if (DONE.has(pay.id)) return { ok: true, dup: true };
  DONE.add(pay.id);
  const n = order.notes || {}, amt = Math.round(pay.amount / 100);
  const utr = 'PAY' + String(pay.id).replace(/^pay_/, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 19);     // looks like a UTR, starts with PAY = Razorpay
  const tag = '✅ Paid online via Razorpay — ' + pay.id + ' (' + order.id + ') ₹' + amt + ' — verified automatically';
  const base = { action: 'order', serviceId: n.sid, name: n.name, mobile: n.mobile, email: n.email || '', city: n.city || '', notes: clip((n.msg ? n.msg + ' | ' : '') + tag, 500), website: '' };
  let j = await appsPost(Object.assign({}, base, { mode: 'UPI', amount: amt, utr }));
  if (!j.ok && /already|duplicate/i.test(String(j.error || ''))) return { ok: true, dup: true };
  if (!j.ok) {   // UPI-style save refused -> still keep the paid order as an enquiry with the payment details, so nothing is lost
    console.error('record as UPI failed:', j.error);
    j = await appsPost(Object.assign({}, base, { mode: 'Enquiry', notes: clip(tag + ' | (saved as enquiry: ' + (j.error || 'error') + ')' + (n.msg ? ' | ' + n.msg : ''), 500) }));
  }
  if (!j.ok) { DONE.delete(pay.id); console.error('record failed:', j.error); }
  return j;
}

function readRaw(req) { return new Promise((res, rej) => { const c = []; req.on('data', (d) => c.push(Buffer.isBuffer(d) ? d : Buffer.from(d))); req.on('end', () => res(Buffer.concat(c))); req.on('error', rej); }); }
async function jsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (await readRaw(req)).toString('utf8'));
  try { return JSON.parse(raw || '{}'); } catch (x) { return {}; }
}

async function createOrder(b, ip) {
  if (b.website) throw new Pub('Please try again');
  const now = Date.now(), hits = (HITS.get(ip) || []).filter((t) => now - t < 3600e3);
  if (hits.length >= 20) throw new Pub('Too many attempts. Please try again after some time.', 429);
  hits.push(now); HITS.set(ip, hits);
  const d = (await getData()).data;
  if (!onlineOn(d)) throw new Pub('Online payment is not available right now. Please pay by UPI or send an enquiry.');
  const s = (d.services || []).find((x) => String(x.id) === String(b.serviceId));
  if (!s) throw new Pub('Service not found. Please reload the page.');
  const name = clip(b.name, 80), mobile = String(b.mobile || '').replace(/\D/g, '');
  if (name.length < 2) throw new Pub('Please enter your name');
  if (!/^\d{10}$/.test(mobile)) throw new Pub('Enter a 10-digit mobile number');
  const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email || '').trim()) ? clip(b.email, 80) : '';
  const amt = firstAmount(s);
  if (!(amt >= 1)) throw new Pub('This service has no online payment amount set. Please send an enquiry.');
  const order = await rzp('/orders', 'POST', {
    amount: amt * 100, currency: 'INR', receipt: ('ST' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex')).slice(0, 40),
    notes: { sid: String(s.id), svc: clip(s.name, 60), name, mobile, email, city: clip(b.city, 60), msg: clip(b.notes, 200) }
  });
  return { ok: true, keyId: env('RAZORPAY_KEY_ID'), orderId: order.id, amount: order.amount, currency: order.currency, name: clip((d.settings || {}).CompanyName || 'SidTech 366', 60), description: clip(s.name, 100) };
}

async function verifyPayment(b) {
  if (!keysSet()) throw new Pub('Online payment is not set up', 503);
  const orderId = String(b.orderId || ''), paymentId = String(b.paymentId || ''), sig = String(b.signature || '');
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new Pub('Invalid payment details');
  if (!eq(hmac(orderId + '|' + paymentId, env('RAZORPAY_KEY_SECRET')), sig)) throw new Pub('Payment could not be verified (signature mismatch)', 400);
  const [order, p0] = await Promise.all([rzp('/orders/' + orderId), rzp('/payments/' + paymentId)]);     // ask Razorpay itself, do not trust the browser
  let pay = p0;
  if (pay.order_id !== order.id || pay.amount !== order.amount || pay.currency !== order.currency) throw new Pub('Payment details do not match');
  if (pay.status === 'authorized') pay = await rzp('/payments/' + paymentId + '/capture', 'POST', { amount: pay.amount, currency: pay.currency });
  if (pay.status !== 'captured') throw new Pub('Payment is not completed yet (status: ' + pay.status + ')');
  const j = await record(order, pay);
  return { ok: true, id: j.id || '', paymentId: pay.id, amount: Math.round(pay.amount / 100), recorded: !!j.ok };
}

async function webhook(req, res) {
  const raw = await readRaw(req), secret = env('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) return send(res, 503, { ok: false, error: 'Webhook secret is not set' });
  if (!eq(hmac(raw, secret), String(req.headers['x-razorpay-signature'] || ''))) return send(res, 400, { ok: false, error: 'Bad signature' });
  let ev; try { ev = JSON.parse(raw.toString('utf8')); } catch (x) { return send(res, 400, { ok: false, error: 'Bad body' }); }
  if (ev.event === 'payment.captured' || ev.event === 'order.paid') {
    const pe = ev.payload && ev.payload.payment && ev.payload.payment.entity;
    if (pe && pe.order_id && pe.status === 'captured') {
      const order = await rzp('/orders/' + pe.order_id);
      if (order.notes && order.notes.sid) await record(order, pe);      // only payments that started on our website have notes.sid
    }
  }
  return send(res, 200, { ok: true });
}

async function check(fresh) {
  const d = (await getData(fresh)).data, kid = env('RAZORPAY_KEY_ID');
  const out = { payModeSetInAdmin: payMode(d), keyIdSet: !!kid, keySecretSet: !!env('RAZORPAY_KEY_SECRET'), keyType: /^rzp_live_/.test(kid) ? 'LIVE' : /^rzp_test_/.test(kid) ? 'TEST (no real money)' : (kid ? 'unknown' : ''), webhookSecretSet: !!env('RAZORPAY_WEBHOOK_SECRET'), appsScriptLinked: !!env('ST366_API') };
  if (keysSet()) { try { await rzp('/orders?count=1'); out.razorpayLogin = 'OK'; } catch (e) { out.razorpayLogin = 'FAILED: ' + e.message; } }
  out.websiteOffersRazorpay = out.razorpayLogin === 'OK' && (out.payModeSetInAdmin === 'razorpay' || out.payModeSetInAdmin === 'both');
  return out;
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://x'), step = url.searchParams.get('step') || '';
  try {
    if (step === 'check') return send(res, 200, await check(url.searchParams.has('refresh')));
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST only' });
    if (step === 'webhook') return await webhook(req, res);
    const body = await jsonBody(req);
    if (step === 'order') return send(res, 200, await createOrder(body, String((req.headers['x-forwarded-for'] || '').split(',')[0] || 'x').trim()));
    if (step === 'verify') return send(res, 200, await verifyPayment(body));
    return send(res, 404, { ok: false, error: 'Unknown step' });
  } catch (e) {
    console.error('pay error:', e && e.message);
    return send(res, e.status || 500, { ok: false, error: e.expose ? e.message : 'Payment service error. Please try again, or contact us.' });
  }
};
module.exports.firstAmount = firstAmount;
