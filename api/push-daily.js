/* Daily morning notification (Vercel Cron, see vercel.json "crons").
   Sends one push to every subscriber of each app in lib/apps.js that has a OneSignal App ID.
   Vercel env needed:  ONESIGNAL_APP_ID_ASTROVIKAS, ONESIGNAL_REST_KEY_ASTROVIKAS, CRON_SECRET (any long random text).
   Manual test:  https://<site>/api/push-daily?key=<CRON_SECRET>  */
const { APPS } = require('../lib/apps');

const DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const LINES = [
  'अपनी राशि का आज का फल, शुभ रंग और उपाय देखें।',
  'आज कौन सा समय शुभ है? अपनी राशि खोलकर देखें।',
  'नौकरी, धन, प्रेम और स्वास्थ्य — आज आपके सितारे क्या कहते हैं?',
  'दिन की शुरुआत सही दिशा में — आज का राशिफल और लाल किताब उपाय।',
  'आज का पंचांग और आपकी राशि का फल तैयार है।',
  'ग्रहों की चाल आज आपके लिए क्या लाई है? अभी देखें।',
  'आज का भाग्यशाली अंक, रंग और उपाय — अपनी राशि में देखें।'
];

function today() {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);          // India time
  return { day: DAYS[ist.getUTCDay()], date: ist.getUTCDate() + ' ' + MONTHS[ist.getUTCMonth()], n: ist.getUTCDay(), key: ist.toISOString().slice(0, 10) };
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://x');
  const secret = process.env.CRON_SECRET || '';
  const ok = secret && (req.headers.authorization === 'Bearer ' + secret || url.searchParams.get('key') === secret);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (!ok) { res.statusCode = 401; return res.end(JSON.stringify({ ok: false, error: 'unauthorised' })); }

  const origin = (process.env.SITE_URL || 'https://sidtech366.vercel.app').replace(/\/+$/, '');
  const t = today(), out = {};
  for (const [slug, a] of Object.entries(APPS)) {
    const key = process.env['ONESIGNAL_REST_KEY_' + slug.toUpperCase()];
    if (!a.onesignal || !key || !a.push) { out[slug] = 'skipped (no App ID / REST key)'; continue; }
    const body = {
      app_id: a.onesignal,
      target_channel: 'push',
      included_segments: ['Total Subscriptions'],
      headings: { en: a.push.title },
      contents: { en: t.day + ', ' + t.date + ' — ' + LINES[t.n % LINES.length] },
      url: origin + a.push.url,
      chrome_web_icon: origin + '/' + slug + '/icon-192.png',
      ttl: 6 * 3600                                        // phone off till noon? then skip, don't show stale news
    };
    try {
      const r = await fetch('https://api.onesignal.com/notifications?c=push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: 'Key ' + key },
        body: JSON.stringify(body)
      });
      out[slug] = { status: r.status, reply: await r.json().catch(() => null) };
    } catch (err) { out[slug] = { error: String(err.message || err) }; }
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, date: t.key, sent: out }));
};
