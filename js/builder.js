/* FORGE — 3D builder logic with live FPS benchmarks, thermal telemetry & raycast inspection */
const ORDER = ['case', 'mb', 'cpu', 'cool', 'ram', 'gpu', 'ssd', 'psu', 'acc'];
const sel = {};
let exploded = false, spin = false, airflow = false, resMult = 1, allExpanded = false;

const pc = createPC($('#pcCanvas'), {
  dist: 13,
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
          return `<div class="opt ${isSel ? 'sel' : ''} ${bad ? 'no' : ''}" data-id="${x.id}" title="${bad}" style="display:flex;align-items:center;gap:10px">
            <img src="img/products/${x.id}.png" style="width:40px;height:40px;object-fit:contain;background:#111111;border-radius:6px;padding:3px;border:1px solid var(--line);flex-shrink:0" alt="${esc(x.name)}">
            <span style="flex:1">${esc(x.name)}<br><small class="mut">${bad || x.spec}</small></span>
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
      return toast('⚠ ' + o.title);
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
    if (btn) {
    const active = accs.some(a => a.id === id);
    if (btn) {
      btn.classList.toggle('act', active);
    }
    }
  });
}

function stats() {
  const accs = getAccList();
  const t = totalPrice(), w = totalWatt(), cap = sel.psu ? sel.psu.cap : 0;
  $('#tot').textContent = money(t);
  $('#watt').textContent = w + 'W';
  $('#wattBar').style.width = Math.min(100, cap ? w / cap * 100 : w / 12) + '%';
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
    warn = '⚠ PSU overloaded — choose ' + Math.ceil(w * 1.25 / 50) * 50 + 'W+';
  } else if (miss) {
    warn = miss + ' core component(s) remaining';
  } else {
    warn = '✓ Ready to Build ' + (accs.length ? `with ${accs.length} Mod(s)` : '(Standard Build)');
  }
  $('#warn').textContent = warn;
  $('#warn').style.color = cap && w > cap * 0.9 ? 'var(--danger)' : miss ? 'var(--mut)' : 'var(--ok)';
}

$$('#resTabs button').forEach(b => b.onclick = () => {
  $$('#resTabs button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  resMult = +b.dataset.m;
  stats();
});

// Colour pickers (Bespoke Champagne Gold default)
const RGBS = ['#E5A93C', '#38BDF8', '#10B981', '#FF7A17', '#F59E0B', '#FFFFFF'], CASES = ['#161615', '#e8ebf0', '#1c1917', '#242422', '#1f2922'];
let caseCol = null;
$('#rgbSw').innerHTML = RGBS.map((c, i) => `<button style="background:${c};color:${c}" data-c="${c}" class="${i ? '' : 'on'}" aria-label="RGB ${c}"></button>`).join('');
$('#caseSw').innerHTML = CASES.map(c => `<button style="background:${c};color:${c}" data-c="${c}" aria-label="Case ${c}"></button>`).join('');
$$('#rgbSw button').forEach(b => b.onclick = () => {
  $$('#rgbSw button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  pc.setRGB(b.dataset.c);
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
$('#bBuy').onclick = () => {
  const miss = ORDER.filter(c => c !== 'acc' && !sel[c]);
  if (miss.length) {
    sfx('warn');
    return toast('Please choose: ' + miss.map(c => CATS[c]).join(', '));
  }
  if (sel.psu.cap < totalWatt() * 0.9) {
    sfx('warn');
    return toast('⚠ Your PSU is too weak');
  }
  pc.resetView();
  setTimeout(() => {
    localStorage.setItem('forgeOrder', JSON.stringify(pack()));
    location.href = 'order-confirm.html?src=builder';
  }, 120);
};

const q = qs();
if (q.kit) loadKit(q.kit);
else if (q.add) {
  pick(byId('x1'), true);
  pick(byId(q.add), true);
  render();
} else {
  loadKit('pb2');
}
