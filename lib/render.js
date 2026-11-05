const pwa = require('./pwa');
/* SidTech 366 website — server-side page builder (Vercel). Same pages & design as the WordPress version.
   Data: Apps Script ?api=site (process.env.ST366_API). */
const { CSS, CLIENT_JS } = require('./assets');

const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '₹' + Math.round(+n || 0).toLocaleString('en-IN');
const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const jattr = (v) => e(JSON.stringify(v));                       // JSON value inside onclick="…"
/* admin-written page HTML: remove scripts / event handlers / javascript: links */
const safeHtml = (h) => String(h || '').replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '').replace(/<\s*(script|iframe|object|embed)[^>]*\/?>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');

function ctx(d, origin) {
  const s = d.settings || {};
  const S = (k, def = '') => (s[k] !== undefined && s[k] !== '' ? s[k] : def);
  const U = (p = '') => origin + '/' + String(p).replace(/^\/+/, '');
  return { d, S, U, co: S('CompanyName', 'SidTech 366') };
}

/* ================= layout ================= */
function layout(C, title, desc, path, body, ld = [], active = '') {
  const { d, S, U, co } = C;
  const logo = S('Logo'), og = S('OgImage', logo), canon = U(path), gsv = process.env.ST366_GSV || S('GscTag'), ga = S('GaId');
  const org = { '@type': 'Organization', '@id': U('#org'), name: co, url: U(), telephone: S('Phone'), email: S('Email'),
    address: { '@type': 'PostalAddress', streetAddress: S('Address'), addressLocality: S('City'), addressRegion: S('State'), addressCountry: 'IN' } };
  if (logo) org.logo = logo;
  const same = ['Facebook', 'Instagram', 'Youtube', 'Linkedin', 'XUrl'].map((k) => S(k)).filter(Boolean); if (same.length) org.sameAs = same;
  const graph = [org, { '@type': 'WebSite', name: co, url: U() }].concat(ld);
  const nav = [['', 'Home'], ['work/', 'Our Work'], ['services/', 'Services & Pricing'], ['why-school-software/', 'For Schools'], ['franchise/', 'Franchise'], ['verify/', 'Verify'], ['contact/', 'Contact']];
  const d160 = strip(desc).slice(0, 160), wa = String(S('WhatsApp')).replace(/\D/g, '');
  const reg = (S('Udyam') || S('GSTIN') || S('RegNo')) ? '<p class="reg">' + (S('Udyam') ? '🏅 Udyam (MSME): <b>' + e(S('Udyam')) + '</b><br>' : '') + (S('GSTIN') ? '🧾 GSTIN: <b>' + e(S('GSTIN')) + '</b><br>' : '') + (S('RegNo') ? '📜 Reg. No: <b>' + e(S('RegNo')) + '</b>' : '') + '</p>' : '';
  const cfg = { api: process.env.ST366_API || '', co, wa, upi: S('UpiId'), upiName: S('UpiName', co), qr: S('UpiQr'), guarantee: S('CashbackText'), payMode: String(S('PayMode') || process.env.PAY_MODE || 'manual').toLowerCase().trim(), rzp: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    services: (d.services || []).map((x) => ({ id: x.id, name: x.name, price: x.price, advance: x.advance, inst: x.installments })) };
  const brand = (cls) => '<a class="brand" href="' + e(U()) + '"' + (cls || '') + '>' + (logo ? '<img src="' + e(logo) + '" alt="' + e(co) + ' logo">' : '<span class="mk">S</span>') + '<span>' + e(co) + '</span></a>';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + e(title) + '</title><meta name="description" content="' + e(d160) + '"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="' + e(canon) + '">' +
    (gsv ? '<meta name="google-site-verification" content="' + e(gsv) + '">' : '') +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="' + e(co) + '"><meta property="og:title" content="' + e(title) + '"><meta property="og:description" content="' + e(strip(desc).slice(0, 200)) + '"><meta property="og:url" content="' + e(canon) + '">' +
    (og ? '<meta property="og:image" content="' + e(og) + '"><meta name="twitter:card" content="summary_large_image">' : '') + (logo ? '<link rel="icon" href="' + e(logo) + '"><link rel="apple-touch-icon" href="' + e(logo) + '">' : '') +
    '<meta name="theme-color" content="#0b1024"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">' +
    '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') + '</script>' +
    (ga ? '<script async src="https://www.googletagmanager.com/gtag/js?id=' + e(ga) + '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config",' + JSON.stringify(ga) + ');</script>' : '') +
    '<style>' + CSS + '</style></head><body>' +
    '<header class="hd" id="hd"><div class="wrap hd-in">' + brand() + '<nav class="nav" id="nav">' + nav.map((n) => '<a href="' + e(U(n[0])) + '"' + (active === n[0] ? ' class="on"' : '') + '>' + e(n[1]) + '</a>').join('') + '</nav>' +
    '<div class="hd-r"><a class="btn ghost sm" href="' + e(U('portal/')) + '">Partner login</a><a class="btn sm" href="' + e(U('services/')) + '">Get started</a><button class="burger" aria-label="Menu" onclick="document.body.classList.toggle(\'menu\')">☰</button></div></div></header>' +
    '<main>' + body + '</main>' +
    '<footer class="ft"><div class="wrap ft-g"><div><div style="margin-bottom:10px">' + brand() + '</div><p>' + e(S('Tagline')) + '</p><p>📍 ' + e(S('Address')) + '<br>📞 <a href="tel:' + e(String(S('Phone')).replace(/\s/g, '')) + '">' + e(S('Phone')) + '</a><br>✉️ <a href="mailto:' + e(S('Email')) + '">' + e(S('Email')) + '</a></p>' + reg + '</div>' +
    '<div><h4>Our work</h4>' + (d.categories || []).map((c) => '<a href="' + e(U('work/' + c.slug + '/')) + '">' + e(c.name) + '</a>').join('') + '</div>' +
    '<div><h4>Company</h4><a href="' + e(U('about/')) + '">About us</a><a href="' + e(U('services/')) + '">Services & pricing</a><a href="' + e(U('franchise/')) + '">Become a partner</a><a href="' + e(U('verify/')) + '">Verify ID / certificate</a><a href="' + e(U('contact/')) + '">Contact</a></div>' +
    '<div><h4>Policies</h4><a href="' + e(U('terms/')) + '">Terms & conditions</a><a href="' + e(U('privacy-policy/')) + '">Privacy policy</a><a href="' + e(U('refund-policy/')) + '">Refund & cashback guarantee</a><a href="' + e(U('delivery-policy/')) + '">Delivery policy</a><a href="' + e(U('disclaimer/')) + '">Disclaimer</a></div></div>' +
    '<div class="wrap ft-b"><span>© ' + new Date().getFullYear() + ' ' + e(co) + '. All rights reserved.</span><span class="soc">' + [['Facebook', 'Facebook'], ['Instagram', 'Instagram'], ['Youtube', 'YouTube'], ['Linkedin', 'LinkedIn'], ['XUrl', 'X']].filter((x) => S(x[0])).map((x) => '<a href="' + e(S(x[0])) + '" target="_blank" rel="noopener">' + x[1] + '</a>').join('') + '</span></div></footer>' +
    (wa ? '<a class="wa-f" href="https://wa.me/' + wa + '?text=' + encodeURIComponent('Hello ' + co + ', I want to know more about your services.') + '" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>' : '') +
    '<div class="mdl" id="mdl" onclick="if(event.target===this)st.close()"><div class="mdl-b"><button class="mdl-x" onclick="st.close()" aria-label="Close">✕</button><div id="mdlc"></div></div></div>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" defer></script><script>var ST366=' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ';</script><script>' + CLIENT_JS + '</script></body></html>';
}
function fullframe(C, url, label) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>' + e(label + ' — ' + C.co) + '</title>' +
    '<style>html,body{margin:0;height:100%;overflow:hidden;background:#0b1024}iframe{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;border:0;background:#fff}#l{position:fixed;inset:0;display:grid;place-items:center;color:#cbd5e1;font:600 15px system-ui,sans-serif}</style></head>' +
    '<body><div id="l">Loading…</div><iframe src="' + e(url) + '" allow="camera; clipboard-read; clipboard-write; fullscreen; web-share" onload="document.getElementById(\'l\').remove()"></iframe></body></html>';
}

/* the school's own address (/greenvalley): only their software, full screen. No SidTech bar, no links out, Back stays on this page.
   It is also an installable app ("Add to Home screen"): own name + icon per school. */
function cleanFrame(p) {
  const base = '/' + p.pageSlug + '/', th = pwa.hex(pwa.brand(p));
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>' + e(p.name) + '</title>' +
    '<link rel="manifest" href="' + base + 'manifest.webmanifest"><meta name="theme-color" content="' + th + '"><link rel="icon" type="image/png" href="' + base + 'icon-192.png"><link rel="apple-touch-icon" href="' + base + 'icon-180.png">' +
    '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="' + e(String(p.name).slice(0, 14)) + '"><meta name="apple-mobile-web-app-status-bar-style" content="default">' +
    '<style>html,body{margin:0;height:100%;overflow:hidden;background:#fff}iframe{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;border:0;background:#fff}#l{position:fixed;inset:0;display:grid;place-items:center;color:#5b6478;font:600 15px system-ui,sans-serif}' +
    '#ia{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);background:#0f172a;color:#fff;border-radius:999px;padding:7px 8px 7px 14px;font:600 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28)}#ia[hidden]{display:none}' +
    '#ia button{border:0;border-radius:999px;font:700 12.5px system-ui,sans-serif;cursor:pointer}#ib{background:#fff;color:#0f172a;padding:6px 12px}#ix{background:rgba(255,255,255,.16);color:#fff;width:26px;height:26px}</style></head>' +
    '<body><div id="l">' + e(p.name) + '…</div><iframe title="' + e(p.name) + '" src="' + e(p.link) + '" allow="camera; clipboard-read; clipboard-write; fullscreen; web-share; microphone" referrerpolicy="no-referrer-when-downgrade" onload="var l=document.getElementById(\'l\');l&&l.remove()"></iframe>' +
    '<div id="ia" hidden><span id="im"></span><button id="ib" type="button" hidden>Install</button><button id="ix" type="button" aria-label="Close">✕</button></div>' +
    '<script>(function(){var on=0;function arm(){if(on)return;on=1;try{history.pushState({g:1},"",location.href);window.addEventListener("popstate",function(){history.pushState({g:1},"",location.href)})}catch(x){}}' +
    'window.addEventListener("blur",arm);["pointerdown","touchstart","keydown"].forEach(function(t){window.addEventListener(t,arm,{once:true,passive:true})})})();' +
    '(function(){try{if("serviceWorker" in navigator)navigator.serviceWorker.register("' + base + 'sw.js",{scope:"' + base + '"})}catch(x){}' +
    'var K="st_pwa_x",dp=null,bar=document.getElementById("ia"),im=document.getElementById("im"),ib=document.getElementById("ib");' +
    'if((window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone)return;try{if(localStorage.getItem(K))return}catch(x){}' +
    'function show(t,b){im.textContent=t;ib.hidden=!b;bar.hidden=false;setTimeout(function(){bar.hidden=true},20000)}' +
    'window.addEventListener("beforeinstallprompt",function(ev){ev.preventDefault();dp=ev;show("Install this app on your phone",true)});' +
    'if(/iphone|ipad|ipod/i.test(navigator.userAgent))setTimeout(function(){show("Tap Share, then Add to Home Screen",false)},2500);' +
    'ib.onclick=function(){if(dp){dp.prompt();dp.userChoice.then(function(){bar.hidden=true;dp=null})}};' +
    'document.getElementById("ix").onclick=function(){bar.hidden=true;try{localStorage.setItem(K,"1")}catch(x){}};' +
    'window.addEventListener("appinstalled",function(){bar.hidden=true})})()</script></body></html>';
}

/* one full page per demo / delivered site: ID & password bar on top, the site fills the rest of the screen */
function siteFrame(C, p, clean) {
  const { d, U, co } = C, cat = (d.categories || []).find((c) => c.id === p.cat), back = cat ? U('work/' + cat.slug + '/') : U();
  const chip = (l, v) => '<span class="cc">' + l + ' <b>' + e(v) + '</b><button type="button" data-c="' + e(v) + '" onclick="cp(this)">Copy</button></span>';
  const creds = credsOn(p) ? '<div class="cr">' + (p.user ? chip('ID', p.user) : '') + (p.pass ? chip('Password', p.pass) : '') + '</div>' : '';
  if (clean) return cleanFrame(p);
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>' + e(p.name + ' — ' + co) + '</title>' +
    '<style>html,body{margin:0;height:100%}body{display:flex;flex-direction:column;height:100vh;height:100dvh;background:#fff;color:#0f172a;font:14px/1.4 "Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.bar{flex:none;display:flex;align-items:center;flex-wrap:wrap;gap:4px 14px;padding:6px 12px;background:#fff;border-bottom:1px solid #e5e7ef}' +
    '.bk{color:#4f46e5;font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap;max-width:48%;overflow:hidden;text-overflow:ellipsis}.nm{flex:1;min-width:0;font-weight:800;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cr{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;white-space:nowrap;max-width:100%}' +
    '.cc{display:inline-flex;align-items:center;gap:5px;color:#5b6478;font-size:12px}' +
    '.cc b{color:#0f172a;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px}.cc button{border:1px solid #e5e7ef;background:#f6f7fb;color:#0f172a;border-radius:6px;padding:1px 7px;font:700 11.5px system-ui,sans-serif;cursor:pointer}' +
    '.fw{position:relative;flex:1 1 auto;min-height:0}.fw iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}#l{position:absolute;inset:0;display:grid;place-items:center;color:#5b6478;font-weight:600}' +
    '@media(max-width:640px){.cr{width:100%}}</style></head>' +
    '<body><div class="bar"><a class="bk" href="' + e(back) + '">← ' + e(cat ? cat.name : co) + '</a><span class="nm">' + e(p.name) + '</span>' + creds + '</div>' +
    '<div class="fw"><div id="l">Loading…</div><iframe title="' + e(p.name) + '" src="' + e(p.link) + '" allow="camera; clipboard-read; clipboard-write; fullscreen; web-share" referrerpolicy="no-referrer-when-downgrade" onload="var l=document.getElementById(\'l\');l&&l.remove()"></iframe></div>' +
    '<script>function cp(b){var t=b.getAttribute("data-c"),o=b.textContent;try{navigator.clipboard.writeText(t)}catch(x){var i=document.createElement("textarea");i.value=t;document.body.appendChild(i);i.select();try{document.execCommand("copy")}catch(y){}i.remove()}b.textContent="Copied ✓";setTimeout(function(){b.textContent=o},1400)}</script></body></html>';
}

/* ================= shared blocks ================= */
const ticks = (l, cls) => '<ul class="ticks' + (cls ? ' ' + cls : '') + '">' + l.map((x) => '<li>' + e(x) + '</li>').join('') + '</ul>';
const featGrid = (l) => '<div class="feat">' + l.map((f) => '<div><span class="ic">' + f[0] + '</span><h3>' + e(f[1]) + '</h3><p>' + e(f[2]) + '</p></div>').join('') + '</div>';
function pricing(svc, limit, C) {
  let l = svc.slice();
  if (limit) { l.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0)); l = l.slice(0, limit); }
  return '<div class="price-g">' + l.map((s) => '<div class="price' + (s.popular ? ' pop' : '') + '">' + (s.popular ? '<span class="tag">Most popular</span>' : '') + (s.image ? '<img src="' + e(s.image) + '" alt="" loading="lazy">' : '') +
    '<h3>' + e(s.name) + '</h3><p class="pd">' + e(s.desc) + '</p><div class="amt">' + money(s.price) + (s.mrp > s.price ? '<s>' + money(s.mrp) + '</s>' : '') + '</div>' +
    '<div class="pm">Advance ' + (s.advance | 0) + '% (' + money(s.price * s.advance / 100) + ')' + (s.delivery ? ' · ' + e(s.delivery) : '') + '</div>' + (s.features && s.features.length ? ticks(s.features) : '') +
    (s.installments && s.installments.length ? '<div class="inst"><b>Pay in ' + s.installments.length + ' parts</b>' + s.installments.map((x) => '<span>' + e(x.title) + ' — ' + (x.percent | 0) + '%</span>').join('') + '</div>' : '') +
    '<div class="pbtn"><button class="btn wide" onclick="st.buy(' + jattr(s.id) + ')">Buy now</button><button class="btn ghost wide" onclick="st.enquire(' + jattr(s.id) + ')">Enquire</button></div>' + (C ? svcLive(C, s) : '') + '</div>').join('') + '</div>';
}
/* ID / password rules: demo items show them (if filled); delivered items only when admin sets "Show ID & password" = Yes */
const credsOn = (p) => !!(p.user || p.pass) && (!!p.demo || /^(yes|true|1)$/i.test(String(p.showCreds || '')));
/* every portfolio item gets its own page:  /<slug>  (slug = name without spaces, e.g. "Demo School" -> /demoschool) */
const compact = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const RESERVED = ['portal', 'partnerlogin', 'login', 'adminpanel', 'stadmin', 'home', 'work', 'services', 'pricing', 'packages', 'franchise', 'verify', 'contact', 'contactus', 'about', 'aboutus', 'terms', 'termsandconditions', 'privacy', 'privacypolicy', 'refundpolicy', 'cashbackguarantee', 'disclaimer', 'deliverypolicy', 'api', 'robotstxt', 'sitemapxml', 'st366sitemapxml'];
function assignSlugs(d) {
  const used = new Set(RESERVED);
  (d.categories || []).forEach((c) => { if (c.promo) used.add(compact(c.promo)); });
  Object.keys(d.pages || {}).forEach((k) => used.add(compact(k)));
  (d.portfolio || []).forEach((p, i) => {
    const base = compact(p.slug) || compact(p.name) || compact(p.id) || 'site' + (i + 1);
    let k = base, n = 2; while (used.has(k)) k = base + n++;
    used.add(k); p.pageSlug = k;
  });
}
const pageHref = (p) => '/' + (p.pageSlug || '') + (p.demo ? '' : '?v=1');   // /slug = clean (for the school itself); ?v=1 = shown from our site
function openBtns(p, big) {
  if (!p.link || !p.pageSlug) return '';
  return '<a class="btn' + (big ? ' lg' : ' sm') + '" href="' + e(pageHref(p)) + '">' + (big ? '▶ Open demo here' : 'Open') + '</a>';
}
const credMini = (p) => credsOn(p) ? '<div class="cmini">' + (p.user ? '<span>ID <b>' + e(p.user) + '</b><button type="button" onclick="st.copy(' + jattr(p.user) + ')">Copy</button></span>' : '') + (p.pass ? '<span>Password <b>' + e(p.pass) + '</b><button type="button" onclick="st.copy(' + jattr(p.pass) + ')">Copy</button></span>' : '') + '</div>' : '';
/* service -> its category (explicit s.cat if the backend sends it, otherwise matched by words in the names) */
const GENERIC = /^(system|management|software|online|digital|solution|package)s?$/;
function svcCat(d, s) {
  const cats = d.categories || [], has = (c) => (d.portfolio || []).some((x) => x.cat === c.id);
  if (s.cat) { const c = cats.find((x) => x.id === s.cat); if (c) return c; }
  const nm = String(s.name || '').toLowerCase();
  let best = null, top = 0;
  cats.filter(has).forEach((c) => {
    const sc = String(c.name || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !GENERIC.test(w)).map((w) => w.replace(/s$/, '')).filter((w) => nm.includes(w)).length;
    if (sc > top) { top = sc; best = c; }
  });
  return best;
}
function svcLive(C, s) {
  const { d, U } = C, c = svcCat(d, s); if (!c) return '';
  const items = (d.portfolio || []).filter((x) => x.cat === c.id), demo = items.find((x) => x.demo && x.link), n = items.filter((x) => !x.demo).length;
  if (!demo && !n) return '';
  return '<div class="plive">' + (demo && demo.pageSlug ? '<a class="btn ghost wide" href="' + e(pageHref(demo)) + '">▶ Try the live demo</a>' : '') +
    (n ? '<a class="plink" href="' + e(U('work/' + c.slug + '/')) + '">' + n + ' delivered project' + (n > 1 ? 's' : '') + ' — see them live</a>' : '') + '</div>';
}
function pitem(p, sub) {
  return '<div class="pitem"><div class="pi-l">' + (p.image ? '<img src="' + e(p.image) + '" alt="" loading="lazy">' : '<span class="av">' + e(String(p.name || '?').slice(0, 1)) + '</span>') +
    '<div><b>' + e(p.name) + '</b><small>' + e(sub) + '</small>' + (p.desc && sub !== null ? '<p>' + e(p.desc) + '</p>' : '') + credMini(p) + '</div></div><div class="pi-r">' + openBtns(p) + '</div></div>';
}
function credBox(p) {
  if (!credsOn(p)) return '';
  return '<div class="cred"><div><span>Login ID</span><b>' + e(p.user) + '</b><button onclick="st.copy(' + jattr(p.user) + ')">Copy</button></div><div><span>Password</span><b>' + e(p.pass) + '</b><button onclick="st.copy(' + jattr(p.pass) + ')">Copy</button></div></div>';
}
function trust(C) {
  const { d, S, co } = C, certs = d.certificates || [];
  if (!certs.length && !S('Udyam') && !S('GSTIN') && !S('RegNo')) return '';
  return '<section class="sec alt"><div class="wrap"><div class="sh"><h2>🏅 Trusted & registered</h2><p>Verified registrations and certificates of ' + e(co) + '.</p></div><div class="ids">' +
    (S('Udyam') ? '<div><span>Udyam (MSME) Registration</span><b>' + e(S('Udyam')) + '</b></div>' : '') + (S('GSTIN') ? '<div><span>GSTIN</span><b>' + e(S('GSTIN')) + '</b></div>' : '') + (S('RegNo') ? '<div><span>Registration No</span><b>' + e(S('RegNo')) + '</b></div>' : '') + '</div>' +
    (certs.length ? '<div class="certs">' + certs.map((c) => '<figure>' + (c.image ? '<a href="' + e(c.image) + '" target="_blank" rel="noopener"><img src="' + e(c.image) + '" alt="' + e(c.title) + '" loading="lazy"></a>' : '<div class="ph">📜</div>') + '<figcaption><b>' + e(c.title) + '</b>' + (c.number ? '<span>' + e(c.number) + '</span>' : '') + (c.issuer ? '<span>' + e(c.issuer) + '</span>' : '') + '</figcaption></figure>').join('') + '</div>' : '') + '</div></section>';
}
const testimonials = (d) => !(d.testimonials || []).length ? '' : '<section class="sec"><div class="wrap"><div class="sh"><h2>What our clients say</h2></div><div class="tst">' + d.testimonials.map((t) => '<blockquote><div class="stars">' + '★'.repeat(Math.max(1, Math.min(5, t.rating | 0))) + '</div><p>“' + e(t.text) + '”</p><cite><b>' + e(t.name) + '</b>' + (t.role ? ' · ' + e(t.role) : '') + '</cite></blockquote>').join('') + '</div></div></section>';
const faq = (l) => !(l || []).length ? '' : '<section class="sec"><div class="wrap narrow"><div class="sh"><h2>Frequently asked questions</h2></div><div class="faq">' + l.map((f) => '<details><summary>' + e(f.q) + '</summary><p>' + e(f.a) + '</p></details>').join('') + '</div></div></section>';
const faqLd = (l) => ({ '@type': 'FAQPage', mainEntity: (l || []).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
function contactBlock(C, full) {
  const { S } = C, wa = String(S('WhatsApp')).replace(/\D/g, ''), ph = S('Phone'), addr = S('Address');
  return '<section class="sec ' + (full ? '' : 'alt') + '" id="contact"><div class="wrap split"><div><span class="pill">📞 Talk to us</span><h2>Let\'s build something for you</h2><p class="lead">Tell us what you need — we reply within a few hours on working days.</p><div class="clist">' +
    (ph ? '<a href="tel:' + e(String(ph).replace(/\s/g, '')) + '">📞 <span>' + e(ph) + '</span></a>' : '') + (wa ? '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">💬 <span>WhatsApp us</span></a>' : '') + (S('Email') ? '<a href="mailto:' + e(S('Email')) + '">✉️ <span>' + e(S('Email')) + '</span></a>' : '') + (addr ? '<span>📍 <span>' + e(addr) + '</span></span>' : '') + '</div>' +
    (full && addr ? '<iframe class="map" loading="lazy" src="https://www.google.com/maps?q=' + encodeURIComponent(addr) + '&output=embed" title="Map"></iframe>' : '') + '</div>' +
    '<form class="form card" onsubmit="return st.post(this,\'contact\')"><div class="row2"><label>Your name *<input name="name" required></label><label>Mobile *<input name="mobile" inputmode="numeric" maxlength="10" required></label></div><label>Email<input name="email" type="email"></label>' +
    '<label>I am interested in<select name="subject"><option>School Management System</option><option>Business website</option><option>E-commerce store</option><option>Android app</option><option>Custom software</option><option>Franchise / partnership</option><option>Other</option></select></label><label>Message<textarea name="message" rows="4"></textarea></label>' +
    '<input name="website" class="hp" tabindex="-1" autocomplete="off"><button class="btn lg wide">Send message</button><div class="msg"></div></form></div></section>';
}
function svgDash() {
  return '<svg viewBox="0 0 520 360" role="img" aria-label="School dashboard illustration" class="svgd"><defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>' +
    '<rect x="10" y="10" width="500" height="340" rx="22" fill="#fff" stroke="#e2e8f0"/><rect x="10" y="10" width="110" height="340" rx="22" fill="#0b1024"/><rect x="28" y="40" width="74" height="10" rx="5" fill="#334155"/><rect x="28" y="70" width="74" height="22" rx="8" fill="url(#g1)"/><rect x="28" y="104" width="64" height="8" rx="4" fill="#334155"/><rect x="28" y="124" width="70" height="8" rx="4" fill="#334155"/><rect x="28" y="144" width="56" height="8" rx="4" fill="#334155"/>' +
    '<rect x="140" y="34" width="110" height="64" rx="14" fill="#eef2ff"/><text x="156" y="60" font-size="12" fill="#64748b" font-family="sans-serif">Today\'s fee</text><text x="156" y="84" font-size="20" font-weight="800" fill="#4f46e5" font-family="sans-serif">₹18,500</text>' +
    '<rect x="262" y="34" width="110" height="64" rx="14" fill="#ecfdf5"/><text x="278" y="60" font-size="12" fill="#64748b" font-family="sans-serif">Attendance</text><text x="278" y="84" font-size="20" font-weight="800" fill="#16a34a" font-family="sans-serif">96%</text>' +
    '<rect x="384" y="34" width="110" height="64" rx="14" fill="#fff7ed"/><text x="400" y="60" font-size="12" fill="#64748b" font-family="sans-serif">Dues</text><text x="400" y="84" font-size="20" font-weight="800" fill="#ea580c" font-family="sans-serif">−32%</text>' +
    '<rect x="140" y="116" width="232" height="210" rx="14" fill="#f8fafc"/><g fill="url(#g1)"><rect x="160" y="250" width="22" height="56" rx="6"/><rect x="194" y="226" width="22" height="80" rx="6"/><rect x="228" y="210" width="22" height="96" rx="6"/><rect x="262" y="190" width="22" height="116" rx="6"/><rect x="296" y="168" width="22" height="138" rx="6"/><rect x="330" y="146" width="22" height="160" rx="6"/></g>' +
    '<rect x="384" y="116" width="110" height="210" rx="14" fill="#f8fafc"/><circle cx="410" cy="148" r="12" fill="#c7d2fe"/><rect x="428" y="142" width="54" height="8" rx="4" fill="#cbd5e1"/><circle cx="410" cy="186" r="12" fill="#bbf7d0"/><rect x="428" y="180" width="48" height="8" rx="4" fill="#cbd5e1"/><circle cx="410" cy="224" r="12" fill="#fde68a"/><rect x="428" y="218" width="52" height="8" rx="4" fill="#cbd5e1"/><circle cx="410" cy="262" r="12" fill="#fecaca"/><rect x="428" y="256" width="40" height="8" rx="4" fill="#cbd5e1"/></svg>';
}
const catCount = (d, c) => (d.portfolio || []).filter((p) => p.cat === c.id && !p.demo).length;
const catCards = (C) => '<div class="cats">' + (C.d.categories || []).map((c) => { const n = catCount(C.d, c); return '<a class="cat" href="' + e(C.U('work/' + c.slug + '/')) + '"><span class="ic">' + e(c.icon || '✨') + '</span><b>' + e(c.name) + '</b><p>' + e(c.desc) + '</p><span class="more">' + (n ? n + ' delivered · ' : '') + 'View →</span></a>'; }).join('') + '</div>';

/* ================= pages ================= */
function home(C) {
  const { d, S, U, co } = C;
  const statP = S('StatProjects') || (Math.max(1, (d.portfolio || []).filter((p) => !p.demo).length) + '+');
  const recent = (d.portfolio || []).filter((p) => !p.demo && p.link).slice(0, 6), cn = {}; (d.categories || []).forEach((c) => { cn[c.id] = c.name; });
  const body =
    '<section class="hero"><div class="wrap hero-g"><div><span class="pill">✨ ' + e(S('Tagline')) + '</span><h1>' + e(S('HeroTitle', 'Digital tools that save your time & money')) + '</h1><p class="lead">' + e(S('HeroSub')) + '</p>' +
    '<div class="cta"><a class="btn lg" href="' + e(U('services/')) + '">See packages & prices →</a><a class="btn ghost lg" href="' + e(U('work/')) + '">Explore our work</a></div>' +
    '<div class="trust-mini">' + (S('Udyam') ? '<span>🏅 MSME / Udyam registered</span>' : '') + '<span>🛡️ ' + e(S('CashbackDays', '7')) + '-day start-or-refund guarantee</span><span>🇮🇳 Local support in Hindi & English</span></div></div>' +
    '<div class="hero-card"><div class="hc-top"><b>🏫 School Management System</b><span class="chip g">Live demo</span></div>' + ticks(['Fees, receipts & dues in one click', 'Attendance with WhatsApp alerts', 'Exams, admit cards & report cards', 'Salary, transport, timetable', 'Parent / student / teacher app', 'School website included']) +
    '<a class="btn wide" href="' + e(U('why-school-software/')) + '">Why every school needs this →</a></div></div>' +
    '<div class="wrap stats"><div><b>' + e(statP) + '</b><span>Projects delivered</span></div>' + (S('StatClients') ? '<div><b>' + e(S('StatClients')) + '</b><span>Happy clients</span></div>' : '') + '<div><b>' + (d.services || []).length + '+</b><span>Ready packages</span></div>' + (S('StatYears') ? '<div><b>' + e(S('StatYears')) + '</b><span>Years of experience</span></div>' : '') + '<div><b>' + e(S('StatSupport', '24×7')) + '</b><span>Support</span></div></div></section>' +
    '<section class="sec"><div class="wrap"><div class="sh"><h2>What we build</h2><p>Choose a category to see the websites and apps we have delivered — open any of them live.</p></div>' + catCards(C) + '</div></section>' +
    '<section class="sec alt"><div class="wrap split"><div><span class="pill">For schools</span><h2>Your school, fully digital — less paper, less work, faster fees</h2><p class="lead">One system for the office, accountant, teachers and parents. No registers, no manual result sheets, no receipt books — and a beautiful school website for admissions.</p>' +
    '<div class="mini-g"><div><b>⏱️ 15+ hrs</b><span>office work saved every week*</span></div><div><b>📄 1000s</b><span>sheets of paper saved a year*</span></div><div><b>💸 Faster</b><span>fee collection with UPI & reminders</span></div><div><b>📱 1 app</b><span>for parents, students & staff</span></div></div>' +
    '<div class="cta"><a class="btn" href="' + e(U('why-school-software/')) + '">Why your school needs it →</a><a class="btn ghost" href="' + e(U('work/schools/')) + '">Try the demo school</a></div><p class="note">*Approximate — depends on school size. See the calculator.</p></div><div class="shot">' + svgDash() + '</div></div></section>' +
    '<section class="sec"><div class="wrap"><div class="sh"><h2>Packages & pricing</h2><p>Transparent prices. Pay a small advance by UPI and we start — or just send an enquiry.</p></div>' + pricing(d.services || [], 3) + '<div class="center"><a class="btn ghost" href="' + e(U('services/')) + '">See all packages →</a></div></div></section>' +
    (recent.length ? '<section class="sec"><div class="wrap"><div class="sh"><h2>Recently delivered</h2><p>Real projects, live right now — open them here.</p></div><div class="plist">' + recent.map((p) => pitem(p, [cn[p.cat], p.place].filter(Boolean).join(' · '))).join('') + '</div><div class="center"><a class="btn ghost" href="' + e(U('work/')) + '">See all our work →</a></div></div></section>' : '') +
    '<section class="sec alt"><div class="wrap"><div class="sh"><h2>Why choose ' + e(co) + '</h2></div>' + featGrid([['⚡', 'Fast delivery', 'Most websites in 3–10 days and the school system in about a week.'], ['💰', 'Affordable & clear', 'Fixed package prices, small advance, installments for bigger projects.'], ['☁️', 'No server cost', 'Runs on secure Google cloud — no hosting bills for schools.'], ['🛡️', 'Start-or-refund', S('CashbackText')], ['🤝', 'Local support', 'Real people in Bihar who answer calls and WhatsApp, in Hindi & English.'], ['🔄', 'Free updates', 'Our software keeps getting new features — delivered to you automatically.']]) + '</div></section>' +
    '<section class="sec"><div class="wrap"><div class="sh"><h2>How it works</h2></div><div class="steps4"><div><i>1</i><b>Choose a package</b><p>Pick a service or tell us your need.</p></div><div><i>2</i><b>Pay advance / enquire</b><p>UPI advance with UTR, or send an enquiry.</p></div><div><i>3</i><b>See the demo</b><p>We build it and show you a live demo.</p></div><div><i>4</i><b>Go live</b><p>Final link, admin login, training & certificate.</p></div></div></div></section>' +
    trust(C) + testimonials(d) + faq(d.faqs) +
    '<section class="sec cta-band"><div class="wrap cta-in"><div><h2>Earn with ' + e(co) + '</h2><p>Become a franchise partner — get your ID card, certificate and commission on every project.</p></div><a class="btn lg light" href="' + e(U('franchise/')) + '">Become a partner →</a></div></section>' + contactBlock(C);
  return layout(C, co + ' — ' + S('Tagline'), S('HeroSub'), '', body, [faqLd(d.faqs)], '');
}
function work(C, slug) {
  const { d, U, co } = C;
  if (!slug) return layout(C, 'Our work — ' + co, 'Websites, apps and school management systems delivered by ' + co + '.', 'work/', '<section class="pghd"><div class="wrap"><h1>Our work</h1><p>Websites, apps and school systems we have delivered. Open any of them live.</p></div></section><section class="sec"><div class="wrap">' + catCards(C) + '</div></section>' + contactBlock(C), [], 'work/');
  const cat = (d.categories || []).find((c) => c.slug === slug);
  if (!cat) return null;
  const items = (d.portfolio || []).filter((p) => p.cat === cat.id), demo = items.filter((p) => p.demo), list = items.filter((p) => !p.demo), school = /school/i.test(cat.name);
  const body = '<section class="pghd"><div class="wrap"><nav class="crumb"><a href="' + e(U()) + '">Home</a> › <a href="' + e(U('work/')) + '">Our work</a> › ' + e(cat.name) + '</nav><h1>' + e((cat.icon ? cat.icon + ' ' : '') + cat.name) + '</h1><p>' + e(cat.desc) + '</p>' +
    (cat.promo ? '<a class="btn lg glow" href="' + e(U(cat.promo + '/')) + '">💡 ' + e(cat.promoLabel || 'Why you need this') + ' →</a>' : '') + '</div></section><section class="sec"><div class="wrap">' +
    demo.map((p) => '<div class="demo"><div class="demo-l"><span class="pill">🎯 Try it yourself — live demo</span><h2>' + e(p.name) + '</h2><p>' + e(p.desc) + '</p>' + credBox(p) + '<div class="cta">' + openBtns(p, true) + '</div></div><div class="demo-r">' + (p.image ? '<img src="' + e(p.image) + '" alt="' + e(p.name) + '" loading="lazy">' : svgDash()) + '</div></div>').join('') +
    '<div class="sh left"><h2>' + (list.length ? list.length + ' delivered ' + (school ? 'schools' : 'projects') : 'Delivered projects') + '</h2><p>Tap “Open” to see it live right here.</p></div>' +
    (list.length ? '<div class="plist">' + list.map((p) => pitem(p, [p.place, p.added ? 'since ' + new Date(p.added).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''].filter(Boolean).join(' · '))).join('') + '</div>' : '<div class="empty">New projects are being added. Contact us for references.</div>') + '</div></section>' +
    '<section class="sec alt"><div class="wrap"><div class="sh"><h2>Get yours</h2></div>' + pricing((d.services || []).filter((s) => !school || /school/i.test(s.name)), 3) + '</div></section>' + contactBlock(C);
  const ld = [{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: U() }, { '@type': 'ListItem', position: 2, name: 'Our work', item: U('work/') }, { '@type': 'ListItem', position: 3, name: cat.name, item: U('work/' + cat.slug + '/') }] },
    { '@type': 'ItemList', name: cat.name + ' delivered by ' + co, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: p.link })) }];
  return layout(C, cat.name + ' — delivered by ' + co, cat.desc + ' ' + list.length + ' projects delivered. Try the live demo.', 'work/' + cat.slug + '/', body, ld, 'work/');
}
function services(C) {
  const { d, S, U, co } = C;
  const body = '<section class="pghd"><div class="wrap"><h1>Services & pricing</h1><p>Pick a package. Pay the advance by UPI to start immediately, or send an enquiry and we will call you.</p></div></section><section class="sec"><div class="wrap">' + pricing(d.services || [], 0, C) +
    '<div class="guar"><b>🛡️ Start-or-refund guarantee</b><p>' + e(S('CashbackText')) + ' <a href="' + e(U('refund-policy/')) + '">Read policy</a></p></div></div></section>' + faq(d.faqs) + contactBlock(C);
  const ld = [{ '@type': 'OfferCatalog', name: 'Packages by ' + co, itemListElement: (d.services || []).map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, description: s.desc }, price: s.price, priceCurrency: 'INR' })) }, faqLd(d.faqs)];
  return layout(C, 'Services & pricing — ' + co, 'Website, school management system, e-commerce and Android app packages with clear prices, UPI advance and installments.', 'services/', body, ld, 'services/');
}
function promo(C, path) {
  const { d, U, co } = C, pg = (d.pages || {})[path] || { title: 'Why every school needs a website & management system', body: '', meta: '' };
  const demo = (d.portfolio || []).find((p) => p.demo), svc = (d.services || []).find((s) => /school/i.test(s.name)), school = /school/.test(path);
  const buyBtn = (cls, label) => svc ? '<button class="btn ' + cls + '" onclick="st.buy(' + jattr(svc.id) + ')">' + label + '</button>' : '';
  let body = '<section class="promo-hero"><div class="wrap"><span class="pill">🏫 For school owners & principals</span><h1>' + e(pg.title) + '</h1><p class="lead">Parents now search, pay and talk online. A school that is digital looks more trusted, gets more admissions and saves lakhs of rupees and hundreds of hours every year. Here is exactly how.</p>' +
    '<div class="cta"><a class="btn lg" href="#calc">Calculate your savings ↓</a>' + buyBtn('lg light', 'Get it for ' + (svc ? money(svc.price) : '')) + '</div></div></section>' +
    (pg.body ? '<section class="sec"><div class="wrap prose">' + safeHtml(pg.body) + '</div></section>' : '');
  if (school) {
    body += '<section class="sec"><div class="wrap"><div class="sh"><h2>Before vs after</h2><p>The same daily work — done in a fraction of the time.</p></div><div class="tbl-wrap"><table class="ba"><thead><tr><th>Work</th><th>😩 Without software</th><th>😊 With ' + e(co) + '</th></tr></thead><tbody>' +
      [['Fee collection', 'Receipt books, hand calculations, long queues', 'One-click receipts, dues auto-calculated, UPI payment from parent app'], ['Fee reminders', 'Calling each parent, many missed', 'Month-wise WhatsApp reminder to every defaulter in minutes'], ['Attendance', 'Registers, totals at month end', 'Tap P / A / L / Late — monthly report and parent alerts instantly'],
        ['Exams', 'Hand-written admit cards, date sheets, mark registers', 'Admit cards with QR, date sheets and marks entry by teachers online'], ['Results & report cards', 'Days of tabulation, printed report cards every term', 'Results & report cards generated automatically, parents see them online'], ['Salary', 'Manual leave counting and salary calculation', 'Salary from attendance & holidays, partial payments, slips'],
        ['Notices & homework', 'Diary notes and notice board only', 'Instant notice and homework in the parent app'], ['Admissions', 'Only walk-in enquiries', 'School website with online admission form — enquiries 24×7']].map((r) => '<tr><td><b>' + e(r[0]) + '</b></td><td class="bad">' + e(r[1]) + '</td><td class="good">' + e(r[2]) + '</td></tr>').join('') + '</tbody></table></div></div></section>' +
      '<section class="sec alt" id="calc"><div class="wrap split"><div><span class="pill">🧮 Savings calculator</span><h2>How much will your school save?</h2><p>Enter your school size. We estimate paper, printing and staff time saved in a year.</p>' +
      '<div class="calc"><label>Number of students<input type="number" id="c_st" value="400" min="20" oninput="st.calc()"></label><label>Exams in a year<input type="number" id="c_ex" value="3" min="1" oninput="st.calc()"></label><label>Teaching staff<input type="number" id="c_tc" value="15" min="1" oninput="st.calc()"></label><label>Office staff salary per month (₹)<input type="number" id="c_sal" value="12000" min="0" oninput="st.calc()"></label></div>' +
      '<p class="note">Estimate only: report card & admit card printing ₹8 / student / exam, receipts & notices ₹40 / student / year, 2 office hours saved per 100 students per week, 3 teacher hours saved per exam for results. Real savings depend on your school.</p></div>' +
      '<div class="calc-out"><div><span>📄 Paper & printing saved</span><b id="o_pp">—</b></div><div><span>⏱️ Office hours saved / year</span><b id="o_oh">—</b></div><div><span>👩‍🏫 Teacher hours saved on results</span><b id="o_th">—</b></div><div><span>💼 Value of office time saved</span><b id="o_ov">—</b></div><div class="tot"><span>Estimated total value / year</span><b id="o_tot">—</b></div>' +
      (svc ? '<p class="roi" id="o_roi"></p>' + buyBtn('wide lg', 'Start for ' + money(svc.price) + ' →') : '') + '</div></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sh"><h2>Everything a school needs — in one place</h2></div><div class="roles">' +
      [['🧑‍💼', 'Principal / Owner', ['Live dashboard: today\'s attendance, collection, dues', 'Staff present / absent & free periods', 'Birthdays, absent 3+ days, pending work', 'Full control with roles & audit log']], ['💰', 'Accountant', ['Fee collection with receipts in seconds', 'Month-wise dues & defaulter list', 'UPI online payments verified', 'Salary with partial payments, expenses, P&L']],
        ['👩‍🏫', 'Teachers', ['Mark attendance in one tap', 'Enter marks online, results auto', 'Homework & timetable on phone', 'Own salary slips & leave']], ['👨‍👩‍👧', 'Parents & students', ['Fees, receipts & online payment', 'Attendance, homework, notices', 'Admit card, results & report card', 'Transport route, stop & driver']]]
        .map((r) => '<div class="role"><span class="ic">' + r[0] + '</span><h3>' + e(r[1]) + '</h3>' + ticks(r[2]) + '</div>').join('') + '</div></div></section>' +
      '<section class="sec alt"><div class="wrap"><div class="sh"><h2>Where exactly your money is saved</h2></div>' + featGrid([['📄', 'Paper & printing', 'No receipt books, admit cards, result registers or printed report cards every term — everything is online and printable only when needed.'], ['🧾', 'Accountant\'s time', 'Dues, receipts, reports and reminders are automatic. One person can handle what used to take two.'], ['📝', 'Exam & result work', 'Teachers enter marks once — totals, grades, ranks and report cards are generated in seconds.'],
        ['💸', 'Faster fee collection', 'Parents get month-wise reminders and pay by UPI from the app — less outstanding, better cash flow.'], ['🚌', 'Transport & salary', 'Stop-wise transport fee, driver changes, salary from attendance — no calculation mistakes.'], ['🌐', 'More admissions', 'A professional website with online admission form brings enquiries even at night and on holidays.']]) + '</div></section>' +
      '<section class="sec"><div class="wrap split"><div><span class="pill">🌐 The digital era</span><h2>Why a school website is no longer optional</h2>' + ticks(['Parents search on Google before choosing a school — your website is your first impression.', 'Notices, results and fee details online mean fewer calls and visits to the office.', 'Photos, achievements and facilities build trust and justify your fees.', 'Online admission enquiries work 24×7, even when the office is closed.', 'A modern, digital school attracts better teachers and more students.'], 'big') + '</div><div class="shot">' + svgDash() + '</div></div></section>';
  }
  if (demo) body += '<section class="sec alt"><div class="wrap"><div class="demo"><div class="demo-l"><span class="pill">🎯 See it yourself</span><h2>Open the demo school</h2>' + credBox(demo) + '<div class="cta">' + (demo.link && demo.pageSlug ? '<a class="btn lg" href="' + e(pageHref(demo)) + '">▶ Open demo</a>' : '') + '<a class="btn ghost lg" href="' + e(U('work/schools/')) + '">See schools using it</a></div></div><div class="demo-r">' + svgDash() + '</div></div></div></section>';
  if (svc) body += '<section class="sec"><div class="wrap"><div class="sh"><h2>Get started today</h2></div>' + pricing([svc], 0) + '</div></section>';
  body += faq(d.faqs) + contactBlock(C);
  return layout(C, pg.title + ' — ' + co, pg.meta || 'How a school website and management system saves time, paper and money.', path + '/', body, [faqLd(d.faqs)], 'why-school-software/');
}
function franchise(C) {
  const { d, S, U, co } = C, pg = (d.pages || {}).franchise || { title: 'Become a franchise partner', body: '', meta: '' };
  const open = S('FranchiseOn', 'Yes') !== 'No', fee = +S('FranchiseFee', '0') || 0;
  const ex = (d.services || []).filter((s) => /school/i.test(s.name)).pop() || (d.services || [])[0];
  let exHtml = '';
  if (ex) { const c = Math.round(ex.price * ex.commission / 100), sell = ex.price + Math.round(ex.price * 0.2); exHtml = '<div class="guar" style="margin-top:22px"><b>💡 Example</b><p>You sell <b>' + e(ex.name) + '</b> (agency price ' + money(ex.price) + ') to a client for ' + money(sell) + '. You earn ' + (ex.commission | 0) + '% commission (' + money(c) + ') + the extra ' + money(sell - ex.price) + ' = <b>' + money(c + sell - ex.price) + '</b>.</p></div>'; }
  const body = '<section class="pghd"><div class="wrap"><span class="pill">🤝 Partner program</span><h1>' + e(pg.title) + '</h1><div class="prose" style="color:inherit">' + safeHtml(pg.body) + '</div><div class="cta"><a class="btn lg" href="#apply">Apply now</a><a class="btn ghost lg" href="' + e(U('portal/')) + '">Partner login</a></div></div></section>' +
    '<section class="sec"><div class="wrap">' + featGrid([['💵', 'Earn on every project', 'Commission on the agency price plus everything you charge above it — credited to your wallet on delivery.'], ['🪪', 'ID card & certificate', 'Official partner ID card and authorization certificate with QR verification.'], ['📊', 'Online dashboard', 'Book projects, track status, see demos, pay installments and withdraw to UPI.'], ['🛠️', 'We do the work', 'Design, development, delivery and support are done by SidTech.'], ['🎯', 'Ready products', 'School system, websites, e-commerce, apps and software — with live demos to show.'], ['🔐', 'Safe payouts', 'Wallet withdrawals protected with your T-PIN.']]) + exHtml + '</div></section>' +
    '<section class="sec alt" id="apply"><div class="wrap narrow"><div class="sh"><h2>Apply to become a partner</h2><p>' + (fee > 0 ? 'Joining fee: ' + money(fee) + ' (after approval).' : 'Free to join. Approval usually within 2 working days.') + '</p></div>' +
    (open ? '<form class="form" onsubmit="return st.post(this,\'franchise_apply\')"><div class="row2"><label>Full name *<input name="name" required></label><label>Mobile *<input name="mobile" inputmode="numeric" maxlength="10" required></label></div><div class="row2"><label>Email *<input name="email" type="email" required></label><label>Branch / business name *<input name="branch" required></label></div>' +
      '<label>Address (city, district)<input name="address"></label><label>Create a password *<input name="password" type="password" minlength="6" required></label><input name="website" class="hp" tabindex="-1" autocomplete="off"><button class="btn lg wide">Submit application</button><div class="msg"></div><p class="note">After approval, log in at <a href="' + e(U('portal/')) + '">Partner login</a> and add your photo for the ID card.</p></form>'
      : '<div class="empty">Applications are closed right now. Please contact us.</div>') + '</div></section>';
  return layout(C, pg.title + ' — ' + co, pg.meta || 'Join the ' + co + ' franchise network.', 'franchise/', body, [], 'franchise/');
}
function verify(C, id) {
  const body = '<section class="pghd"><div class="wrap narrow"><h1>Verify a partner or certificate</h1><p>Enter the Partner ID (e.g. ST366-0001) or the certificate number printed on the card / certificate.</p></div></section>' +
    '<section class="sec"><div class="wrap narrow"><form class="form" id="vform" onsubmit="return st.verify(this)"><label>Partner ID / Certificate No<input name="id" value="' + e(id) + '" required placeholder="ST366-0001 or ST-CERT-…"></label><button class="btn lg wide">🔍 Verify</button><div class="msg" id="vout"></div></form></div></section>' +
    (id ? '<script>document.addEventListener("DOMContentLoaded",function(){st.verify(document.getElementById("vform"))})</script>' : '');
  return layout(C, 'Verify ID / certificate — ' + C.co, 'Check if a ' + C.co + ' partner ID card or certificate is genuine.', 'verify/', body, [], 'verify/');
}
function contact(C) {
  const pg = (C.d.pages || {}).contact || { body: '' };
  return layout(C, 'Contact — ' + C.co, 'Call, WhatsApp or message ' + C.co + ' for school software, websites and apps.', 'contact/', '<section class="pghd"><div class="wrap"><h1>Contact us</h1><div class="prose" style="color:inherit">' + safeHtml(pg.body) + '</div></div></section>' + contactBlock(C, true), [], 'contact/');
}
function page(C, path) {
  const map = { 'about-us': 'about', 'terms-and-conditions': 'terms', privacy: 'privacy-policy', 'cashback-guarantee': 'refund-policy' }, slug = map[path] || path, { S } = C;
  const pg = (C.d.pages || {})[slug] || { title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), body: '<p>Coming soon.</p>', meta: '', updated: '' };
  let extra = '';
  if (slug === 'about') extra = '<ul class="kv">' + [['CompanyName', 'Company'], ['OwnerName', 'Founder'], ['Founded', 'Founded'], ['Address', 'Address'], ['Udyam', 'Udyam (MSME)'], ['GSTIN', 'GSTIN'], ['RegNo', 'Registration'], ['Phone', 'Phone'], ['Email', 'Email']]
    .filter((k) => S(k[0])).map((k) => '<li><span>' + k[1] + '</span><b>' + e(S(k[0]) + (k[0] === 'OwnerName' && S('OwnerDesignation') ? ' — ' + S('OwnerDesignation') : '')) + '</b></li>').join('') + '</ul>';
  const body = '<section class="pghd"><div class="wrap narrow"><h1>' + e(pg.title) + '</h1></div></section><section class="sec"><div class="wrap narrow"><article class="prose card">' + safeHtml(pg.body) + extra +
    (pg.updated ? '<p class="note">Last updated: ' + e(new Date(pg.updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) + '</p>' : '') + '</article></div></section>' + (slug === 'about' ? trust(C) : '');
  return layout(C, pg.title + ' — ' + C.co, pg.meta || pg.title, slug + '/', body, [], '');
}
function notFound(C) {
  return layout(C, 'Page not found — ' + C.co, 'Page not found', '', '<section class="pghd"><div class="wrap"><h1>Page not found</h1><p>The page you are looking for does not exist.</p><div class="cta"><a class="btn" href="' + e(C.U()) + '">Go to home</a><a class="btn ghost" href="' + e(C.U('work/')) + '">See our work</a></div></div></section>', [], '');
}
function sitemap(C) {
  const u = ['', 'work/', 'services/', 'why-school-software/', 'franchise/', 'verify/', 'contact/', 'about/', 'terms/', 'privacy-policy/', 'refund-policy/', 'delivery-policy/', 'disclaimer/'];
  (C.d.categories || []).forEach((c) => { u.push('work/' + c.slug + '/'); if (c.promo) u.push(c.promo + '/'); });
  return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + [...new Set(u)].map((x) => '<url><loc>' + e(C.U(x)) + '</loc><changefreq>weekly</changefreq><priority>' + (x === '' ? '1.0' : '0.7') + '</priority></url>').join('') + '</urlset>';
}

/* ================= router ================= */
const PAGE_SLUGS = ['about', 'about-us', 'terms', 'terms-and-conditions', 'privacy-policy', 'privacy', 'refund-policy', 'cashback-guarantee', 'disclaimer', 'delivery-policy'];
function route(d, origin, rawPath, query) {
  const C = ctx(d, origin), api = process.env.ST366_API || ''; assignSlugs(d);
  const path = String(rawPath || '').replace(/^\/+|\/+$/g, '').toLowerCase().replace(/\.html?$/, ''), seg = path.split('/');
  const html = (body, status = 200) => ({ status, type: 'text/html; charset=utf-8', body });
  if (path === 'robots.txt') return { status: 200, type: 'text/plain; charset=utf-8', body: 'User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /admin-panel\nSitemap: ' + C.U('sitemap.xml') + '\n' };
  if (path === 'sitemap.xml' || path === 'st366-sitemap.xml') return { status: 200, type: 'application/xml; charset=utf-8', body: sitemap(C) };
  if (['portal', 'partner-login', 'login'].includes(path)) return html(fullframe(C, api, 'Partner Portal'));
  if (['admin-panel', 'st-admin'].includes(path)) return html(fullframe(C, api + (api.includes('?') ? '&' : '?') + 'admin=1', 'Admin'));
  if (path === '' || path === 'home') return html(home(C));
  if (seg[0] === 'work') { const r = work(C, seg[1] || ''); return r ? html(r) : html(notFound(C), 404); }
  if (['services', 'pricing', 'packages'].includes(path)) return html(services(C));
  if (path === 'franchise') return html(franchise(C));
  if (path === 'verify') return html(verify(C, String(query.id || '').slice(0, 60)));
  if (path === 'contact' || path === 'contact-us') return html(contact(C));
  if (path.startsWith('why-')) return html(promo(C, path));
  if (PAGE_SLUGS.includes(path)) return html(page(C, path));
  if (seg.length === 2) { const hit = (d.portfolio || []).find((x) => x.link && x.pageSlug === compact(seg[0])), f = hit && pwa.file(hit, seg[1]); if (f) return f; }
  if (seg.length === 1) { const key = compact(path), hit = (d.portfolio || []).find((x) => x.link && x.pageSlug === key); if (hit) return html(siteFrame(C, hit, !hit.demo && !('v' in query))); }
  return html(notFound(C), 404);
}
module.exports = { route, safeHtml };
