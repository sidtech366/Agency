/* SidTech 366 — site-wide polish: preloader, page-transition bar, popup effects (login / logout / errors),
   tighter spacing, scroll reveal, header shadow. Loaded by layout() on every page. */

const HEAD = '<script>document.documentElement.classList.add("js");try{if(sessionStorage.getItem("st_seen"))document.documentElement.classList.add("seen")}catch(e){}</script>';

const CSS = `
/* ---------- spacing: kam gap, saaf rhythm ---------- */
.sec{padding:48px 0}.sh{margin:0 auto 22px}.sh h2{margin:0 0 6px;letter-spacing:-.02em}.sh p{font-size:15.5px}
.center{margin-top:18px}.pghd{padding:34px 0 22px}.cta-band{padding:34px 0}.ft{padding-top:40px}.stats{margin-top:22px}
.cats{gap:14px}.price-g{gap:16px}.feat{gap:14px}.steps4{gap:12px}.plist{gap:12px}
.feat>div,.role,.steps4 div{padding:18px}.price{padding:20px}.cat{padding:18px}
h1,h2,h3{letter-spacing:-.015em}
@media(max-width:860px){.sec{padding:34px 0}.sh{margin-bottom:16px}.pghd{padding:26px 0 16px}.cta-band{padding:28px 0}}

/* ---------- professional details ---------- */
::selection{background:#c7d2fe;color:#1e1b4b}
.hd{transition:box-shadow .25s,background .25s}.hd.sc{box-shadow:0 8px 28px rgba(15,23,42,.08);background:rgba(255,255,255,.95)}
.nav a{position:relative}.nav a:after{content:"";position:absolute;left:12px;right:12px;bottom:4px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--p),var(--p2));transform:scaleX(0);transition:transform .25s}
.nav a:hover:after,.nav a.on:after{transform:scaleX(1)}
.btn{transition:transform .15s,box-shadow .2s,filter .2s}.btn:hover{transform:translateY(-1px);filter:brightness(1.05)}.btn:active{transform:translateY(1px)}
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #a5b4fc;outline-offset:2px}
.price,.cat,.feat>div,.steps4 div,.pitem,.faq details{box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 22px rgba(15,23,42,.06)}
html.js .rv{opacity:0;transform:translateY(18px)}html.js .rv.in{opacity:1;transform:none;transition:opacity .55s ease,transform .55s cubic-bezier(.2,.8,.2,1)}
@media(prefers-reduced-motion:reduce){html.js .rv{opacity:1;transform:none}}

/* ---------- preloader (pehli baar) ---------- */
#stpl{display:none}
html.js #stpl{display:grid;position:fixed;inset:0;z-index:9999;place-items:center;background:radial-gradient(600px 400px at 30% 20%,rgba(79,70,229,.45),transparent 60%),radial-gradient(600px 400px at 80% 90%,rgba(6,182,212,.35),transparent 60%),#0b1024;transition:opacity .45s ease,visibility .45s}
html.js.seen #stpl,#stpl.out{opacity:0;visibility:hidden;pointer-events:none}
.pl-in{display:flex;flex-direction:column;align-items:center;gap:22px;color:#fff;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
.pl-cube{width:64px;height:64px;position:relative;transform-style:preserve-3d;animation:plspin 2.4s cubic-bezier(.6,.1,.3,1) infinite}
.pl-cube i{position:absolute;inset:0;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#06b6d4);border:1px solid rgba(255,255,255,.35);display:grid;place-items:center;font:800 26px/1 inherit;font-style:normal;color:#fff;box-shadow:inset 0 0 20px rgba(255,255,255,.2)}
.pl-cube i:nth-child(1){transform:translateZ(32px)}.pl-cube i:nth-child(2){transform:rotateY(180deg) translateZ(32px)}.pl-cube i:nth-child(3){transform:rotateY(90deg) translateZ(32px)}
.pl-cube i:nth-child(4){transform:rotateY(-90deg) translateZ(32px)}.pl-cube i:nth-child(5){transform:rotateX(90deg) translateZ(32px)}.pl-cube i:nth-child(6){transform:rotateX(-90deg) translateZ(32px)}
.pl-sc{perspective:600px;filter:drop-shadow(0 20px 30px rgba(79,70,229,.55))}
.pl-nm{font-weight:800;font-size:18px;letter-spacing:.02em}.pl-nm small{display:block;text-align:center;font-weight:500;font-size:12px;color:#a5b4fc;letter-spacing:.2em;text-transform:uppercase;margin-top:4px}
.pl-bar{width:180px;height:4px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}.pl-bar b{display:block;height:100%;width:40%;border-radius:4px;background:linear-gradient(90deg,#818cf8,#22d3ee);animation:plbar 1.1s ease-in-out infinite}
@keyframes plspin{0%{transform:rotateX(-20deg) rotateY(0)}50%{transform:rotateX(-20deg) rotateY(180deg)}100%{transform:rotateX(-20deg) rotateY(360deg)}}
@keyframes plbar{0%{transform:translateX(-110%)}100%{transform:translateX(280%)}}

/* ---------- page change bar ---------- */
#stnb{position:fixed;left:0;top:0;height:3px;width:0;z-index:9998;background:linear-gradient(90deg,#4f46e5,#06b6d4);box-shadow:0 0 12px rgba(79,70,229,.7);transition:width .4s ease,opacity .3s}
#stnb.go{width:75%;transition:width 2.5s cubic-bezier(.1,.8,.2,1)}

/* ---------- popup effects ---------- */
#stfx{position:fixed;inset:0;z-index:9997;display:grid;place-items:center;background:rgba(11,16,36,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;padding:16px}
#stfx.on{opacity:1;visibility:visible}
.fx-c{width:100%;max-width:340px;background:#fff;border-radius:24px;padding:28px 24px 22px;text-align:center;box-shadow:0 40px 80px rgba(2,6,23,.45);transform:translateY(16px) scale(.92);transition:transform .35s cubic-bezier(.2,1.3,.4,1)}
#stfx.on .fx-c{transform:none}.fx-c h4{margin:14px 0 4px;font-size:20px;color:#0f172a}.fx-c p{margin:0;color:#5b6478;font-size:14.5px}
.fx-c .btn{margin-top:16px;width:100%}
.fx-i{width:76px;height:76px;margin:0 auto;border-radius:50%;display:grid;place-items:center;position:relative}
.fx-i.ld{background:conic-gradient(from 0deg,#4f46e5,#06b6d4,#a855f7,#4f46e5);animation:fxr 1s linear infinite}.fx-i.ld:after{content:"";position:absolute;inset:7px;border-radius:50%;background:#fff}
.fx-i.ok{background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 12px 30px rgba(34,197,94,.45);animation:fxpop .45s cubic-bezier(.2,1.6,.4,1)}
.fx-i.er{background:linear-gradient(135deg,#f43f5e,#dc2626);box-shadow:0 12px 30px rgba(244,63,94,.4);animation:fxshake .5s}
.fx-i.by{background:linear-gradient(135deg,#6366f1,#06b6d4);box-shadow:0 12px 30px rgba(99,102,241,.45);font-size:36px;animation:fxpop .45s cubic-bezier(.2,1.6,.4,1)}
.fx-i.by span{display:inline-block;animation:fxwave 1s ease-in-out 2;transform-origin:70% 70%}
.fx-i svg{width:40px;height:40px}.fx-i svg path{fill:none;stroke:#fff;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;stroke-dashoffset:60;animation:fxdraw .5s .15s forwards}
@keyframes fxr{to{transform:rotate(360deg)}}@keyframes fxdraw{to{stroke-dashoffset:0}}
@keyframes fxpop{0%{transform:scale(.3)}100%{transform:scale(1)}}
@keyframes fxshake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
@keyframes fxwave{0%,100%{transform:rotate(0)}25%{transform:rotate(20deg)}75%{transform:rotate(-12deg)}}
`;

function preloader(co, logo) {
  const face = logo ? '<img src="' + logo + '" alt="" style="width:70%;height:70%;object-fit:contain;border-radius:8px">' : 'S';
  return '<div id="stpl" aria-hidden="true"><div class="pl-in"><div class="pl-sc"><div class="pl-cube">' + '<i>' + face + '</i><i>S</i><i>T</i><i>3</i><i>6</i><i>6</i></div></div>' +
    '<div class="pl-nm">' + co + '<small>Loading</small></div><div class="pl-bar"><b></b></div></div></div><div id="stnb"></div>' +
    '<div id="stfx" role="dialog" aria-live="polite"><div class="fx-c" id="stfxc"></div></div>';
}

/* window.stFx.pop({type:'loading'|'ok'|'err'|'bye', title, sub, ms, btn}) — ms = auto band; btn = button text */
const JS = `(function(){
var d=document,h=d.documentElement,pl=d.getElementById('stpl'),nb=d.getElementById('stnb'),fx=d.getElementById('stfx'),fc=d.getElementById('stfxc'),t0=Date.now(),done=false;
function hidePl(){if(done||!pl)return;done=true;setTimeout(function(){pl.classList.add('out');try{sessionStorage.setItem('st_seen','1')}catch(e){}},Math.max(0,450-(Date.now()-t0)))}
if(h.classList.contains('seen'))done=true;else{window.addEventListener('load',hidePl);setTimeout(hidePl,2800);if(d.readyState==='complete')hidePl()}
/* page change bar on internal links */
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank'||a.hasAttribute('download'))return;
var u;try{u=new URL(a.href,location.href)}catch(x){return}if(u.origin!==location.origin||u.hash&&u.pathname===location.pathname)return;nb.classList.add('go')});
window.addEventListener('pageshow',function(){nb.classList.remove('go');nb.style.width=''});
/* header shadow */
var hd=d.getElementById('hd');function sc(){if(hd)hd.classList.toggle('sc',scrollY>8)}sc();addEventListener('scroll',sc,{passive:true});
/* scroll reveal */
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -40px 0px'});
[].forEach.call(d.querySelectorAll('.sh,.price,.cat,.mcard,.pitem,.feat>div,.steps4>div,.stats>div,.faq details,.split>div'),function(el,i){el.classList.add('rv');el.style.transitionDelay=(i%6)*45+'ms';io.observe(el)})}
/* popups */
var tm;var ic={loading:'<div class="fx-i ld"></div>',ok:'<div class="fx-i ok"><svg viewBox="0 0 40 40"><path d="M10 21l7 7 14-15"/></svg></div>',err:'<div class="fx-i er"><svg viewBox="0 0 40 40"><path d="M13 13l14 14M27 13L13 27"/></svg></div>',bye:'<div class="fx-i by"><span>👋</span></div>'};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
window.stFx={pop:function(o){o=o||{};clearTimeout(tm);fc.innerHTML=(ic[o.type]||ic.ok)+'<h4>'+esc(o.title||'')+'</h4>'+(o.sub?'<p>'+esc(o.sub)+'</p>':'')+(o.btn?'<button class="btn" type="button" onclick="stFx.hide()">'+esc(o.btn)+'</button>':'');fx.classList.add('on');if(o.ms)tm=setTimeout(window.stFx.hide,o.ms)},
hide:function(){clearTimeout(tm);fx.classList.remove('on')}};
fx.addEventListener('click',function(e){if(e.target===fx&&!fc.querySelector('.ld'))window.stFx.hide()});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&fx.classList.contains('on')&&!fc.querySelector('.ld'))window.stFx.hide()});
/* logout aaya ho (?bye=1) */
if(/[?&]bye=1/.test(location.search)){window.stFx.pop({type:'bye',title:'Logged out',sub:'Aap safely logout ho gaye. Phir milte hain!',ms:2200});try{history.replaceState(null,'',location.pathname)}catch(e){}}
})();`;

/* chhota loader for full-screen iframe pages (/portal, /admin-panel, /<school>) */
const FRAME_LOADER_CSS = '#l{position:fixed;inset:0;display:grid;place-items:center;background:radial-gradient(600px 400px at 30% 20%,rgba(79,70,229,.45),transparent 60%),#0b1024;color:#c7d2fe;font:600 14px system-ui,sans-serif;z-index:5;transition:opacity .4s}' +
  '#l .r{width:54px;height:54px;border-radius:50%;margin:0 auto 14px;background:conic-gradient(#4f46e5,#06b6d4,#a855f7,#4f46e5);animation:lr 1s linear infinite;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 6px),#000 0);mask:radial-gradient(farthest-side,transparent calc(100% - 6px),#000 0)}' +
  '@keyframes lr{to{transform:rotate(360deg)}}';
const frameLoader = (label) => '<div id="l"><div style="text-align:center"><div class="r"></div>' + label + '</div></div>';

module.exports = { HEAD, CSS, preloader, JS, FRAME_LOADER_CSS, frameLoader };
