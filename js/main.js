/* FORGE — Shared Navigation, Command Palette (Cmd+K), Theme Engine, Tagline Scroll Reveal & Web Audio */
const NAV=[['index.html','Home'],['about.html','About',[['about.html','Our Story'],['services.html','Services'],['news.html','Build Guides'],['gallery.html','Gallery']]],
 ['builder.html','3D Builder'],['products.html','Shop',[['products.html','Components'],['prebuilt.html','Prebuilt PCs']]],
 ['contact.html','Support',[['contact.html','Contact Us'],['inquiry.html','Inquiry'],['comment.html','Comments'],['complaint.html','Complaint'],['faq.html','FAQ']]],['login.html','Login']];
const here=location.pathname.split('/').pop()||'index.html';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n).toLocaleString('en-US');
const qs=()=>Object.fromEntries(new URLSearchParams(location.search));
const user=()=>JSON.parse(localStorage.getItem('forgeUser')||'null');

/* Lucide Vector Icons (stroke-width 1.75, zero emojis) */
const ICONS={
 search:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
 volOn:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
 volOff:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
 cube:`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>`
};

/* Lighting & Accent Themes (Zero Purple): Warm Gold | Emerald | Signal Orange */
const THEMES=[
 {id:'titanium',label:'Warm Gold',hex:'#E5A93C',rgb:[229,169,60]},
 {id:'emerald', label:'Emerald',  hex:'#10B981',rgb:[16,185,129]},
 {id:'signal',  label:'Signal',   hex:'#FF7A17',rgb:[255,122,23]}
];
let curThemeId=localStorage.getItem('forgeTheme')||'titanium';
if(!THEMES.some(t=>t.id===curThemeId))curThemeId='titanium';
document.documentElement.setAttribute('data-theme',curThemeId);
function getTheme(){return THEMES.find(t=>t.id===curThemeId)||THEMES[0]}

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

function buildChrome(){
 const u=user(),th=getTheme();
 const li=NAV.map(([h,t,sub])=>{
  if(h==='login.html'&&u)return `<li><a href="${u.role==='staff'?'staff-dashboard':'member-dashboard'}.html">${esc(u.name)}</a></li>`;
  const act=(h===here||(sub||[]).some(s=>s[0]===here))?' class="active"':'';
  return `<li><a href="${h}"${act}>${t}${sub?' ▾':''}</a>${sub?`<ul class="drop">${sub.map(s=>`<li><a href="${s[0]}">${s[1]}</a></li>`).join('')}</ul>`:''}</li>`}).join('');
 document.body.insertAdjacentHTML('afterbegin',`<div id="scrollBar"></div>
 <header><div class="wrap nav"><a class="logo" href="index.html">FOR<span>GE</span></a>
 <ul class="menu" id="menu">${li}</ul>
 <div class="nav-tools">
  <button class="kbd-btn" id="themeBtn" title="Switch 3D accent lighting"><span class="swatch-dot" id="themeDot" style="background:${th.hex}"></span><span id="themeLbl">${th.label}</span></button>
  <button class="kbd-btn" id="cmdBtn" title="Search pages and components">${ICONS.search}<span>Search</span><kbd>⌘K</kbd></button>
  <button class="kbd-btn" id="sfxBtn" title="Toggle UI sound" aria-label="Toggle sound">${sfxOn?ICONS.volOn:ICONS.volOff}</button>
  <a class="btn sm solid" href="builder.html">Configure 3D</a>
  <button class="burger" id="burger" aria-label="Open menu"><span></span></button>
 </div></div></header>`);
 document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap fgrid">
 <div><a class="logo" href="index.html">FOR<span>GE</span></a><p class="mut" style="margin-top:10px;max-width:36ch">Custom workstations and gaming PCs built in Hong Kong since 2016. Configured in real-time 3D and stress-tested for 24 hours before dispatch.</p></div>
 <div><h4>Products</h4><ul><li><a href="builder.html">3D Configurator</a></li><li><a href="products.html">Components</a></li><li><a href="prebuilt.html">Prebuilt Systems</a></li><li><a href="services.html">Services</a></li></ul></div>
 <div><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="news.html">Build Guides</a></li><li><a href="gallery.html">Gallery</a></li><li><a href="sitemap.html">Site Map</a></li></ul></div>
 <div><h4>Support</h4><ul><li><a href="contact.html">Contact</a></li><li><a href="faq.html">FAQ</a></li><li><a href="complaint.html">Support Ticket</a></li><li><a href="login.html">Account</a></li></ul></div>
 </div><p class="copy"><span>© 2026 FORGE Custom PC Ltd. Hong Kong.</span><span><a href="sitemap.html">Site Map</a> · <a href="faq.html">Warranty & Terms</a></span></p></footer>
 <button id="toTop" aria-label="Back to top">↑</button>
 <div class="cmdk-backdrop" id="cmdk"><div class="cmdk" onclick="event.stopPropagation()">
  <div class="cmdk-in"><span style="display:inline-flex;width:16px;height:16px;color:var(--mut)">${ICONS.search}</span><input id="cmdkIn" placeholder="Search 53 components, prebuilt systems, or pages…" autocomplete="off"><kbd style="font-family:var(--mono);font-size:.7rem;color:var(--mut)">ESC</kbd></div>
  <div class="cmdk-list" id="cmdkList"></div>
 </div></div>`);

 const b=$('#burger'),m=$('#menu');b.onclick=()=>{b.classList.toggle('open');m.classList.toggle('open');sfx()};
 $('#sfxBtn').onclick=e=>{sfxOn=!sfxOn;localStorage.setItem('forgeSfx',sfxOn?'1':'0');e.currentTarget.innerHTML=sfxOn?ICONS.volOn:ICONS.volOff;if(sfxOn)sfx('install');toast(sfxOn?'UI sound enabled':'UI sound muted')};
 $('#themeBtn').onclick=()=>{
  const idx=(THEMES.findIndex(t=>t.id===curThemeId)+1)%THEMES.length;
  const next=THEMES[idx];
  curThemeId=next.id;
  localStorage.setItem('forgeTheme',curThemeId);
  document.documentElement.setAttribute('data-theme',curThemeId);
  const tl=$('#themeLbl'),td=$('#themeDot');
  if(tl)tl.textContent=next.label;
  if(td)td.style.background=next.hex;
  window.dispatchEvent(new CustomEvent('forge-theme',{detail:next}));
  sfx('install');
  toast(`Accent set to ${next.label}`);
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
 const pages=[['3D PC Configurator','builder.html','Page'],['All Components','products.html','Page'],['Prebuilt Systems','prebuilt.html','Page'],['Services & Repair','services.html','Page'],['About FORGE','about.html','Page'],['Customer Gallery','gallery.html','Page'],['Build Guides','news.html','Page'],['FAQ','faq.html','Page'],['Contact Us','contact.html','Page'],['General Inquiry','inquiry.html','Page'],['Customer Comments','comment.html','Page'],['Support Ticket','complaint.html','Page'],['Account Login','login.html','Page'],['Member Registration','register.html','Page'],['Site Map','sitemap.html','Page']];
 const items=[...pages,...(typeof PREBUILT!=='undefined'?PREBUILT.map(k=>[k.name+' · '+money(kitPrice(k)),`builder.html?kit=${k.id}`,'System']):[]),...(typeof PARTS!=='undefined'?PARTS.map(p=>[p.name+' · '+money(p.price),`product-detail.html?id=${p.id}`,CATS[p.cat]]):[])];
 function draw(q=''){
  const f=items.filter(x=>x[0].toLowerCase().includes(q.toLowerCase())||x[2].toLowerCase().includes(q.toLowerCase())).slice(0,10);
  list.innerHTML=f.map((x,i)=>`<a class="cmdk-item ${i===0?'act':''}" href="${x[1]}"><span>${esc(x[0])}</span><small>${esc(x[2])}</small></a>`).join('')||'<p class="mut center" style="padding:18px">No matching results.</p>';
 }
 const open=()=>{bd.classList.add('show');inp.value='';draw();setTimeout(()=>inp.focus(),30);sfx()};
 const close=()=>bd.classList.remove('show');
 $('#cmdBtn').onclick=open;bd.onclick=close;
 inp.oninput=e=>draw(e.target.value);
 inp.onkeydown=e=>{if(e.key==='Enter'){const a=$('.cmdk-item.act',list);if(a)location.href=a.getAttribute('href')}};
 addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();bd.classList.contains('show')?close():open()}else if(e.key==='Escape')close()});
}

function initAccordion(){$$('.acc-h').forEach(h=>h.onclick=()=>{const a=h.parentElement,b=h.nextElementSibling,open=a.classList.toggle('open');b.style.maxHeight=open?b.scrollHeight+40+'px':0;sfx()})}
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
function initCounters(){$$('[data-count]').forEach(el=>{const end=+el.dataset.count;let v=0;const st=()=>{v+=Math.ceil(end/50);if(v>=end)v=end;el.textContent=v.toLocaleString()+(el.dataset.suf||'');if(v<end)requestAnimationFrame(st)};new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){st();o.disconnect()}}).observe(el)})}

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
function fillResult(tbody,labels){const p=qs();tbody.innerHTML='';Object.entries(labels).forEach(([k,l])=>{if(p[k]===undefined)return;const tr=document.createElement('tr');const a=document.createElement('td'),b=document.createElement('td');a.textContent=l;b.textContent=k.includes('pass')?'••••••••':p[k]||'—';tr.append(a,b);tbody.append(tr)})}
const ticket=p=>p+'-'+Date.now().toString(36).toUpperCase().slice(-6);

document.addEventListener('DOMContentLoaded',()=>{buildChrome();initAccordion();initSlider();initReveal();initCounters()});
