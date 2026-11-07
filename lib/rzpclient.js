/* Website: "Pay online" (Razorpay checkout). Sirf tab chalta hai jab Admin panel me Razorpay ON hai aur keys saved hain (ST366.rzp).
   Order + verify dono Apps Script karta hai (secret wahi rehta hai). Browser sirf checkout kholta hai. */
module.exports = `(function(){
if(!window.st||!window.ST366||!ST366.rzp||!ST366.api)return;
var ob=st.buy,oo=st.order,ON=false,SID='',PAID=false;
var fx=function(){return window.stFx||{pop:function(o){if(o&&o.type==='err')alert(o.title+(o.sub?'\\n'+o.sub:''))},hide:function(){}}};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(n){return '\\u20b9'+Math.round(+n||0).toLocaleString('en-IN')}
function svc(id){return (ST366.services||[]).filter(function(s){return s.id===id})[0]}
function first(s){return Math.round(s.price*((s.inst&&s.inst.length)?s.inst[0].percent:s.advance)/100)}
function api(b){return fetch(ST366.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)}).then(function(r){return r.json()}).then(function(j){if(!j.ok)throw new Error(j.error||'Something went wrong');return j})}
function loadCk(){return new Promise(function(res,rej){if(window.Razorpay)return res();var s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=res;s.onerror=function(){rej(new Error('Payment page load nahi hua. Internet check karein.'))};document.head.appendChild(s)})}
st.buy=function(id,mode){
  var only=ST366.payMode==='razorpay';
  ON=mode==='Online'||(!mode&&ST366.payMode!=='manual')||(only&&mode==='UPI');SID=id;PAID=false;
  ob(id,ON?'Enquiry':mode);
  var c=document.getElementById('mdlc'),s=svc(id);if(!c||!s)return;
  var tabs=c.querySelector('.tabs');
  if(tabs){var bs=tabs.querySelectorAll('button');if(only&&bs[0])bs[0].remove();
    var b=document.createElement('button');b.type='button';b.innerHTML='\\ud83d\\udd12 Pay online';b.onclick=function(){st.buy(id,'Online')};tabs.insertBefore(b,tabs.firstChild);
    if(ON){[].forEach.call(tabs.querySelectorAll('button'),function(x){x.classList.remove('on')});b.classList.add('on')}}
  if(ON){var f=c.querySelector('form'),btn=f&&f.querySelector('button.btn');
    if(btn){btn.innerHTML='\\ud83d\\udd12 Pay '+money(first(s))+' securely';
      var n=document.createElement('div');n.className='rzp-n';n.innerHTML='<b>UPI \\u00b7 Card \\u00b7 Netbanking \\u00b7 Wallet</b><span>Razorpay secure checkout \\u2014 payment turant confirm, receipt aapke number par</span>';btn.parentNode.insertBefore(n,btn)}}
};
st.enquire=function(id){st.buy(id,'Enquiry')};
st.order=function(f){
  if(!ON)return oo(f);
  var d=Object.fromEntries(new FormData(f)),btn=f.querySelector('button.btn'),m=f.querySelector('.msg'),s=svc(SID);
  d.action='rzp_order';d.serviceId=SID;if(m){m.className='msg';m.textContent=''}
  if(!/^\\d{10}$/.test(String(d.mobile||'').replace(/\\D/g,'').slice(-10))){if(m){m.className='msg er';m.textContent='10-digit mobile number daalein'}return false}
  btn.disabled=true;fx().pop({type:'loading',title:'Secure payment khul raha hai\\u2026',sub:'Razorpay se connect ho raha hai'});
  api(d).then(function(j){return loadCk().then(function(){return j})}).then(function(j){
    fx().hide();
    var rz=new Razorpay({key:j.keyId,amount:j.amount,currency:j.currency,order_id:j.orderId,name:j.name,description:j.description,image:j.logo||undefined,
      prefill:{name:d.name,contact:d.mobile,email:d.email||''},theme:{color:'#4f46e5'},retry:{enabled:true},
      handler:function(r){PAID=true;fx().pop({type:'loading',title:'Payment verify ho raha hai\\u2026',sub:'Kripya page band na karein'});
        api({action:'rzp_verify',orderId:r.razorpay_order_id,paymentId:r.razorpay_payment_id,signature:r.razorpay_signature}).then(function(v){
          fx().pop({type:'ok',title:'Payment successful!',sub:'Order '+v.id+' \\u00b7 '+money(v.amount)+' mil gaya. Hum jaldi call karenge.',btn:'Done'});
          f.innerHTML='<div class="msg ok" style="font-size:16px">\\ud83c\\udf89 <b>Payment received!</b> '+money(v.amount)+' \\u2014 Order no: <b>'+esc(v.id)+'</b><br>Payment ID: '+esc(v.paymentId)+'. Hamari team jaldi aapko call karegi.</div>'+(ST366.wa?'<a class="btn wide" style="margin-top:12px;background:#22c55e" target="_blank" rel="noopener" href="https://wa.me/'+ST366.wa+'?text='+encodeURIComponent('Hello, I paid online for '+(s?s.name:'')+'. Order '+v.id+', Payment '+v.paymentId)+'">\\ud83d\\udcac WhatsApp par message karein</a>':'');
        }).catch(function(e){fx().pop({type:'err',title:'Verification pending',sub:e.message+' Paisa kata hai to 10 minute me apne aap confirm ho jayega. Payment ID: '+r.razorpay_payment_id,btn:'OK'})});
      },
      modal:{ondismiss:function(){btn.disabled=false;if(!PAID)fx().pop({type:'err',title:'Payment poora nahi hua',sub:'Aapne payment window band kar di. Dobara try kar sakte hain.',btn:'OK'})}}
    });
    rz.open();
  }).catch(function(e){btn.disabled=false;fx().pop({type:'err',title:'Payment shuru nahi hua',sub:e.message,btn:'OK'})});
  return false;
};
})();`;
