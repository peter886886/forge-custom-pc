/* FORGE — 3D builder logic with live FPS benchmarks, thermal telemetry & raycast inspection */
const ORDER = ['case', 'mb', 'cpu', 'cool', 'ram', 'gpu', 'ssd', 'psu', 'acc'];
const sel = {};
let exploded = false, spin = false, airflow = false, resMult = 1, allExpanded = false;

const pc = createPC($('#pcCanvas'), {
  dist: 13.5,
  lookOffset: [0.52, -0.30, -0.92],
  onPick(cat, part) {
    if (!part) return;
    const pill = $('#partInspector');
    if (Array.isArray(part)) {
      const names = part.map(x => x.name).join(', ');
      const cost = part.reduce((s, x) => s + (x.price || 0), 0);
      pill.innerHTML = `<b>${esc(CATS[cat] || cat)}:</b> ${esc(names)} (${money(cost)})`;
    } else {
      pill.innerHTML = `<b>${esc(CATS[cat] || cat)}:</b> ${esc(part.name)} (${part.watt ? part.watt + 'W' : money(part.price)})`;
    }
    pill.classList.add('show');
    sfx('install');
    const step = $(`.step[data-c="${cat}"]`);
    if (step) {
      if (!allExpanded) $$('.step').forEach(s => s.classList.remove('open'));
      step.classList.add('open');
      step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
});

function getAccList() {
  if (!sel.acc) return [];
  return Array.isArray(sel.acc) ? sel.acc : [sel.acc];
}
function allSelectedParts() {
  return Object.values(sel).flat().filter(Boolean);
}

function compat(p) {
  if (p.cat === 'cpu' && sel.mb && sel.mb.socket !== p.socket) return 'Needs ' + sel.mb.socket + ' socket';
  if (p.cat === 'mb' && sel.cpu && sel.cpu.socket !== p.socket) return 'Needs ' + sel.cpu.socket + ' CPU';
  return '';
}
const totalWatt = () => allSelectedParts().reduce((s, p) => s + (p.watt || 0), 0) + 50;
const totalPrice = () => allSelectedParts().reduce((s, p) => s + (p.price || 0), 0);

function render() {
  const accs = getAccList();
  $('#steps').innerHTML = ORDER.map((c, i) => {
    const p = sel[c];
    const isAcc = (c === 'acc');
    const hasPart = isAcc ? accs.length > 0 : !!p;
    const title = isAcc ? '9. Modding & Accessories (Multi-Select)' : `${i + 1}. ${CATS[c]}`;
    const statusText = isAcc
      ? (accs.length ? (accs.length === 1 ? esc(accs[0].name) + ' ✓' : `${accs.length} Mods Selected ✓`) : 'Optional (10 Available)')
      : (p ? esc(p.name) + ' ✓' : 'Select');

    const defaultNoneOpt = isAcc ? `
      <div class="opt ${!hasPart ? 'sel' : ''}" data-id="none" style="display:flex;align-items:center;gap:10px;padding:8px 12px;opacity:${!hasPart ? '1' : '.75'}">
        <div style="width:40px;height:40px;border-radius:6px;background:#121212;border:1px dashed rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.7rem;color:var(--mut);flex-shrink:0">STD</div>
        <span style="flex:1"><b>Standard Factory Config</b><br><small class="mut">Clear all optional add-ons</small></span>
        <b style="flex-shrink:0">$0</b>
      </div>` : '';

    return `<div class="step ${hasPart ? 'done' : ''} ${allExpanded ? 'open' : ''}" data-c="${c}">
      <div class="step-h">
        <span>${title}</span>
        <small style="color:${hasPart ? 'var(--ok)' : (isAcc ? 'var(--pri)' : 'var(--mut)')}">${statusText}</small>
      </div>
      <div class="opts">
        ${defaultNoneOpt}
        ${PARTS.filter(x => x.cat === c).map(x => {
          const bad = compat(x);
          const isSel = isAcc ? accs.some(a => a.id === x.id) : (p && p.id === x.id);
          return `<div class="opt ${isSel ? 'sel' : ''} ${bad ? 'no' : ''}" data-id="${x.id}" title="${esc(bad)}" style="display:flex;align-items:center;gap:10px">
            <img src="img/products/${x.id}.webp" style="width:40px;height:40px;object-fit:contain;background:#111111;border-radius:6px;padding:3px;border:1px solid var(--line);flex-shrink:0" alt="${esc(x.name)}" loading="lazy" decoding="async">
            <span style="flex:1">${esc(x.name)}<br><small class="mut">${esc(bad || x.spec)}</small></span>
            <b style="flex-shrink:0">${money(x.price)}</b>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  if (!allExpanded) {
    const open = ORDER.find(c => c !== 'acc' && !sel[c]);
    const el = $(`.step[data-c="${open || 'case'}"]`);
    if (open && el) el.classList.add('open');
  }

  $$('.step-h').forEach(h => h.onclick = () => h.parentElement.classList.toggle('open'));
  $$('.opt').forEach(o => o.onclick = () => {
    if (o.classList.contains('no')) {
      sfx('warn');
      return toast('Incompatible: ' + o.title);
    }
    const id = o.dataset.id;
    if (id === 'none') {
      delete sel.acc;
      pc.set('acc', null);
      sfx('install');
      render();
      toast('Accessories reset to standard factory');
    } else {
      pick(byId(id));
    }
  });

  updateQuickModUI();
  stats();
}

function pick(p, quiet) {
  if (!p) return;
  if (p.cat === 'acc') {
    const list = getAccList();
    const idx = list.findIndex(a => a.id === p.id);
    let removed = false;
    if (!quiet && idx >= 0) {
      list.splice(idx, 1);
      removed = true;
    } else if (idx < 0) {
      list.push(p);
    }
    if (list.length) sel.acc = list;
    else delete sel.acc;
    pc.set('acc', sel.acc || null, !quiet);
    if (!quiet) {
      sfx('install');
      render();
      toast(removed ? ('Removed ' + p.name) : (p.name + ' installed'));
    }
    return;
  }

  sel[p.cat] = p;
  pc.set(p.cat, p, !quiet);
  if (p.cat === 'case') pc.setCaseColor(caseCol || p.color);
  if (!quiet) {
    $$('[data-kit]').forEach(b => b.classList.remove('act'));
    sfx('install');
    render();
    toast(p.name + ' installed');
  }
}

function quickMod(id) {
  pick(byId(id));
}
window.quickMod = quickMod;

function updateQuickModUI() {
  const accs = getAccList();
  ['a1', 'a4', 'a2', 'a6'].forEach(id => {
    const btn = $('#quickAcc' + id.toUpperCase());
    if (btn) btn.classList.toggle('act', accs.some(a => a.id === id));
  });
}

function stats() {
  const accs = getAccList();
  const t = totalPrice(), w = totalWatt(), cap = sel.psu ? sel.psu.cap : 0;
  $('#tot').textContent = money(t);
  $('#watt').textContent = w + 'W';
  const wattBar = $('#wattBar');
  wattBar.style.width = Math.min(100, cap ? w / cap * 100 : w / 12) + '%';
  wattBar.style.background = (cap && w > cap * 0.9) ? 'var(--danger)' : (cap && w > cap * 0.75) ? 'var(--warn)' : 'var(--txt)';
  const perf = ((sel.gpu?.perf || 0) * 0.72 + (sel.cpu?.perf || 0) * 0.28);
  $('#perfBar').style.width = perf + '%';

  // Thermal & acoustic estimation
  const isAio = sel.cool?.type === 'aio';
  const hasContactFrame = accs.some(a => a.id === 'a8');
  const hasExtraFans = accs.some(a => a.id === 'a2' || a.id === 'a9');
  const temp = Math.round(46 + (w / 22) - (isAio ? 7 : 0) - (hasContactFrame ? 5 : 0) - (hasExtraFans ? 2 : 0));
  const noise = Math.round(24 + (w / 38) - (isAio ? 2 : 0) + (accs.some(a => a.id === 'a2') ? 2 : 0));
  $('#tempEst').textContent = temp + '°C';
  $('#noiseEst').textContent = noise + ' dBA';

  // Live FPS benchmarks
  if (sel.gpu && sel.cpu) {
    $('#fps1').textContent = Math.round((42 + perf * 1.15) * resMult) + ' FPS';
    $('#fps2').textContent = Math.round((38 + perf * 1.02) * resMult) + ' FPS';
    $('#fps3').textContent = Math.round((190 + perf * 3.6) * (resMult * 0.4 + 0.6)) + ' FPS';
  } else {
    $('#fps1').textContent = $('#fps2').textContent = $('#fps3').textContent = 'Select CPU+GPU';
  }

  // Core components check excludes 'acc' (it's optional modding)
  const miss = ORDER.filter(c => c !== 'acc' && !sel[c]).length;
  let warn = '';
  if (cap && w > cap * 0.9) {
    warn = 'PSU overloaded — choose ' + Math.ceil(w * 1.25 / 50) * 50 + 'W+';
  } else if (miss) {
    warn = miss + ' core component(s) remaining';
  } else {
    warn = '✓ Ready to Build ' + (accs.length ? `with ${accs.length} Mod(s)` : '(Standard Build)');
  }
  $('#warn').textContent = warn;
  $('#warn').classList.toggle('bad', !!(cap && w > cap * 0.9));
  $('#warn').style.color = cap && w > cap * 0.9 ? 'var(--danger)' : miss ? 'var(--mut)' : 'var(--ok)';

  // Real-time Compatibility & PSU Efficiency Telemetry Badges
  const sockEl = $('#compatSocket');
  if (sockEl) {
    sockEl.className = 'telemetry-pill';
    if (sel.cpu && sel.mb) {
      if (sel.cpu.socket === sel.mb.socket) {
        sockEl.classList.add('ok');
        sockEl.innerHTML = `Socket <b>${esc(sel.cpu.socket)} OK</b>`;
      } else {
        sockEl.classList.add('bad');
        sockEl.innerHTML = `Socket <b>Mismatch</b>`;
      }
    } else if (sel.cpu || sel.mb) {
      sockEl.classList.add('warn');
      sockEl.innerHTML = `Socket <b>${esc((sel.cpu || sel.mb).socket)} Pending</b>`;
    } else {
      sockEl.innerHTML = `Socket <b>Select CPU/MB</b>`;
    }
  }

  const clearEl = $('#compatClear');
  if (clearEl) {
    clearEl.className = 'telemetry-pill';
    if (sel.case && sel.gpu && sel.cool) {
      clearEl.classList.add('ok');
      clearEl.innerHTML = `Clearance <b>Verified</b>`;
    } else {
      clearEl.innerHTML = `Clearance <b>Checking…</b>`;
    }
  }

  const psuEl = $('#compatPsu');
  if (psuEl) {
    psuEl.className = 'telemetry-pill';
    if (cap > 0) {
      const pct = Math.round((w / cap) * 100);
      if (pct > 90) {
        psuEl.classList.add('bad');
        psuEl.innerHTML = `PSU <b>${pct}% Overload</b>`;
      } else if (pct > 75) {
        psuEl.classList.add('warn');
        psuEl.innerHTML = `PSU <b>${pct}% High Load</b>`;
      } else if (pct >= 45) {
        psuEl.classList.add('ok');
        psuEl.innerHTML = `PSU <b>${pct}% Optimal</b>`;
      } else {
        psuEl.classList.add('ok');
        psuEl.innerHTML = `PSU <b>${pct}% Quiet</b>`;
      }
    } else {
      psuEl.innerHTML = `PSU <b>Select Unit</b>`;
    }
  }
}

$$('#resTabs button').forEach(b => b.onclick = () => {
  $$('#resTabs button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  resMult = +b.dataset.m;
  stats();
});

// Colour pickers (Pure Carbon + Warm Metallic palette — zero cyan/purple cast)
const RGBS = ['#E5A93C', '#F5E6C8', '#10B981', '#FF7A17', '#F59E0B', '#FFFFFF'], CASES = ['#161615', '#e8e8e6', '#1c1917', '#242422', '#1f2922'];
let caseCol = null;
const initHex = (typeof getTheme === 'function' ? getTheme().hex : '#E5A93C').toUpperCase();
$('#rgbSw').innerHTML = RGBS.map(c => `<button style="background:${c};color:${c}" data-c="${c}" class="${c.toUpperCase() === initHex ? 'on' : ''}" aria-label="RGB ${c}"></button>`).join('');
$('#caseSw').innerHTML = CASES.map(c => `<button style="background:${c};color:${c}" data-c="${c}" aria-label="Case ${c}"></button>`).join('');
$$('#rgbSw button').forEach(b => b.onclick = () => {
  $$('#rgbSw button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  pc.setRGB(b.dataset.c);
});
window.addEventListener('forge-theme', e => {
  if (!e.detail || !e.detail.hex) return;
  const h = e.detail.hex.toUpperCase();
  $$('#rgbSw button').forEach(b => b.classList.toggle('on', b.dataset.c.toUpperCase() === h));
});
$$('#caseSw button').forEach(b => b.onclick = () => {
  $$('#caseSw button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  caseCol = b.dataset.c;
  pc.setCaseColor(caseCol);
});

// Stage tools
$('#bExplode').onclick = e => {
  exploded = !exploded;
  pc.explode(exploded);
  e.currentTarget.classList.toggle('solid', exploded);
};
$('#bAirflow').onclick = e => {
  airflow = !airflow;
  pc.setAirflow(airflow);
  e.currentTarget.classList.toggle('solid', airflow);
  toast(airflow ? 'Thermal airflow simulation ON' : 'Airflow simulation OFF');
};
$('#bGlass').onclick = e => {
  pc.setGlass(!pc.glass);
  e.currentTarget.classList.toggle('solid', !pc.glass);
};
$('#bSpin').onclick = e => {
  spin = !spin;
  pc.setAuto(spin);
  e.currentTarget.classList.toggle('solid', spin);
};
$('#bReset').onclick = () => {
  pc.resetView();
  exploded = false;
  pc.explode(false);
  $('#bExplode').classList.remove('solid');
};
$('#bShot').onclick = () => {
  const u = pc.snapshot();
  $('#shotImg').src = u;
  $('#shotDl').href = u;
  $('#shotModal').classList.add('show');
};

function currentPartIds() {
  const ids = [];
  ORDER.forEach(c => {
    if (!sel[c]) return;
    if (Array.isArray(sel[c])) sel[c].forEach(x => ids.push(x.id));
    else ids.push(sel[c].id);
  });
  return ids;
}

function buildShareUrl() {
  const ids = currentPartIds();
  const base = location.href.split('?')[0].split('#')[0];
  return ids.length ? `${base}?parts=${ids.join(',')}` : base;
}

const bShareBtn = $('#bShare');
if (bShareBtn) {
  bShareBtn.onclick = () => {
    const ids = currentPartIds();
    if (!ids.length) {
      sfx('warn');
      return toast('Select components before sharing a build');
    }
    const shareUrl = buildShareUrl();
    try { history.replaceState(null, '', `?parts=${ids.join(',')}`); } catch (e) {}
    const copyFallback = () => {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(copyFallback);
    } else {
      copyFallback();
    }
    sfx('install');
    toast(`Shareable build URL copied (${ids.length} parts)`);
  };
}

function renderPrintSpecSheet() {
  const sheet = $('#printSpecSheet');
  if (!sheet) return;
  const parts = allSelectedParts();
  const w = totalWatt();
  const cap = sel.psu ? sel.psu.cap : 0;
  const pct = cap ? Math.round((w / cap) * 100) : 0;
  const sub = totalPrice();
  const rowsHtml = parts.map(p => `
    <tr>
      <td>${esc(CATS[p.cat] || p.cat)}</td>
      <td><b>${esc(p.name)}</b></td>
      <td>${esc(p.spec)}</td>
      <td style="font-family:var(--mono)">${p.watt ? p.watt + 'W' : (p.cap ? p.cap + 'W Cap' : '—')}</td>
      <td style="font-family:var(--mono);text-align:right">${money(p.price)}</td>
    </tr>`).join('');
  sheet.innerHTML = `
    <div style="padding-bottom:12px;margin-bottom:16px;border-bottom:2px solid #111111;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h2 style="margin:0;font-size:18pt;letter-spacing:0.08em">FORGE CUSTOM PC LTD.</h2>
        <p style="font-size:9.5pt;margin-top:4px">Custom 3D Build Specification &amp; Lab Telemetry Sheet</p>
        <p style="font-size:8.5pt;color:#52525B">Showroom: Shop 12, 3/F, Sino Centre, Mong Kok · Lab: Unit 804, Kwun Tong Industrial Centre</p>
      </div>
      <div style="text-align:right;font-family:monospace;font-size:9pt">
        <b>SPECIFICATION SHEET</b><br>
        Generated: ${new Date().toISOString().slice(0, 10)}<br>
        Parts: ${parts.length} modules
      </div>
    </div>
    <div class="tblwrap" style="margin-bottom:16px">
      <table>
        <thead><tr><th scope="col">Category</th><th scope="col">Component</th><th scope="col">Specification</th><th scope="col">Power</th><th scope="col" style="text-align:right">Price (USD)</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div class="g2" style="gap:16px;align-items:start">
      <div class="card" style="padding:12px">
        <p style="font-weight:600;margin-bottom:6px">Compatibility &amp; Telemetry</p>
        <p style="font-size:9.5pt">Socket: ${esc(sel.cpu?.socket || sel.mb?.socket || '—')} · Est. Load: ${w}W${cap ? ` / ${cap}W (${pct}%)` : ''}</p>
        <p style="font-size:9.5pt">Thermal Est.: ${esc($('#tempEst').textContent)} · Acoustic Floor: ${esc($('#noiseEst').textContent)}</p>
        <p style="font-size:9.5pt">Est. FPS: Cyberpunk ${esc($('#fps1').textContent)} · Wukong ${esc($('#fps2').textContent)} · Valorant ${esc($('#fps3').textContent)}</p>
      </div>
      <div class="card" style="padding:12px">
        <p style="font-weight:600;margin-bottom:6px">Estimated Pricing (USD)</p>
        <p style="font-size:9.5pt">Components Subtotal: <b>${money(sub)}</b></p>
        <p style="font-size:9.5pt">Single-Tech Assembly &amp; 24h OCCT Burn-In: <b>$99</b></p>
        <p style="font-size:11pt;margin-top:6px">Estimated Build Total: <b>${money(sub + 99)} USD</b></p>
      </div>
    </div>
    <p style="font-size:8pt;color:#52525B;margin-top:12px;word-break:break-all">Share URL: ${esc(buildShareUrl())}</p>`;
}

const bPrintBtn = $('#bPrint');
if (bPrintBtn) {
  bPrintBtn.onclick = () => {
    renderPrintSpecSheet();
    window.print();
  };
}

// Expand All / Collapse All Toggle
const toggleBtn = $('#toggleAll');
if (toggleBtn) {
  toggleBtn.onclick = () => {
    allExpanded = !allExpanded;
    toggleBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
    $$('.step').forEach(s => s.classList.toggle('open', allExpanded));
  };
}

function loadKit(id) {
  const k = byId(id);
  if (!k) return;
  ORDER.forEach(c => { delete sel[c]; pc.set(c, null); });
  caseCol = null;
  $$('#caseSw button').forEach(x => x.classList.remove('on'));
  $$('[data-kit]').forEach(b => b.classList.toggle('act', b.dataset.kit === id));
  k.parts.forEach(pid => pick(byId(pid), true));
  render();
  sfx('install');
  toast(k.name + ' loaded in 3D');
  const pill = $('#partInspector');
  pill.innerHTML = `<b>${esc(k.name)}</b>`;
  pill.classList.add('show');
}
$$('[data-kit]').forEach(b => b.onclick = () => loadKit(b.dataset.kit));
$('#clear').onclick = () => {
  ORDER.forEach(c => { delete sel[c]; pc.set(c, null); });
  caseCol = null;
  $$('#caseSw button').forEach(x => x.classList.remove('on'));
  $$('[data-kit]').forEach(b => b.classList.remove('act'));
  const pill = $('#partInspector');
  if (pill) pill.classList.remove('show');
  pick(byId('x1'), true);
  render();
};

function pack() {
  const items = [];
  ORDER.forEach(c => {
    if (!sel[c]) return;
    if (Array.isArray(sel[c])) sel[c].forEach(x => items.push(x.id));
    else items.push(sel[c].id);
  });
  return {
    items,
    img: pc.snapshot(),
    total: totalPrice()
  };
}
$('#bSave').onclick = () => {
  const b = JSON.parse(localStorage.getItem('forgeBuilds') || '[]');
  const p = pack();
  p.date = new Date().toLocaleDateString();
  b.unshift(p);
  localStorage.setItem('forgeBuilds', JSON.stringify(b.slice(0, 6)));
  sfx('install');
  toast('Build saved to your Member Dashboard');
};
function validateReadyBuild() {
  const miss = ORDER.filter(c => c !== 'acc' && !sel[c]);
  if (miss.length) {
    sfx('warn');
    toast('Please choose: ' + miss.map(c => CATS[c]).join(', '));
    return false;
  }
  if (sel.psu.cap < totalWatt() * 0.9) {
    sfx('warn');
    toast('Your PSU wattage is too low for this build');
    return false;
  }
  return true;
}

const bAddCartBtn = $('#bAddCart');
if (bAddCartBtn) {
  bAddCartBtn.onclick = () => {
    if (!validateReadyBuild() || typeof forgeCart === 'undefined') return;
    const p = pack();
    const cpuShort = sel.cpu ? sel.cpu.name.replace('Intel Core ', '').replace('AMD ', '') : 'Custom CPU';
    const gpuShort = sel.gpu ? sel.gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '') : 'Custom GPU';
    const caseName = sel.case ? sel.case.name : 'Custom Chassis';
    forgeCart.addToCart({
      type: 'build',
      id: 'custom-' + Date.now().toString(36),
      name: `Custom 3D Build (${cpuShort} · ${gpuShort})`,
      spec: `${p.items.length} parts · ${caseName} · +$99 Lab Assembly`,
      price: p.total,
      qty: 1,
      asm: 99,
      img: p.img || 'img/renders/hero_rig_studio.webp',
      items: p.items
    });
  };
}

$('#bBuy').onclick = () => {
  if (!validateReadyBuild()) return;
  pc.resetView();
  setTimeout(() => {
    localStorage.setItem('forgeOrder', JSON.stringify(pack()));
    location.href = 'order-confirm.html?src=builder';
  }, 120);
};
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = $('#shotModal');
    if (m && m.classList.contains('show')) m.classList.remove('show');
  }
});

const q = qs();
if (q.parts) {
  const partIds = String(q.parts).split(',').map(s => s.trim()).filter(Boolean);
  const validParts = partIds.map(byId).filter(p => p && !p.parts);
  if (validParts.length) {
    ORDER.forEach(c => { delete sel[c]; pc.set(c, null); });
    validParts.forEach(p => pick(p, true));
    render();
    toast(`Shared 3D build loaded (${validParts.length} parts)`);
  } else {
    loadKit('pb2');
  }
} else if (q.edit === '1') {
  let customIds = null;
  try { customIds = JSON.parse(localStorage.getItem('forgeEditBuild') || 'null'); } catch (e) {}
  if (Array.isArray(customIds) && customIds.length) {
    ORDER.forEach(c => { delete sel[c]; pc.set(c, null); });
    customIds.forEach(pid => pick(byId(pid), true));
    render();
    toast('Custom build loaded from shopping bag');
  } else {
    loadKit('pb2');
  }
} else if (q.kit) loadKit(q.kit);
else if (q.add) {
  pick(byId('x1'), true);
  pick(byId(q.add), true);
  render();
} else {
  loadKit('pb2');
}
