/* FORGE — Shared Navigation, Shopping Cart Drawer, Seeded Orders, Command Palette (Cmd+K), Theme Engine & Web Audio */
const NAV=[['index.html','Home'],['about.html','About',[['about.html','Our Story'],['services.html','Services'],['news.html','Build Guides'],['gallery.html','Gallery']]],
 ['builder.html','3D Builder'],['products.html','Shop',[['products.html','Components'],['prebuilt.html','Prebuilt PCs'],['cart.html','Shopping Bag'],['order-detail.html','Track Order']]],
 ['contact.html','Support',[['contact.html','Contact Us'],['inquiry.html','Inquiry'],['comment.html','Comments'],['complaint.html','Complaint'],['faq.html','FAQ']]],['login.html','Login',[['login.html','Member Login'],['staff-dashboard.html','Staff Admin']]]];
const here=location.pathname.split('/').pop()||'index.html';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n).toLocaleString('en-US');
const qs=()=>Object.fromEntries(new URLSearchParams(location.search));
const user=()=>JSON.parse(localStorage.getItem('forgeUser')||'null');
const normalizeImgPath=s=>typeof s==='string'?s.replace(/^(img\/.+)\.png$/i,'$1.webp'):'img/renders/hero_rig_studio.webp';

/* Lucide Vector Icons (stroke-width 1.75, zero emojis) */
const ICONS={
 search:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
 volOn:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
 volOff:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
 cube:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>`,
 bag:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
 trash:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
 x:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
 plus:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
 minus:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`
};

/* Lighting & Accent Themes (Pure Carbon Accents): Warm Gold | Emerald | Signal Orange */
const THEMES=[
 {id:'titanium',label:'Warm Gold',hex:'#E5A93C',rgb:[229,169,60]},
 {id:'emerald', label:'Emerald',  hex:'#10B981',rgb:[16,185,129]},
 {id:'signal',  label:'Signal',   hex:'#FF7A17',rgb:[255,122,23]}
];
let curThemeId=localStorage.getItem('forgeTheme')||'titanium';
if(!THEMES.some(t=>t.id===curThemeId))curThemeId='titanium';
document.documentElement.setAttribute('data-theme',curThemeId);
function getTheme(){return THEMES.find(t=>t.id===curThemeId)||THEMES[0]}
window.setAppTheme=function(idOrHex){
 const needle=String(idOrHex||'').trim().toLowerCase();
 const next=THEMES.find(t=>t.id.toLowerCase()===needle||t.hex.toLowerCase()===needle);
 if(!next)return null;
 curThemeId=next.id;
 localStorage.setItem('forgeTheme',curThemeId);
 document.documentElement.setAttribute('data-theme',curThemeId);
 const tl=$('#themeLbl'),td=$('#themeDot');
 if(tl)tl.textContent=next.label;
 if(td)td.style.background=next.hex;
 window.dispatchEvent(new CustomEvent('forge-theme',{detail:next}));
 return next;
};

/* Subtle Web Audio Tactile Click */
let actx=null,sfxOn=localStorage.getItem('forgeSfx')!=='0';
function sfx(type='click'){
 if(!sfxOn)return;
 try{
  if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();
  if(actx.state==='suspended')actx.resume();
  const o=actx.createOscillator(),g=actx.createGain();
  o.connect(g);g.connect(actx.destination);
  const now=actx.currentTime;
  if(type==='install'){
   o.type='triangle';o.frequency.setValueAtTime(340,now);o.frequency.exponentialRampToValueAtTime(640,now+.08);
   g.gain.setValueAtTime(.05,now);g.gain.exponentialRampToValueAtTime(.001,now+.1);o.start(now);o.stop(now+.1);
  }else if(type==='warn'){
   o.type='sawtooth';o.frequency.setValueAtTime(190,now);o.frequency.setValueAtTime(150,now+.06);
   g.gain.setValueAtTime(.05,now);g.gain.exponentialRampToValueAtTime(.001,now+.14);o.start(now);o.stop(now+.14);
  }else{
   o.type='sine';o.frequency.setValueAtTime(520,now);o.frequency.exponentialRampToValueAtTime(190,now+.03);
   g.gain.setValueAtTime(.03,now);g.gain.exponentialRampToValueAtTime(.001,now+.035);o.start(now);o.stop(now+.035);
  }
 }catch(e){}
}

function toast(m){let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.append(t)}t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2400)}

/* 5-Stage Fulfillment Stages & Non-Destructive Seeded HK Orders */
window.FORGE_ORDER_STAGES=[
 {stage:1,label:'Order Confirmed',short:'Confirmed',sub:'Payment verified & build ticket queued'},
 {stage:2,label:'Parts Picked & Scanned',short:'Parts Allocated',sub:'Serial numbers scanned at Kwun Tong Vault'},
 {stage:3,label:'Single-Tech Assembly & Routing',short:'In Assembly',sub:'Custom harness routing & torque check'},
 {stage:4,label:'24h OCCT Burn-In Lab',short:'24h OCCT Burn-In',sub:'Thermal soak, acoustic floor & BIOS EXPO'},
 {stage:5,label:'Dispatched / Ready for Pickup',short:'Dispatched',sub:'Insured SF Express or Sino Centre pickup'}
];

const SEED_ORDERS=[
 {
  id:'FG-8419',
  total:5353,
  date:'2026-11-15',
  items:'FORGE Titan Ultra 2026 (Prebuilt System)',
  itemsList:[{id:'pb3',type:'kit',name:'FORGE Titan Ultra 2026',spec:'Core Ultra 9 285K · RTX 5090 32GB · 64GB DDR5-7200 · 4TB Gen5',price:5353,qty:1,asm:0,img:'img/products/pb3.webp'}],
  customer:'Kenji Leung',
  address:'Suite 2408, Two International Finance Centre, Central, Hong Kong',
  pay:'FPS (Faster Payment System)',
  delivery:'SF Express Insured 5-Day Courier',
  stage:4,
  status:'24h OCCT Burn-In',
  tamperBlocked:false,
  lab:{tech:'Marcus Ho (Senior L3)',bios:'Z890 Rev 1804 · XMP 7200 CL34',noise:'32.1 dBA',temp:'61°C',warranty:'3-Yr On-Site · WRT-8419HK'}
 },
 {
  id:'FG-8372',
  total:3493,
  date:'2026-11-12',
  items:'FORGE Studio Creator 2026 (Prebuilt System)',
  itemsList:[{id:'pb4',type:'kit',name:'FORGE Studio Creator 2026',spec:'Ryzen 9 9950X · RTX 5080 16GB · 64GB DDR5-6000 · Noctua G2',price:3493,qty:1,asm:0,img:'img/products/pb4.webp'}],
  customer:'Chloe Tam · Atelier K',
  address:'Unit 1602, Dorset House, Taikoo Place, Quarry Bay, Hong Kong',
  pay:'Visa / Mastercard',
  delivery:'SF Express Insured 5-Day Courier',
  stage:5,
  status:'Dispatched',
  tamperBlocked:false,
  lab:{tech:'Samson Ng (Acoustics Lead)',bios:'X870E Rev 1402 · EXPO 6000 CL30',noise:'27.4 dBA',temp:'58°C',warranty:'3-Yr On-Site · WRT-8372HK'}
 },
 {
  id:'FG-8295',
  total:2724,
  date:'2026-11-16',
  items:'Custom 3D Build (9800X3D · RTX 5070 Ti · UNI FAN TL LCD)',
  itemsList:[{id:'pb2',type:'build',name:'Custom 3D Build · Apex Edition',spec:'Ryzen 7 9800X3D · RTX 5070 Ti · 32GB DDR5-6400 · HydroShift 360 + UNI FAN LCD',price:2625,qty:1,asm:99,img:'img/products/pb2.webp',items:['c3','m4','r2','g4','s2','p2','k3','x1','a1','a4','a2']}],
  customer:'Ryan Cheung',
  address:'Flat C, 18/F, Block 3, Festival City, Tai Wai, Sha Tin, Hong Kong',
  pay:'PayMe by HSBC',
  delivery:'Mong Kok Sino Centre Showroom Pickup',
  stage:3,
  status:'In Assembly',
  tamperBlocked:false,
  lab:{tech:'Devon Lam (Lead Builder)',bios:'X870 Rev 3.12 · EXPO 6400 CL32',noise:'29.1 dBA',temp:'60°C',warranty:'3-Yr On-Site · WRT-8295HK'}
 },
 {
  id:'FG-8190',
  total:2250,
  date:'2026-11-17',
  items:'Custom 3D Build (Core Ultra 7 265K · RTX 5070 · Seasonic GX-850)',
  itemsList:[{id:'custom-8190',type:'build',name:'Custom 3D Build · Stealth 265K',spec:'Core Ultra 7 265K · RTX 5070 12GB · Seasonic Focus GX-850 · Arctic Freezer III 360',price:2151,qty:1,asm:99,img:'img/products/x5.webp',items:['c1','m2','r2','g3','s2','p2','k4','x5','a1']}],
  customer:'Daniel Kwok',
  address:'Flat B, 22/F, Grand Promenade, Sai Wan Ho, Hong Kong',
  pay:'Octopus',
  delivery:'Mong Kok Sino Centre Showroom Pickup',
  stage:4,
  status:'24h OCCT Burn-In',
  tamperBlocked:false,
  lab:{tech:'Marcus Ho (Senior L3)',bios:'Z890 Rev 1804 · XMP 6400 CL32',noise:'28.2 dBA',temp:'51°C',warranty:'3-Yr On-Site · WRT-8190HK'}
 }
];

window.ensureSeedOrders=function(){
 let list=[];
 try{list=JSON.parse(localStorage.getItem('forgeOrders')||'[]')}catch(e){list=[]}
 if(!Array.isArray(list))list=[];
 let changed=false;
 list.forEach(o=>{
  if(o&&Array.isArray(o.itemsList)){
   o.itemsList.forEach(it=>{
    if(it&&typeof it.img==='string'&&/^img\/.+\.png$/i.test(it.img)){
     it.img=normalizeImgPath(it.img);
     changed=true;
    }
   });
  }
 });
 SEED_ORDERS.forEach(seed=>{
  if(!list.some(o=>o&&o.id===seed.id)){
   list.push(JSON.parse(JSON.stringify(seed)));
   changed=true;
  }
 });
 if(changed){
  try{localStorage.setItem('forgeOrders',JSON.stringify(list))}catch(e){}
 }
 return list;
};

/* Global Shopping Bag API (localStorage.forgeCart) */
(function(){
 const KEY='forgeCart';
 function read(){
  try{
   const arr=JSON.parse(localStorage.getItem(KEY)||'[]');
   if(!Array.isArray(arr))return [];
   return arr.filter(x=>x&&typeof x==='object').map(x=>({
    key:String(x.key||`${x.type||'part'}:${x.id||x.name||'item'}`),
    id:String(x.id||''),
    type:['part','kit','build','service'].includes(x.type)?x.type:'part',
    name:String(x.name||'FORGE Item'),
    spec:String(x.spec||''),
    price:Math.max(0,Number(x.price)||0),
    qty:Math.max(1,Math.min(99,Math.floor(Number(x.qty)||1))),
    img:normalizeImgPath(String(x.img||'img/renders/hero_rig_studio.webp')),
    asm:x.asm!==undefined?Math.max(0,Number(x.asm)||0):(x.type==='build'?99:0),
    items:Array.isArray(x.items)?x.items.slice():null
   }));
  }catch(e){return []}
 }
 function updateBadge(cart){
  const badge=$('#cartBadge');
  if(!badge)return;
  const count=(cart||read()).reduce((s,it)=>s+it.qty,0);
  badge.textContent=String(count);
  badge.classList.toggle('has-items',count>0);
 }
 function saveCart(cart){
  const clean=Array.isArray(cart)?cart:[];
  try{localStorage.setItem(KEY,JSON.stringify(clean))}catch(e){}
  updateBadge(clean);
  renderCartDrawer();
  window.dispatchEvent(new CustomEvent('forge-cart',{detail:clean}));
  return clean;
 }
 function addToCart(item,openDrawer=true){
  if(!item)return read();
  const cart=read();
  const type=['part','kit','build','service'].includes(item.type)?item.type:'part';
  const id=String(item.id||'');
  const key=item.key?String(item.key):(type==='build'?'build:'+Date.now().toString(36)+Math.random().toString(36).slice(2,5):`${type}:${id||item.name||'item'}`);
  let price=Math.max(0,Number(item.price)||0);
  if(!price&&Array.isArray(item.items)&&typeof byId==='function'){
   price=item.items.reduce((s,pid)=>s+(byId(pid)?.price||0),0);
  }
  const normalized={
   key,
   id,
   type,
   name:String(item.name||(id&&typeof byId==='function'?byId(id)?.name:'')||'FORGE Item'),
   spec:String(item.spec||''),
   price,
   qty:Math.max(1,Math.min(99,Math.floor(Number(item.qty)||1))),
   img:String(item.img||(id&&type!=='service'?`img/products/${id}.webp`:'img/renders/hero_rig_studio.webp')),
   asm:item.asm!==undefined?Math.max(0,Number(item.asm)||0):(type==='build'?99:0),
   items:Array.isArray(item.items)?item.items.slice():null
  };
  const existing=type!=='build'?cart.find(x=>x.key===normalized.key):null;
  if(existing){
   existing.qty=Math.min(99,existing.qty+normalized.qty);
  }else{
   cart.push(normalized);
  }
  saveCart(cart);
  sfx('install');
  toast(`Added to bag: ${normalized.name}`);
  if(openDrawer)openCartDrawer();
  return cart;
 }
 function updateCartQty(key,delta){
  const cart=read();
  const idx=cart.findIndex(x=>x.key===key);
  if(idx<0)return cart;
  cart[idx].qty+=Number(delta)||0;
  if(cart[idx].qty<=0)cart.splice(idx,1);
  else cart[idx].qty=Math.min(99,cart[idx].qty);
  sfx();
  return saveCart(cart);
 }
 function removeCartItem(key){
  const cart=read().filter(x=>x.key!==key);
  sfx();
  return saveCart(cart);
 }
 function clearCart(){
  return saveCart([]);
 }
 function cartCount(){
  return read().reduce((s,x)=>s+x.qty,0);
 }
 function openCartDrawer(){
  renderCartDrawer();
  const bd=$('#cartDrawerBackdrop'),dr=$('#cartDrawer');
  if(bd)bd.classList.add('open');
  if(dr)dr.classList.add('open');
 }
 function closeCartDrawer(){
  const bd=$('#cartDrawerBackdrop'),dr=$('#cartDrawer');
  if(bd)bd.classList.remove('open');
  if(dr)dr.classList.remove('open');
 }
 function renderCartDrawer(){
  const list=$('#cartDrawerList'),foot=$('#cartDrawerFoot'),cnt=$('#cartDrawerCount');
  const cart=read();
  updateBadge(cart);
  if(cnt)cnt.textContent=`${cart.reduce((s,x)=>s+x.qty,0)} item(s)`;
  if(!list)return;
  if(!cart.length){
   list.innerHTML=`<div style="margin:auto;text-align:center;padding:36px 16px;display:grid;gap:12px;justify-items:center">
    <div style="width:48px;height:48px;border-radius:12px;background:#181818;border:1px solid var(--line);display:grid;place-items:center;color:var(--mut)"><span style="width:20px;height:20px;display:inline-flex">${ICONS.bag}</span></div>
    <div><b style="display:block;font-size:.98rem">Your shopping bag is empty</b><p class="mut" style="font-size:.82rem;margin-top:4px">Configure a custom system in 3D or add components from the shop.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:4px">
     <a class="btn sm solid" href="builder.html">3D Builder</a>
     <a class="btn sm" href="products.html">Browse Parts</a>
    </div>
   </div>`;
   if(foot)foot.innerHTML=`<a class="btn sm subtle" href="cart.html" style="width:100%;justify-content:center">View Full Bag</a>`;
   return;
  }
  const typeLabel={part:'Part',kit:'Prebuilt',build:'Custom 3D',service:'Service'};
  list.innerHTML=cart.map(it=>`<div class="drawer-item" data-key="${esc(it.key)}">
   <img class="drawer-thumb" src="${esc(normalizeImgPath(it.img))}" alt="${esc(it.name)}" loading="lazy" decoding="async">
   <div class="drawer-meta">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
     <b style="font-size:.86rem;line-height:1.3">${esc(it.name)}</b>
     <span class="price" style="font-size:.9rem;white-space:nowrap">${money(it.price*it.qty)}</span>
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
     <span class="tag" style="font-size:.62rem;padding:1px 6px">${esc(typeLabel[it.type]||'Item')}</span>
     <span class="mut" style="font-size:.74rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px">${esc(it.spec||'FORGE Verified')}</span>
    </div>
    <div class="drawer-controls">
     <div class="qty-stepper">
      <button type="button" data-act="dec" data-key="${esc(it.key)}" aria-label="Decrease quantity">${ICONS.minus}</button>
      <span>${it.qty}</span>
      <button type="button" data-act="inc" data-key="${esc(it.key)}" aria-label="Increase quantity">${ICONS.plus}</button>
     </div>
     <button type="button" class="drawer-rm" data-act="rm" data-key="${esc(it.key)}">${ICONS.trash}<span>Remove</span></button>
    </div>
   </div>
  </div>`).join('');
  const asm=cart.reduce((s,it)=>s+it.asm*it.qty,0);
  const hwSub=cart.filter(it=>it.type!=='service').reduce((s,it)=>s+it.price*it.qty,0);
  const svcEntries=cart.filter(it=>it.type==='service').map(it=>{
   const catSvc=typeof serviceByIdOrName==='function'?(serviceByIdOrName(it.id)||serviceByIdOrName(it.name)):null;
   return {svc:catSvc||{price:it.price,memberFree:false},qty:it.qty};
  });
  const pricing=typeof computeOrderPricing==='function'
   ?computeOrderPricing({hwSub,serviceEntries:svcEntries,asm,isMember:!!user(),hasForge5:false})
   :{sub:hwSub+svcEntries.reduce((s,e)=>s+e.svc.price*e.qty,0),asm,disc:0,total:hwSub+asm+svcEntries.reduce((s,e)=>s+e.svc.price*e.qty,0),label:''};
  if(foot){
   foot.innerHTML=`
    <div style="display:grid;gap:4px;font-size:.84rem">
     <div style="display:flex;justify-content:space-between"><span class="mut">Subtotal (USD)</span><b style="font-family:var(--mono)">${money(pricing.sub)}</b></div>
     ${pricing.asm?`<div style="display:flex;justify-content:space-between"><span class="mut">Lab Assembly &amp; Burn-In</span><b style="font-family:var(--mono)">${money(pricing.asm)}</b></div>`:''}
     ${pricing.disc?`<div style="display:flex;justify-content:space-between"><span class="mut">${esc(pricing.label)}</span><b style="font-family:var(--mono);color:var(--ok)">-${money(pricing.disc)}</b></div>`:''}
     <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--line)"><span style="font-weight:600">Estimated Total (USD)</span><b class="price" style="font-size:1.08rem">${money(pricing.total)}</b></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:8px">
     <a class="btn sm subtle" href="cart.html" style="justify-content:center">View Full Bag</a>
     <a class="btn sm solid" href="order-confirm.html?src=cart" style="justify-content:center">Checkout →</a>
    </div>`;
  }
 }
 window.forgeCart={getCart:read,saveCart,addToCart,updateCartQty,removeCartItem,clearCart,cartCount,openCartDrawer,closeCartDrawer,renderCartDrawer};
})();

function buildChrome(){
 const u=user(),th=getTheme();
 const mainEl=document.querySelector('main');
 if(mainEl&&!mainEl.id)mainEl.id='mainContent';
 const li=NAV.map(([h,t,sub])=>{
  if(h==='login.html'&&u)return `<li><a href="${u.role==='staff'?'staff-dashboard':'member-dashboard'}.html">${esc(u.name)}</a></li>`;
  const act=(h===here||(sub||[]).some(s=>s[0]===here))?' class="active"':'';
  return `<li><a href="${h}"${act}>${t}${sub?' ▾':''}</a>${sub?`<ul class="drop">${sub.map(s=>`<li><a href="${s[0]}">${s[1]}</a></li>`).join('')}</ul>`:''}</li>`}).join('');
 document.body.insertAdjacentHTML('afterbegin',`<div id="scrollBar"></div>
 <a class="skip-link" href="#${mainEl?mainEl.id:'mainContent'}">Skip to main content</a>
 <header><nav class="wrap nav" aria-label="Primary"><a class="logo" href="index.html">FOR<span>GE</span></a>
 <ul class="menu" id="menu">${li}</ul>
 <div class="nav-tools">
  <button class="kbd-btn" id="themeBtn" type="button" title="Switch 3D accent lighting"><span class="swatch-dot" id="themeDot" style="background:${th.hex}"></span><span id="themeLbl">${th.label}</span></button>
  <button class="kbd-btn" id="cmdBtn" type="button" title="Search pages and components">${ICONS.search}<span>Search</span><kbd>⌘K</kbd></button>
  <button class="kbd-btn" id="sfxBtn" type="button" title="Toggle UI sound" aria-label="Toggle sound">${sfxOn?ICONS.volOn:ICONS.volOff}</button>
  <button class="kbd-btn cart-btn" id="cartBtn" type="button" title="Shopping Bag" aria-label="Open shopping bag">${ICONS.bag}<span>Bag</span><span class="cart-badge" id="cartBadge">0</span></button>
  <a class="btn sm solid" href="builder.html">Configure 3D</a>
  <button class="burger" id="burger" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="menu"><span></span></button>
 </div></nav></header>`);
 document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap fgrid">
 <div><a class="logo" href="index.html">FOR<span>GE</span></a><p class="mut" style="margin-top:10px;max-width:36ch">Custom workstations and gaming PCs built in Hong Kong since 2016. Configured in real-time 3D and stress-tested for 24 hours before dispatch.</p></div>
 <div><p class="foot-h">Products</p><ul><li><a href="builder.html">3D Configurator</a></li><li><a href="products.html">Components</a></li><li><a href="prebuilt.html">Prebuilt Systems</a></li><li><a href="cart.html">Shopping Bag</a></li><li><a href="services.html">Services</a></li></ul></div>
 <div><p class="foot-h">Company</p><ul><li><a href="about.html">About</a></li><li><a href="news.html">Build Guides</a></li><li><a href="gallery.html">Gallery</a></li><li><a href="sitemap.html">Site Map</a></li></ul></div>
 <div><p class="foot-h">Support</p><ul><li><a href="order-detail.html">Track Order &amp; Invoice</a></li><li><a href="faq.html">FAQ</a></li><li><a href="complaint.html">Support Ticket</a></li><li><a href="contact.html">Contact</a></li><li><a href="staff-dashboard.html">Staff Operations Console</a></li></ul></div>
 </div><p class="copy"><span>© 2026 FORGE Custom PC Ltd. · Mong Kok Sino Centre Showroom · Kwun Tong ISO-9001 Burn-In Lab · 3-Yr On-Site HK Warranty · All prices in USD</span><span><a href="#" id="openShortcutsLink">Shortcuts (?)</a> · <a href="sitemap.html">Site Map</a> · <a href="faq.html">Warranty &amp; Terms</a></span></p></footer>
 <button id="toTop" type="button" aria-label="Back to top">↑</button>
 <div class="drawer-backdrop" id="cartDrawerBackdrop"></div>
 <aside class="drawer" id="cartDrawer" aria-label="Shopping Bag Drawer">
  <div class="drawer-head">
   <div><p style="margin:0;font-size:1.05rem;font-weight:600;color:var(--txt)">Shopping Bag</p><small class="mut" id="cartDrawerCount" style="font-family:var(--mono);font-size:.74rem">0 item(s)</small></div>
   <button class="drawer-close" id="cartDrawerClose" type="button" aria-label="Close shopping bag">${ICONS.x}</button>
  </div>
  <div class="drawer-body" id="cartDrawerList"></div>
  <div class="drawer-foot" id="cartDrawerFoot"></div>
 </aside>
 <div class="cmdk-backdrop" id="cmdk"><div class="cmdk" onclick="event.stopPropagation()">
  <div class="cmdk-in"><span style="display:inline-flex;width:16px;height:16px;color:var(--mut)">${ICONS.search}</span><input id="cmdkIn" placeholder="Search 53 components, prebuilt systems, or pages…" autocomplete="off"><kbd style="font-family:var(--mono);font-size:.7rem;color:var(--mut)">ESC</kbd></div>
  <div class="cmdk-list" id="cmdkList"></div>
 </div></div>
 <div class="modal" id="shortcutsModal" role="dialog" aria-modal="true" aria-labelledby="shortcutsTitle">
  <div class="card" style="max-width:480px" onclick="event.stopPropagation()">
   <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
    <p id="shortcutsTitle" style="font-size:1.1rem;font-weight:600;color:var(--txt)">Keyboard Shortcuts &amp; 3D Controls</p>
    <button type="button" class="btn sm subtle" id="closeShortcutsBtn">Close</button>
   </div>
   <div class="shortcut-list">
    <div class="shortcut-row"><span>Open Quick Search Palette</span><kbd>⌘K / Ctrl+K</kbd></div>
    <div class="shortcut-row"><span>Toggle Shortcuts Overlay</span><kbd>?</kbd></div>
    <div class="shortcut-row"><span>Close Modals, Bag Drawer or Menu</span><kbd>Esc</kbd></div>
    <div class="shortcut-row"><span>Orbit &amp; Zoom Live 3D Rig</span><kbd>Drag / Scroll</kbd></div>
    <div class="shortcut-row"><span>Inspect Part in 3D Configurator</span><kbd>Click 3D Part</kbd></div>
   </div>
   <p class="mut" style="font-size:.78rem">Tip: Use Tab from the top of any page to jump straight to main content via the Skip Link.</p>
  </div>
 </div>`);

 const b=$('#burger'),m=$('#menu'),hdr=$('header');
 const closeMenu=()=>{
  b.classList.remove('open');
  m.classList.remove('open');
  b.setAttribute('aria-expanded','false');
 };
 window.closeMobileMenu=closeMenu;
 b.onclick=()=>{
  const open=m.classList.toggle('open');
  b.classList.toggle('open',open);
  b.setAttribute('aria-expanded',open?'true':'false');
  sfx();
 };
 m.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
 document.addEventListener('click',e=>{if(m.classList.contains('open')&&hdr&&!hdr.contains(e.target))closeMenu()});

 const scModal=$('#shortcutsModal');
 const toggleShortcuts=force=>{
  const show=force!==undefined?!!force:!scModal.classList.contains('show');
  scModal.classList.toggle('show',show);
  if(show)sfx();
 };
 $('#closeShortcutsBtn').onclick=()=>toggleShortcuts(false);
 scModal.onclick=()=>toggleShortcuts(false);
 $('#openShortcutsLink').onclick=e=>{e.preventDefault();toggleShortcuts(true)};
 window.toggleShortcutsModal=toggleShortcuts;

 $('#sfxBtn').onclick=e=>{sfxOn=!sfxOn;localStorage.setItem('forgeSfx',sfxOn?'1':'0');e.currentTarget.innerHTML=sfxOn?ICONS.volOn:ICONS.volOff;if(sfxOn)sfx('install');toast(sfxOn?'UI sound enabled':'UI sound muted')};
 $('#themeBtn').onclick=()=>{
  const idx=(THEMES.findIndex(t=>t.id===curThemeId)+1)%THEMES.length;
  const next=window.setAppTheme(THEMES[idx].id);
  sfx('install');
  toast(`Accent set to ${next.label}`);
 };
 $('#cartBtn').onclick=()=>window.forgeCart.openCartDrawer();
 $('#cartDrawerBackdrop').onclick=()=>window.forgeCart.closeCartDrawer();
 $('#cartDrawerClose').onclick=()=>window.forgeCart.closeCartDrawer();
 $('#cartDrawerList').onclick=e=>{
  const btn=e.target.closest('button[data-act]');
  if(!btn)return;
  const act=btn.dataset.act,key=btn.dataset.key;
  if(act==='inc')window.forgeCart.updateCartQty(key,1);
  else if(act==='dec')window.forgeCart.updateCartQty(key,-1);
  else if(act==='rm')window.forgeCart.removeCartItem(key);
 };

 const tt=$('#toTop'),sb=$('#scrollBar');
 addEventListener('scroll',()=>{
  tt.classList.toggle('show',scrollY>500);
  const max=document.documentElement.scrollHeight-innerHeight;
  const pct=max>0?Math.min(100,Math.max(0,(scrollY/max)*100)):0;
  if(sb)sb.style.width=pct+'%';
 },{passive:true});
 tt.onclick=()=>scrollTo({top:0,behavior:'smooth'});
 document.addEventListener('click',e=>{if(e.target.closest('.btn,.chip,.opt,.tabs button'))sfx()},{passive:true});
 window.ensureSeedOrders();
 window.forgeCart.renderCartDrawer();
 initCmdK();
 initTaglineReveal();
}

/* Word-by-Word Scroll Tagline Reveal (ai-design-skills B11) */
function initTaglineReveal(){
 const blocks=$$('.tagline-reveal');
 if(!blocks.length)return;
 blocks.forEach(b=>{
  if(b.dataset.split)return;
  b.dataset.split='1';
  const raw=b.textContent.trim().split(/\s+/);
  b.innerHTML=raw.map(w=>`<span class="tagline-word">${esc(w)}</span>`).join(' ');
 });
 const updateWords=()=>{
  const triggerY=window.innerHeight*0.78;
  blocks.forEach(b=>{
   $$('.tagline-word',b).forEach(w=>{
    if(w.getBoundingClientRect().top<triggerY)w.classList.add('lit');
   });
  });
 };
 updateWords();
 let ticking=false;
 addEventListener('scroll',()=>{
  if(!ticking){
   requestAnimationFrame(()=>{updateWords();ticking=false});
   ticking=true;
  }
 },{passive:true});
}

/* Command Palette (Cmd+K / Ctrl+K) */
function initCmdK(){
 const bd=$('#cmdk'),inp=$('#cmdkIn'),list=$('#cmdkList');
 const pages=[['3D PC Configurator','builder.html','Page'],['All Components','products.html','Page'],['Prebuilt Systems','prebuilt.html','Page'],['Shopping Bag','cart.html','Shop'],['Track Order & Invoice','order-detail.html','Orders'],['Services & Repair','services.html','Page'],['About FORGE','about.html','Page'],['Customer Gallery','gallery.html','Page'],['Build Guides','news.html','Page'],['FAQ','faq.html','Page'],['Contact Us','contact.html','Page'],['General Inquiry','inquiry.html','Page'],['Customer Comments','comment.html','Page'],['Support Ticket','complaint.html','Page'],['Account Login','login.html','Page'],['Member Registration','register.html','Page'],['Staff Operations Console','staff-dashboard.html','Admin'],['Site Map','sitemap.html','Page']];
 const items=[...pages,...(typeof PREBUILT!=='undefined'?PREBUILT.map(k=>[k.name+' · '+money(kitPrice(k)),`builder.html?kit=${k.id}`,'System']):[]),...(typeof PARTS!=='undefined'?PARTS.map(p=>[p.name+' · '+money(p.price),`product-detail.html?id=${p.id}`,CATS[p.cat]]):[])];
 function draw(q=''){
  const f=items.filter(x=>x[0].toLowerCase().includes(q.toLowerCase())||x[2].toLowerCase().includes(q.toLowerCase())).slice(0,10);
  list.innerHTML=f.map((x,i)=>`<a class="cmdk-item ${i===0?'act':''}" href="${x[1]}"><span>${esc(x[0])}</span><small>${esc(x[2])}</small></a>`).join('')||'<p class="mut center" style="padding:18px">No matching results.</p>';
 }
 const open=()=>{bd.classList.add('show');inp.value='';draw();inp.focus();sfx()};
 const close=()=>bd.classList.remove('show');
 $('#cmdBtn').onclick=open;bd.onclick=close;
 inp.oninput=e=>draw(e.target.value);
 inp.onkeydown=e=>{
  const rows=$$('.cmdk-item',list);
  if(!rows.length)return;
  let idx=rows.findIndex(r=>r.classList.contains('act'));
  if(e.key==='ArrowDown'){
   e.preventDefault();
   if(idx>=0)rows[idx].classList.remove('act');
   idx=(idx+1)%rows.length;
   rows[idx].classList.add('act');
   rows[idx].scrollIntoView({block:'nearest'});
  }else if(e.key==='ArrowUp'){
   e.preventDefault();
   if(idx>=0)rows[idx].classList.remove('act');
   idx=(idx-1+rows.length)%rows.length;
   rows[idx].classList.add('act');
   rows[idx].scrollIntoView({block:'nearest'});
  }else if(e.key==='Enter'){
   const a=$('.cmdk-item.act',list)||rows[0];
   if(a)location.href=a.getAttribute('href');
  }
 };
 addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();bd.classList.contains('show')?close():open()}
  else if(e.key==='?'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
   const tag=(document.activeElement&&document.activeElement.tagName||'').toLowerCase();
   if(!['input','textarea','select'].includes(tag)&&!(document.activeElement&&document.activeElement.isContentEditable)){
    e.preventDefault();if(window.toggleShortcutsModal)window.toggleShortcutsModal();
   }
  }else if(e.key==='Escape'){
   close();
   if(window.forgeCart)window.forgeCart.closeCartDrawer();
   if(window.closeMobileMenu)window.closeMobileMenu();
   if(window.toggleShortcutsModal)window.toggleShortcutsModal(false);
  }
 });
}

function initAccordion(){$$('.acc-h').forEach(h=>{h.setAttribute('aria-expanded','false');h.onclick=()=>{const a=h.parentElement,b=h.nextElementSibling,open=a.classList.toggle('open');h.setAttribute('aria-expanded',open?'true':'false');b.style.maxHeight=open?b.scrollHeight+40+'px':0;sfx()}})}
function initSlider(){$$('.slider').forEach(s=>{
 const track=$('.slides',s),n=track.children.length,dots=$('.dots',s);let i=0,t;
 dots.innerHTML=[...Array(n)].map((_,k)=>`<button aria-label="Slide ${k+1}"></button>`).join('');
 const go=k=>{i=(k+n)%n;track.style.transform=`translateX(-${i*100}%)`;$$('button',dots).forEach((d,j)=>d.classList.toggle('on',j===i))};
 const auto=()=>{clearInterval(t);t=setInterval(()=>go(i+1),5000)};
 $('.sprev',s).onclick=()=>{go(i-1);auto()};$('.snext',s).onclick=()=>{go(i+1);auto()};
 $$('button',dots).forEach((d,j)=>d.onclick=()=>{go(j);auto()});s.onmouseenter=()=>clearInterval(t);s.onmouseleave=auto;go(0);auto()})}
function initReveal(){
 $$('.tl, .acc').forEach(el=>{if(!el.closest('.modal')&&!el.closest('.cmdk'))el.classList.add('reveal')});
 $$('.grid').forEach(g=>$$('.reveal',g).forEach((el,i)=>el.style.setProperty('--d',(i%4)*55+'ms')));
 const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
   e.target.classList.add('in');
   io.unobserve(e.target);
  }
 }),{threshold:.04,rootMargin:'0px 0px 40px 0px'});
 const observeAll=root=>{
  $$('.reveal:not(.in)',root).forEach(el=>{
   const r=el.getBoundingClientRect();
   if(r.top<window.innerHeight*1.15){requestAnimationFrame(()=>el.classList.add('in'))}
   else{io.observe(el)}
  });
 };
 observeAll(document);
 const mo=new MutationObserver(muts=>{muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.classList.contains('reveal'))observeAll(n.parentElement||document);else observeAll(n)}}))});
 mo.observe(document.body,{childList:true,subtree:true});
}
function initCounters(){$$('[data-count]').forEach(el=>{const end=+el.dataset.count,pre=el.dataset.pre||'',suf=el.dataset.suf||'';const run=()=>{const t0=performance.now(),dur=700;const st=now=>{const p=Math.min(1,(now-t0)/dur),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=pre+v.toLocaleString('en-US')+suf;if(p<1)requestAnimationFrame(st);else el.textContent=pre+end.toLocaleString('en-US')+suf};requestAnimationFrame(st)};new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){run();o.disconnect()}}).observe(el)})}

function validate(form){let ok=true;$$('[data-rule]',form).forEach(f=>{const v=f.value.trim();let msg='';
 f.dataset.rule.split('|').forEach(r=>{const[k,a]=r.split(':');
  if(k==='req'&&!v)msg='This field is required';
  if(k==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))msg='Enter a valid email';
  if(k==='phone'&&v&&!/^[2-9]\d{7}$/.test(v))msg='Enter an 8-digit HK phone number';
  if(k==='min'&&v.length<+a)msg=`At least ${a} characters`;
  if(k==='match'&&v!==$('#'+a).value)msg='Does not match';
  if(k==='pw'&&v&&!(/[A-Z]/.test(v)&&/\d/.test(v)&&v.length>=8))msg='8+ chars with a capital letter and a number'});
 f.classList.toggle('bad',!!msg);f.classList.toggle('good',!msg&&!!v);const e=f.parentElement.querySelector('.err');if(e)e.textContent=msg;if(msg)ok=false});if(!ok)sfx('warn');return ok}
function liveValidate(form){$$('[data-rule]',form).forEach(f=>f.addEventListener('blur',()=>validate(form)&&0))}
function fillResult(tbody,labels){const p=qs();tbody.innerHTML='';Object.entries(labels).forEach(([k,l])=>{if(p[k]===undefined)return;const tr=document.createElement('tr');const a=document.createElement('th');a.scope='row';const b=document.createElement('td');a.textContent=l;b.textContent=k.includes('pass')?'••••••••':p[k]||'—';tr.append(a,b);tbody.append(tr)})}
const ticket=p=>p+'-'+Date.now().toString(36).toUpperCase().slice(-6);

document.addEventListener('DOMContentLoaded',()=>{buildChrome();initAccordion();initSlider();initReveal();initCounters()});
