// FORGE 3D Engine (Three.js r128) — Precision Collision-Free CAD Assembly & Per-Model PBR Generator
(function(){

// High-DPI Procedural Texture Helpers
function makeBrushedMetalTex(baseHex, streakRgb, width=256, height=256){
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex; ctx.fillRect(0,0,width,height);
  for(let i=0;i<1200;i++){
    ctx.fillStyle = `rgba(${streakRgb},${(Math.random()*0.06).toFixed(3)})`;
    ctx.fillRect(0, Math.random()*height, width, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeCarbonPerfTex(){
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#161615'; ctx.fillRect(0,0,128,128);
  ctx.fillStyle = '#070a10';
  for(let y=4;y<128;y+=12){
    for(let x=4;x<128;x+=12){
      ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2); ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8,8);
  return t;
}

// Dynamic Label / HUD Canvas Texture Generator for Specific Models
function makeLabelTex(opts){
  const W = opts.w || 512, H = opts.h || 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = opts.bg || '#121211';
  ctx.fillRect(0, 0, W, H);

  if(opts.grid){
    ctx.strokeStyle = opts.gridColor || 'rgba(56,189,248,0.12)';
    ctx.lineWidth = 1;
    for(let x=0;x<W;x+=32){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }
  if(opts.border){
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = opts.borderW || 4;
    ctx.strokeRect(6, 6, W-12, H-12);
  }
  if(opts.stripe){
    ctx.fillStyle = opts.stripe;
    ctx.fillRect(0, H - 18, W, 18);
  }
  if(opts.tag){
    ctx.fillStyle = opts.tagColor || '#38bdf8';
    ctx.font = `bold ${Math.round(H*0.09)}px monospace`;
    ctx.fillText(opts.tag, 22, Math.round(H*0.22));
  }
  if(opts.title){
    ctx.fillStyle = opts.titleColor || '#f8fafc';
    ctx.font = `bold ${opts.titleSize || Math.round(H*0.20)}px sans-serif`;
    ctx.fillText(opts.title, 22, Math.round(H*0.54));
  }
  if(opts.sub){
    ctx.fillStyle = opts.subColor || '#94a3b8';
    ctx.font = `bold ${opts.subSize || Math.round(H*0.11)}px monospace`;
    ctx.fillText(opts.sub, 22, Math.round(H*0.78));
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

// Live Sensor Panel Texture (used by a6 Sensor Panel, x4 Hyte Touch Screen, and AIO LCDs)
function makeTelemetryScreenTex(mode, labelText){
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0,0,512,320);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for(let x=0;x<512;x+=32){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,320); ctx.stroke(); }
  for(let y=0;y<320;y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(512,y); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
  ctx.strokeRect(8,8,496,304);

  ctx.fillStyle = '#141414'; ctx.fillRect(18,18,476,40);
  ctx.fillStyle = '#F5F5F5'; ctx.font = '600 16px monospace';
  ctx.fillText(labelText || 'FORGE SYSTEM MONITOR', 28, 44);

  // CPU & GPU Gauges
  const drawGauge = (cx, cy, r, val, unit, sub, col) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI*0.75, Math.PI*2.25);
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 9; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI*0.75, Math.PI*1.95);
    ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.stroke();
    ctx.fillStyle = '#F5F5F5'; ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(val + unit, cx, cy + 6);
    ctx.fillStyle = '#A1A1AA'; ctx.font = '600 12px monospace';
    ctx.fillText(sub, cx, cy + 28);
    ctx.textAlign = 'left';
  };
  drawGauge(105, 145, 52, '52', '°C', 'CPU 5.7GHz', '#E5A93C');
  drawGauge(255, 145, 52, '61', '°C', 'GPU 98%', '#10B981');

  ctx.fillStyle = '#F5F5F5'; ctx.font = 'bold 28px monospace';
  ctx.fillText('240 FPS', 345, 125);
  ctx.fillStyle = '#10B981'; ctx.font = 'bold 14px monospace';
  ctx.fillText('1% LOW  212', 345, 152);
  ctx.fillStyle = '#8E8E93'; ctx.font = '13px monospace';
  ctx.fillText('COOLANT 31.2C', 345, 178);

  // Frametime wave
  ctx.strokeStyle = '#E5A93C'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for(let i=0;i<36;i++){
    const px = 28 + i*13;
    const py = 268 - Math.sin(i*0.5)*12 - (i%4)*2.5;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();
  ctx.fillStyle = '#71717A'; ctx.font = '12px monospace';
  ctx.fillText('FRAMETIME 4.1 ms · STABLE', 28, 296);

  return new THREE.CanvasTexture(c);
}

// ============================================================================
// 1. FULL PC CONFIGURATOR & SHOWCASE ENGINE (createPC) — ZERO CLIPPING
// ============================================================================
function createPC(canvas, opts){
  opts = opts || {};
  const W = canvas.clientWidth || 600, H = canvas.clientHeight || 520;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true});
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, W/H, 0.1, 100);

  // Studio 5-Point Bespoke Luxury Lighting (Warm Titanium & Molten Champagne Gold default)
  const initHex = (opts && opts.rgb) ? opts.rgb : ((typeof getTheme === 'function' && getTheme().hex) ? getTheme().hex : 0xe5a93c);
  const initCol = new THREE.Color(initHex);

  const amb = new THREE.AmbientLight(0xf3f4f6, 0.84); scene.add(amb);
  const hemi = new THREE.HemisphereLight(0xfef3c7, 0x090b10, 0.74); scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfffbeb, 1.72);
  key.position.set(6, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048; key.shadow.mapSize.height = 2048;
  key.shadow.bias = -0.0005;
  scene.add(key);

  const rim = new THREE.DirectionalLight(initCol, 1.05);
  rim.position.set(-7, 5, -6); scene.add(rim);

  const fill = new THREE.DirectionalLight(0x38bdf8, 0.42);
  fill.position.set(5, -4, 6); scene.add(fill);

  const rgbLight = new THREE.PointLight(initCol, 2.3, 8.5);
  rgbLight.position.set(0.1, 0.5, 0.2); scene.add(rgbLight);

  const rgbLight2 = new THREE.PointLight(initCol, 1.45, 7.5);
  rgbLight2.position.set(-0.2, -0.7, 0.5); scene.add(rgbLight2);

  // Shadow-receiving studio reflection floor
  const floorGeo = new THREE.PlaneGeometry(26, 26);
  const floorMat = new THREE.MeshStandardMaterial({color:0x070709, roughness:0.22, metalness:0.80, transparent:true, opacity:0.58});
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2; floor.position.y = -2.55; floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(16, 32, initCol, 0x1c1f2b);
  grid.position.y = -2.54; grid.material.opacity = 0.22; grid.material.transparent = true;
  scene.add(grid);

  const root = new THREE.Group();
  scene.add(root);

  const metalTex = makeBrushedMetalTex('#171922', '255,248,230');
  const lightMetalTex = makeBrushedMetalTex('#e5e7eb', '30,41,59');
  const perfTex = makeCarbonPerfTex();

  const M = {
    caseBody: new THREE.MeshStandardMaterial({color:0x141720, map:metalTex, metalness:0.88, roughness:0.24}),
    caseInterior: new THREE.MeshStandardMaterial({color:0x0b0d13, map:perfTex, metalness:0.80, roughness:0.36}),
    glass: new THREE.MeshPhysicalMaterial({color:0xfef3c7, transparent:true, opacity:0.15, roughness:0.04, metalness:0.1, transmission:0.84, reflectiveness:0.92}),
    glassEdge: new THREE.MeshStandardMaterial({color:initCol, transparent:true, opacity:0.34, roughness:0.1}),
    pcb: new THREE.MeshStandardMaterial({color:0x0d1017, metalness:0.48, roughness:0.50}),
    pcbWhite: new THREE.MeshStandardMaterial({color:0xe2e8f0, metalness:0.35, roughness:0.42}),
    vrm: new THREE.MeshStandardMaterial({color:0x262936, map:metalTex, metalness:0.90, roughness:0.20}),
    vrmSilver: new THREE.MeshStandardMaterial({color:0xd1d5db, map:lightMetalTex, metalness:0.88, roughness:0.20}),
    vrmGold: new THREE.MeshStandardMaterial({color:0xe5a93c, metalness:0.92, roughness:0.18}),
    copper: new THREE.MeshStandardMaterial({color:0xd97742, metalness:0.92, roughness:0.18}),
    gold: new THREE.MeshStandardMaterial({color:0xe5a93c, metalness:0.95, roughness:0.15}),
    chrome: new THREE.MeshStandardMaterial({color:0xf8fafc, metalness:0.96, roughness:0.10}),
    darkMetal: new THREE.MeshStandardMaterial({color:0x191c26, map:metalTex, metalness:0.88, roughness:0.26}),
    whiteMetal: new THREE.MeshStandardMaterial({color:0xf1f5f9, map:lightMetalTex, metalness:0.65, roughness:0.28}),
    walnutWood: new THREE.MeshStandardMaterial({color:0x6b4423, metalness:0.12, roughness:0.68}),
    rgb: new THREE.MeshStandardMaterial({color:initCol, emissive:initCol, emissiveIntensity:1.85, roughness:0.15}),
    rgb2: new THREE.MeshStandardMaterial({color:initCol, emissive:initCol, emissiveIntensity:1.40, roughness:0.2}),
    screen: new THREE.MeshBasicMaterial({color:initCol})
  };
  const rgbMats = [M.rgb, M.rgb2];

  const groups = {};
  ['case','mb','cpu','cool','ram','gpu','ssd','psu','acc'].forEach(k=>{
    const g = new THREE.Group(); g.name = k; root.add(g); groups[k] = g;
  });

  const HOME = {
    case:[0,0,0], mb:[0,0,0], cpu:[0,0,0], cool:[0,0,0],
    ram:[0,0,0], gpu:[0,0,0], ssd:[0,0,0], psu:[0,0,0], acc:[0,0,0]
  };
  const EXP = {
    case:[0,0,0], mb:[-0.95,0,0], cpu:[-0.45,0.42,0.42], cool:[0.65,0.95,0.65],
    ram:[0.85,0.35,0.55], gpu:[1.35,-0.15,0.95], ssd:[0.45,-0.25,0.65], psu:[-0.65,-1.05,-0.45], acc:[1.15,-0.45,1.05]
  };

  function makeFan(radius, depth, hasRGB, bladeColor){
    const fg = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(radius*2.08, radius*2.08, depth), M.darkMetal);
    fg.add(frame);
    const ringMat = hasRGB ? M.rgb : M.vrm;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius*0.92, depth*0.18, 12, 32), ringMat);
    ring.position.z = depth*0.42; fg.add(ring);
    const blades = new THREE.Group();
    const bMat = bladeColor ? new THREE.MeshStandardMaterial({color:bladeColor, metalness:0.4, roughness:0.4}) : (hasRGB ? M.rgb2 : M.vrm);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.32, radius*0.32, depth*0.85, 20), M.chrome);
    hub.rotation.x = Math.PI/2; blades.add(hub);
    for(let i=0;i<9;i++){
      const b = new THREE.Mesh(new THREE.BoxGeometry(radius*0.56, depth*0.14, radius*0.20), bMat);
      const a = (i/9)*Math.PI*2;
      b.position.set(Math.cos(a)*radius*0.56, Math.sin(a)*radius*0.56, 0);
      b.rotation.z = a + 0.42; b.rotation.y = 0.36;
      blades.add(b);
    }
    fg.add(blades);
    fg.userData.blades = blades;
    return fg;
  }

  function makeBraidedCable(pts, radius, count, isCustomSleeve){
    const cg = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(pts);
    const cMat = isCustomSleeve ? M.rgb2 : M.darkMetal;
    for(let i=0;i<count;i++){
      const off = (i - (count-1)/2) * (radius*2.15);
      const subPts = pts.map(p => new THREE.Vector3(p.x, p.y + off*0.25, p.z + off));
      const c2 = new THREE.CatmullRomCurve3(subPts);
      const geo = new THREE.TubeGeometry(c2, 20, radius, 8, false);
      cg.add(new THREE.Mesh(geo, (isCustomSleeve && i%2===0) ? M.rgb : cMat));
    }
    if(isCustomSleeve){
      [0.32, 0.65].forEach(t => {
        const pt = curve.getPoint(t);
        const comb = new THREE.Mesh(new THREE.BoxGeometry(radius*4.5, radius*3.2, count*radius*2.5), M.chrome);
        comb.position.copy(pt);
        cg.add(comb);
      });
    }
    return cg;
  }

  const spinFans = [];

  // 1. CHASSIS BUILDER (adapts to x1..x5)
  function buildCase(casePart){
    const g = groups.case;
    while(g.children.length) g.remove(g.children[0]);
    const cid = (casePart && casePart.id) || 'x1';

    // Adjust case color by selected case model unless overridden
    if(cid === 'x2') M.caseBody.color.setHex(0xe2e8f0);
    else if(cid === 'x3') M.caseBody.color.setHex(0x1c1917);
    else if(cid === 'x5') M.caseBody.color.setHex(0x1e293b);
    else M.caseBody.color.setHex(0x141923);

    const addBox = (w,h,d,x,y,z,mat)=>{
      const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||M.caseBody);
      m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
    };
    addBox(2.35, 0.12, 4.45, 0, -2.30, 0); // Bottom plate
    addBox(2.35, 0.12, 4.45, 0,  2.30, 0); // Top plate
    addBox(2.35, 4.48, 0.10, 0,  0, -2.18); // Rear wall
    addBox(0.08, 4.45, 4.25, -1.04, 0, 0, M.caseInterior); // Motherboard tray

    // Rubber cable routing grommets on MB tray (x = -1.00, z = 1.45)
    addBox(0.11, 0.85, 0.34, -1.00, 1.05, 1.48, M.darkMetal);
    addBox(0.11, 0.85, 0.34, -1.00, -0.15, 1.48, M.darkMetal);

    // PSU Shroud (solid lower chamber with top cable pass-through grommet at z=1.38)
    addBox(2.22, 0.86, 4.30, 0, -1.82, 0, M.caseInterior);
    addBox(2.24, 0.04, 4.32, 0, -1.38, 0, M.vrm);
    addBox(2.25, 0.035, 0.02, 0, -1.37, 2.16, M.rgb); // Shroud ARGB trim line

    // Case-specific front panel design!
    if(cid === 'x3'){
      // Fractal Design North XL: 9 Real American Walnut Vertical Slats + Brass Top Accent!
      addBox(2.35, 0.18, 0.14, 0, 2.22, 2.18, M.vrmGold);
      for(let i=-4;i<=4;i++){
        addBox(0.16, 4.32, 0.12, i*0.24, -0.04, 2.20, M.walnutWood);
      }
    } else if(cid === 'x4'){
      // Hyte Y70 Touch Infinite: Chamfered Corner + 14.5" Vertical Corner Touchscreen!
      const screenTex = makeTelemetryScreenTex('y70', 'HYTE Y70 // 2.5K TOUCH');
      const touchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.85, 0.06), new THREE.MeshBasicMaterial({map:screenTex}));
      touchMesh.position.set(0.88, 0.15, 1.98);
      touchMesh.rotation.y = -Math.PI/4;
      g.add(touchMesh);
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.65, 4.42, 0.05), M.glass);
      frontGlass.position.set(-0.22, 0, 2.18); g.add(frontGlass);
    } else if(cid === 'x2'){
      // NZXT H7 Flow White: Perforated High-Airflow Front Mesh + 3 Front Intake Fans
      addBox(2.28, 4.40, 0.08, 0, 0, 2.18, M.whiteMetal);
      addBox(1.85, 3.90, 0.09, 0, 0.1, 2.19, M.caseInterior);
    } else {
      // x1 Lian Li O11 Vision Compact / x5 Phanteks NV9: Seamless Panoramic Front Tempered Glass
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.25, 4.44, 0.06), M.glass);
      frontGlass.position.set(0, 0, 2.18); g.add(frontGlass);
      if(cid === 'x5'){
        addBox(2.36, 0.05, 4.46, 0, 2.22, 0, M.rgb);
      }
    }

    // Tempered Glass Side Panel (hinged slightly open look or flush at x = 1.15)
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4.42, 4.32), M.glass);
    sideGlass.position.set(1.15, 0, 0); sideGlass.name = 'sideGlass'; g.add(sideGlass);
    const sideEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.44, 0.04), M.glassEdge);
    sideEdge.position.set(1.15, 0, 2.16); sideEdge.name = 'sideGlassEdge'; g.add(sideEdge);

    // 4 Machined Billet Feet
    [[-0.9,-2.44,-1.8],[0.9,-2.44,-1.8],[-0.9,-2.44,1.8],[0.9,-2.44,1.8]].forEach(p=>{
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.16, 20), M.chrome);
      foot.position.set(p[0],p[1],p[2]); g.add(foot);
    });

    // Rear 120mm Exhaust Fan at (0, 1.05, -2.10)
    const rFan = makeFan(0.52, 0.14, true);
    rFan.position.set(0, 1.05, -2.10); g.add(rFan); spinFans.push(rFan);
  }

  // 2. COMPONENT BUILDER — ZERO CLIPPING & PER-MODEL CUSTOMIZATION
  function clearAndBuild(build){
    spinFans.length = 0;
    buildCase(build.case);
    ['mb','cpu','cool','ram','gpu','ssd','psu','acc'].forEach(k=>{
      const g = groups[k];
      while(g.children.length) g.remove(g.children[0]);
    });

    const hasCustomCables = build.acc && (Array.isArray(build.acc) ? build.acc.some(a=>a && a.id==='a1') : build.acc.id==='a1');

    // MOTHERBOARD (m1..m6)
    if(build.mb){
      const g = groups.mb;
      const mid = build.mb.id || 'm1';
      const isWhite = (mid === 'm4');
      const isGold = (mid === 'm6');
      const pcbMat = isWhite ? M.pcbWhite : M.pcb;
      const sinkMat = isWhite ? M.vrmSilver : (isGold ? M.vrmGold : M.vrm);

      const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.85, 2.45), pcbMat);
      board.position.set(-0.96, 0.45, -0.15); board.castShadow = true; g.add(board);

      // VRM Heatsinks
      const vrm1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.15, 0.38), sinkMat);
      vrm1.position.set(-0.86, 1.25, -1.12); g.add(vrm1);
      const vrm2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 1.15), sinkMat);
      vrm2.position.set(-0.86, 1.72, -0.45); g.add(vrm2);

      // ROG / AORUS / ProArt VRM Display Badge
      const vrmLogo = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.30), isGold ? M.gold : M.rgb);
      vrmLogo.position.set(-0.84, 1.35, -1.12); g.add(vrmLogo);

      // Chipset Heatsink + M.2 Armor Plates
      const pch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.72), sinkMat);
      pch.position.set(-0.89, -0.35, 0.45); g.add(pch);

      // Steel-Reinforced PCIe 5.0 x16 Slots
      [-0.12, -0.62].forEach(yPos=>{
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 1.18), M.chrome);
        slot.position.set(-0.90, yPos, -0.32); g.add(slot);
      });

      // 24-Pin ATX Cable — Routed cleanly from right edge of MB (x=-0.90, y=1.12, z=1.06) into MB tray grommet (x=-1.04, y=1.12, z=1.48)
      // Completely clear of the GPU!
      const mbCable = makeBraidedCable([
        new THREE.Vector3(-0.90, 1.12, 1.06),
        new THREE.Vector3(-0.74, 1.12, 1.28),
        new THREE.Vector3(-1.04, 1.12, 1.48)
      ], 0.018, 8, hasCustomCables);
      g.add(mbCable);
    }

    // CPU (c1..c6)
    if(build.cpu){
      const g = groups.cpu;
      const isAMD = (build.cpu.socket === 'AM5');
      const sub = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.56), new THREE.MeshStandardMaterial({color: isAMD ? 0x115e59 : 0x1e3a5f, metalness:0.5, roughness:0.4}));
      sub.position.set(-0.90, 1.25, -0.50); g.add(sub);
      const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.09, isAMD ? 0.46 : 0.52, isAMD ? 0.46 : 0.38), M.chrome);
      ihs.position.set(-0.86, 1.25, -0.50); g.add(ihs);
    }

    // COOLER (k1..k5) — ZERO RAM CLIPPING!
    if(build.cool){
      const g = groups.cool;
      const kid = build.cool.id || 'k2';
      if(build.cool.type === 'air'){
        // Air Cooler Dual Towers placed over CPU socket (z = -0.96 to -0.04), completely clear of RAM (z >= 0.14)!
        const finMat = (kid === 'k1') ? M.darkMetal : M.vrmSilver;
        const bladeCol = (kid === 'k1') ? 0x1f242d : null;
        [-0.78, -0.28].forEach(zOff => {
          const stack = new THREE.Group();
          for(let i=0;i<16;i++){
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.018, 0.36), finMat);
            fin.position.set(-0.42, 0.90 + i*0.044, zOff);
            stack.add(fin);
          }
          g.add(stack);
        });
        // Copper Heatpipes
        for(let i=-2;i<=2;i++){
          const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.92, 12), (kid==='k1') ? M.darkMetal : M.copper);
          hp.rotation.z = Math.PI/2;
          hp.position.set(-0.42, 1.25 + i*0.09, -0.52);
          g.add(hp);
        }
        // Two 120mm Tower Fans at z = -1.02 and z = -0.53 (zero overlap with RAM at z >= 0.14!)
        [-1.02, -0.53].forEach(zPos=>{
          const f = makeFan(0.42, 0.11, kid !== 'k1', bladeCol);
          f.position.set(-0.42, 1.25, zPos);
          g.add(f); spinFans.push(f);
        });
      } else {
        // 360mm AIO Liquid Cooler
        const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.28, 32), M.darkMetal);
        pump.rotation.z = Math.PI/2; pump.position.set(-0.74, 1.25, -0.50); g.add(pump);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.026, 16, 36), M.rgb);
        ring.rotation.y = Math.PI/2; ring.position.set(-0.59, 1.25, -0.50); g.add(ring);

        // LCD Screen on Pump Cap (round for k2/k4, square IPS for k3)
        const lcdTex = makeLabelTex({w:256, h:256, bg:'#070d19', border:'#38bdf8', tag:'LIQUID TEMP', title:'31°C', sub:build.cool.name.slice(0,16)});
        const lcdGeo = (kid === 'k3') ? new THREE.BoxGeometry(0.02, 0.48, 0.48) : new THREE.CircleGeometry(0.26, 32);
        const lcd = new THREE.Mesh(lcdGeo, new THREE.MeshBasicMaterial({map:lcdTex}));
        if(kid !== 'k3') lcd.rotation.y = Math.PI/2;
        lcd.position.set(-0.58, 1.25, -0.50); g.add(lcd);

        // Top 360mm Radiator + 3x 120mm Fans
        const rad = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.20, 3.55), M.darkMetal);
        rad.position.set(-0.08, 2.12, 0); g.add(rad);
        [-1.12, 0, 1.12].forEach(zPos=>{
          const f = makeFan(0.52, 0.12, true);
          f.rotation.x = Math.PI/2; f.position.set(-0.08, 1.96, zPos);
          g.add(f); spinFans.push(f);
        });

        // Braided Sleeved AIO Tubes curving cleanly over RAM without touching
        [0, 0.11].forEach(off=>{
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.62, 1.22+off, -0.32),
            new THREE.Vector3( 0.22, 1.38+off,  0.15),
            new THREE.Vector3( 0.18, 1.78,      0.78+off),
            new THREE.Vector3(-0.05, 1.96,      1.05+off)
          ]);
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.042, 12, false), M.darkMetal);
          g.add(tube);
        });
      }
    }

    // RAM (r1..r5) — Seated at z = 0.16..0.49, completely clear of Air Cooler & AIO!
    if(build.ram){
      const g = groups.ram;
      const rid = build.ram.id || 'r2';
      const heatMat = (rid === 'r3') ? M.chrome : (rid === 'r5' ? M.vrmSilver : M.darkMetal);
      const hasRGB = (rid !== 'r1');
      for(let i=0;i<4;i++){
        const zPos = 0.16 + i*0.105;
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.88, 0.042), heatMat);
        stick.position.set(-0.78, 1.25, zPos); g.add(stick);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.90, 0.048), hasRGB ? M.rgb : M.gold);
        bar.position.set(-0.61, 1.25, zPos); g.add(bar);
      }
    }

    // SSD (s1..s5)
    if(build.ssd){
      const g = groups.ssd;
      const sid = build.ssd.id || 's3';
      const ssdSink = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.92), (sid==='s3'||sid==='s4') ? M.darkMetal : M.vrm);
      ssdSink.position.set(-0.88, 0.34, -0.35); g.add(ssdSink);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.86), (sid==='s4'||sid==='s2') ? M.gold : M.rgb);
      strip.position.set(-0.88, 0.34, -0.35); g.add(strip);
    }

    // GPU (g1..g6) — Collision-Free Power Cable & Model-Specific Dimensions/Branding
    if(build.gpu){
      const g = groups.gpu;
      const gid = build.gpu.id || 'g6';
      const is2Fan = (gid === 'g1');
      const isWhite = (gid === 'g2');
      const isFlagship = (gid === 'g5' || gid === 'g6');
      const L = is2Fan ? 2.15 : (isFlagship ? 3.05 : 2.75);
      const H = isFlagship ? 0.56 : 0.44;
      const W = 1.18;
      const cy = -0.20, cz = 0.10;

      const shroudMat = isWhite ? M.whiteMetal : M.darkMetal;
      const shroud = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), shroudMat);
      shroud.position.set(-0.22, cy, cz); shroud.castShadow = true; g.add(shroud);

      // Exposed Copper/Aluminum Fin Stack Core
      const fins = new THREE.Mesh(new THREE.BoxGeometry(W*0.92, H*0.68, L*0.94), M.vrmSilver);
      fins.position.set(-0.22, cy, cz); g.add(fins);

      // Custom Model-Branded Backplate on top of GPU!
      const gpuTitle = build.gpu.name.replace('NVIDIA GeForce ','').replace('AMD Radeon ','');
      const bpTex = makeLabelTex({
        w:512, h:256,
        bg: isWhite ? '#e2e8f0' : '#161615',
        border: isFlagship ? '#f59e0b' : '#38bdf8',
        tag: 'FORGE PCIe 5.0 x16 VERIFIED',
        title: gpuTitle,
        titleColor: isWhite ? '#121211' : '#f8fafc',
        sub: `${build.gpu.watt}W TDP · GDDR7 ARCHITECTURE`
      });
      const bp = new THREE.Mesh(new THREE.BoxGeometry(W*0.98, 0.03, L*0.98), [M.chrome, M.chrome, new THREE.MeshBasicMaterial({map:bpTex}), M.chrome, M.chrome, M.chrome]);
      bp.position.set(-0.22, cy + H/2 + 0.018, cz); g.add(bp);

      // Side Illuminated GEFORCE RTX / RADEON Badge Bar
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, L*0.86), isFlagship ? M.gold : M.rgb);
      ledBar.position.set(0.38, cy + H*0.20, cz); g.add(ledBar);

      // Axial Fans underneath GPU
      const fanCount = is2Fan ? 2 : 3;
      for(let i=0;i<fanCount;i++){
        const fz = cz + (i - (fanCount-1)/2) * (L / (fanCount + 0.15));
        const f = makeFan(0.36, 0.07, false, isWhite ? 0xcbd5e1 : 0x1e293b);
        f.rotation.x = Math.PI/2;
        f.position.set(-0.22, cy - H/2 - 0.02, fz);
        g.add(f); spinFans.push(f);
      }

      // 16-Pin 12V-2x6 Power Cable — Routes cleanly from GPU side header (x=0.36, y=cy-0.06, z=0.55)
      // under the GPU shroud horizontally into the lower motherboard tray grommet (x=-1.02, y=-0.52, z=1.15).
      // 100% clear of GPU body, anti-sag arm, and bottom intake fans!
      const gpuCable = makeBraidedCable([
        new THREE.Vector3( 0.36, cy - 0.04, 0.55),
        new THREE.Vector3( 0.46, cy - H/2 - 0.10, 0.65),
        new THREE.Vector3(-0.25, cy - H/2 - 0.16, 0.92),
        new THREE.Vector3(-1.02, -0.52, 1.18)
      ], 0.017, 6, hasCustomCables);
      g.add(gpuCable);
    }

    // PSU (p1..p5)
    if(build.psu){
      const g = groups.psu;
      const pid = build.psu.id || 'p2';
      const psuMat = (pid === 'p4') ? M.whiteMetal : M.darkMetal;
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.72, 1.62), psuMat);
      box.position.set(-0.20, -1.82, -1.15); g.add(box);
      const pTex = makeLabelTex({
        w:512, h:256, bg:'#0A0A09', border: pid==='p5' ? '#f59e0b' : '#38bdf8',
        tag: 'ATX 3.1 · PCIe 5.1',
        title: `${build.psu.cap || 850}W`,
        sub: build.psu.name.slice(0,22)
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.50, 1.32), new THREE.MeshBasicMaterial({map:pTex}));
      plate.position.set(0.52, -1.82, -1.15); g.add(plate);
    }

    // ACCESSORIES (a1..a10) — Multi-Accessory Support & 100% Collision-Free Coordinates
    const accList = Array.isArray(build.acc) ? build.acc : (build.acc ? [build.acc] : []);
    if(accList.length){
      const g = groups.acc;
      accList.forEach(acc => {
        if(!acc) return;
        const id = acc.id;
        if(id === 'a1'){
          // Top-rear 8-pin EPS CPU Braided Cable with CNC Combs (complements the upgraded MB & GPU braided cables)
          const eps = makeBraidedCable([
            new THREE.Vector3(-0.86, 1.82, -1.05),
            new THREE.Vector3(-0.72, 2.08, -1.18),
            new THREE.Vector3(-1.02, 2.18, -1.32)
          ], 0.017, 6, true);
          g.add(eps);
        } else if(id === 'a2'){
          // Lian Li UNI FAN TL LCD 120 (3-Pack) on Bottom Intake Shroud Deck (x=0.05, y=-1.31, z=-1.08, 0, 1.08)
          [-1.08, 0, 1.08].forEach((zPos, idx)=>{
            const f = makeFan(0.48, 0.11, true);
            f.rotation.x = Math.PI/2;
            f.position.set(0.05, -1.31, zPos);
            const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 24), M.screen);
            scr.rotation.x = Math.PI/2; f.add(scr);
            g.add(f); spinFans.push(f);
          });
        } else if(id === 'a3'){
          // Thermal Grizzly Kryonaut Extreme Syringe on Front-Left Shroud Showcase Deck (x=-0.62, y=-1.31, z=1.74)
          const syr = new THREE.Group();
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.56, 16), M.darkMetal);
          body.rotation.z = Math.PI/2; syr.add(body);
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.063, 0.22, 16), new THREE.MeshStandardMaterial({color:0xe11d48}));
          band.rotation.z = Math.PI/2; syr.add(band);
          const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.16, 16), M.chrome);
          tip.rotation.z = Math.PI/2; tip.position.x = 0.34; syr.add(tip);
          syr.position.set(-0.58, -1.30, 1.76);
          syr.rotation.y = 0.35;
          g.add(syr);
        } else if(id === 'a4'){
          // FORGE CNC Aluminum GPU Anti-Sag Arm — Placed on front-right solid shroud (x=0.45, z=1.42),
          // vertical rod terminates strictly beneath the GPU shroud bottom (y=-0.52) with ZERO penetration!
          const gpuH = (build.gpu && (build.gpu.id==='g5'||build.gpu.id==='g6')) ? 0.56 : 0.44;
          const supportY = -0.20 - gpuH/2 - 0.03;
          const rodH = Math.max(0.4, supportY - (-1.34));
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.06, 20), M.darkMetal);
          base.position.set(0.45, -1.34, 1.42); g.add(base);
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, rodH, 16), M.chrome);
          rod.position.set(0.45, -1.34 + rodH/2, 1.42); g.add(rod);
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.24), M.rgb);
          arm.position.set(0.32, supportY, 1.32); g.add(arm);
        } else if(id === 'a5'){
          // PCIe 5.0 x16 Vertical GPU Riser Kit — Mounted cleanly at lower expansion bay (y=-0.88, z=-0.45), clear of horizontal GPU
          const slot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 1.15), M.gold);
          slot.position.set(-0.38, -0.86, -0.35); g.add(slot);
          const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.92), M.darkMetal);
          ribbon.position.set(-0.66, -0.96, -0.35); ribbon.rotation.z = 0.32; g.add(ribbon);
        } else if(id === 'a6'){
          // FORGE 5.0" IPS Internal Sensor Panel — Mounted inside upper-front chamber (x=-0.86, y=0.55, z=1.55) facing side glass!
          const frame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.98), M.darkMetal);
          frame.position.set(-0.86, 0.42, 1.52); g.add(frame);
          const hudTex = makeTelemetryScreenTex('a6', 'FORGE 5.0" IPS // SENSOR HUD');
          const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, 0.90), new THREE.MeshBasicMaterial({map:hudTex}));
          lcd.position.set(-0.85, 0.42, 1.52); g.add(lcd);
        } else if(id === 'a7'){
          // Corsair iCUE LINK System Hub — Mounted on cable bar at (x=-0.90, y=0.38, z=1.68)
          const hub = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.44), M.darkMetal);
          hub.position.set(-0.90, 0.38, 1.68); g.add(hub);
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 0.28), M.rgb);
          led.position.set(-0.90, 0.38, 1.68); g.add(led);
        } else if(id === 'a8'){
          // Thermal Grizzly CPU Contact Frame — 4 CNC Perimeter Bars around CPU IHS (zero z-fighting with CPU center!)
          const cx = -0.88, cy = 1.25, cz = -0.50;
          const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.68), M.gold); bTop.position.set(cx, cy+0.29, cz); g.add(bTop);
          const bBot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.68), M.gold); bBot.position.set(cx, cy-0.29, cz); g.add(bBot);
          const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.50, 0.09), M.gold); bLeft.position.set(cx, cy, cz-0.29); g.add(bLeft);
          const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.50, 0.09), M.gold); bRight.position.set(cx, cy, cz+0.29); g.add(bRight);
        } else if(id === 'a9'){
          // Noctua NF-A12x25 PWM chromax.black — Mounted at Front-Lower Intake (x=0, y=-0.52, z=2.06), zero overlap with rear fan!
          const nf = makeFan(0.50, 0.14, false, 0x1c1917);
          nf.position.set(0, -0.52, 2.06);
          g.add(nf); spinFans.push(nf);
        } else if(id === 'a10'){
          // FORGE Magnetic Fine-Nylon Dust Filter — Top exterior magnetic mesh bay (y=2.37)
          const fltFrame = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.03, 3.85), M.rgb2);
          fltFrame.position.set(0, 2.37, 0); g.add(fltFrame);
          const fltMesh = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.035, 3.68), M.caseInterior);
          fltMesh.position.set(0, 2.37, 0); g.add(fltMesh);
        }
      });
    }
  }

  // Thermal Airflow Particle Stream Group
  const airflowGroup = new THREE.Group();
  airflowGroup.visible = !!opts.airflow;
  root.add(airflowGroup);
  const airParticles = [];
  for(let i=0;i<36;i++){
    const arrow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.022, 0.45, 8),
      new THREE.MeshBasicMaterial({color: i%2===0 ? 0x38bdf8 : 0x10b981, transparent:true, opacity:0.65})
    );
    arrow.position.set((Math.random()-0.5)*1.4, -1.2 + Math.random()*3.0, -1.6 + Math.random()*3.2);
    airflowGroup.add(arrow);
    airParticles.push({mesh:arrow, speed: 0.025 + Math.random()*0.02});
  }

  const currentBuild = { case: { id: 'x1' } };
  let glassVisible = true;

  // Orbit Camera & Target Focus System
  let rotY = 1.15, rotX = 0.14, dist = 9.6;
  const lookTarget = new THREE.Vector3(0, -0.05, 0);
  const desiredLook = new THREE.Vector3(0, -0.05, 0);
  let desiredDist = 9.6, desiredRotY = 1.15, desiredRotX = 0.14;
  let cameraOverride = false;
  let autoSpin = (opts.auto !== undefined) ? !!opts.auto : (opts.autoSpin !== false);
  let exploded = false, expT = 0, manualExp = null;
  let dragging = false, moved = false, lx = 0, ly = 0;

  // Raycaster for clicking any 3D component inside the case
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener('mousedown', e=>{ dragging=true; moved=false; lx=e.clientX; ly=e.clientY; autoSpin=false; cameraOverride=false; });
  window.addEventListener('mouseup', e=>{
    if(dragging && !moved && opts.onPick){
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const pickOrder = ['gpu','cool','ram','cpu','ssd','acc','mb','psu','case'];
      for(const catKey of pickOrder){
        const grp = groups[catKey];
        if(grp && grp.children.length){
          const hits = raycaster.intersectObjects(grp.children, true);
          if(hits.length && currentBuild[catKey]){
            opts.onPick(catKey, currentBuild[catKey]);
            break;
          }
        }
      }
    }
    dragging=false;
  });
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    if(Math.abs(e.clientX - lx) > 3 || Math.abs(e.clientY - ly) > 3) moved = true;
    rotY -= (e.clientX - lx)*0.008;
    rotX = Math.max(-0.65, Math.min(0.75, rotX + (e.clientY - ly)*0.008));
    lx = e.clientX; ly = e.clientY;
  });
  canvas.addEventListener('touchstart', e=>{ if(e.touches.length===1){ dragging=true; lx=e.touches[0].clientX; ly=e.touches[0].clientY; autoSpin=false; cameraOverride=false; }},{passive:true});
  window.addEventListener('touchend', ()=>dragging=false);
  window.addEventListener('touchmove', e=>{
    if(!dragging || e.touches.length!==1) return;
    rotY -= (e.touches[0].clientX - lx)*0.008;
    rotX = Math.max(-0.65, Math.min(0.75, rotX + (e.touches[0].clientY - ly)*0.008));
    lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  },{passive:true});
  canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    cameraOverride = false;
    dist = Math.max(3.6, Math.min(12.5, dist + e.deltaY*0.004));
  }, {passive:false});

  let rainbow = false, t = 0;
  function loop(){
    requestAnimationFrame(loop);
    t += 0.016;
    if(autoSpin && !cameraOverride) rotY += 0.0045;
    if(cameraOverride){
      rotY += (desiredRotY - rotY)*0.08;
      rotX += (desiredRotX - rotX)*0.08;
      dist += (desiredDist - dist)*0.08;
    }
    lookTarget.lerp(desiredLook, 0.08);
    const targetExp = (manualExp !== null) ? manualExp : (exploded ? 1 : 0);
    expT += (targetExp - expT) * 0.09;

    Object.keys(groups).forEach(k=>{
      const g = groups[k], h = HOME[k] || [0,0,0], x = EXP[k] || [0,0,0];
      g.position.set(h[0]+(x[0]-h[0])*expT, h[1]+(x[1]-h[1])*expT, h[2]+(x[2]-h[2])*expT);
    });

    spinFans.forEach(f=>{ if(f.userData.blades) f.userData.blades.rotation.z += 0.14; });

    if(airflowGroup.visible){
      airParticles.forEach(p=>{
        p.mesh.position.y += p.speed;
        p.mesh.position.z -= p.speed * 0.65;
        if(p.mesh.position.y > 2.0 || p.mesh.position.z < -2.0){
          p.mesh.position.y = -1.25;
          p.mesh.position.z = 1.65;
        }
      });
    }

    if(rainbow){
      const col = new THREE.Color().setHSL((t*0.18)%1, 0.92, 0.56);
      const col2 = new THREE.Color().setHSL(((t*0.18)+0.28)%1, 0.92, 0.56);
      M.rgb.color.copy(col); M.rgb.emissive.copy(col);
      M.rgb2.color.copy(col2); M.rgb2.emissive.copy(col2);
      rgbLight.color.copy(col); rgbLight2.color.copy(col2);
    }

    camera.position.set(
      lookTarget.x + Math.sin(rotY)*Math.cos(rotX)*dist,
      lookTarget.y + Math.sin(rotX)*dist + 0.15,
      lookTarget.z + Math.cos(rotY)*Math.cos(rotX)*dist
    );
    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
  }
  clearAndBuild(currentBuild);
  loop();

  window.addEventListener('resize', ()=>{
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  });

  const api = {
    get glass(){ return glassVisible; },
    set(cat, part, animate){
      if(cat === 'acc'){
        if(!part) delete currentBuild.acc;
        else if(Array.isArray(part)) currentBuild.acc = part.slice();
        else {
          const prev = Array.isArray(currentBuild.acc) ? currentBuild.acc : (currentBuild.acc ? [currentBuild.acc] : []);
          if(!prev.some(a => a && a.id === part.id)) prev.push(part);
          currentBuild.acc = prev;
        }
      } else {
        if(!part) delete currentBuild[cat];
        else currentBuild[cat] = part;
      }
      clearAndBuild(currentBuild);
      const sg = groups.case.getObjectByName('sideGlass');
      const sge = groups.case.getObjectByName('sideGlassEdge');
      if(sg) sg.visible = glassVisible;
      if(sge) sge.visible = glassVisible;
    },
    updateBuild(b){
      Object.keys(currentBuild).forEach(k=>delete currentBuild[k]);
      Object.assign(currentBuild, b || {});
      clearAndBuild(currentBuild);
    },
    setRGB(hex){
      if(hex === 'rainbow'){ rainbow = true; return; }
      rainbow = false;
      const c = new THREE.Color(hex);
      rgbMats.forEach(m=>{ m.color.copy(c); m.emissive.copy(c); });
      M.glassEdge.color.copy(c);
      rgbLight.color.copy(c); rgbLight2.color.copy(c); rim.color.copy(c);
    },
    setCaseColor(hex){ if(hex) M.caseBody.color.set(hex); },
    explode(val){ manualExp = null; exploded = (val !== undefined) ? !!val : !exploded; return exploded; },
    setExplodeProgress(val){ manualExp = Math.max(0, Math.min(1, Number(val)||0)); },
    setOrbit(ry, rx, d){
      cameraOverride = true; autoSpin = false;
      if(ry !== undefined) desiredRotY = ry;
      if(rx !== undefined) desiredRotX = rx;
      if(d !== undefined) desiredDist = d;
    },
    toggleExplode(){ manualExp = null; exploded = !exploded; return exploded; },
    setAuto(val){ autoSpin = !!val; cameraOverride = false; return autoSpin; },
    toggleSpin(){ autoSpin = !autoSpin; cameraOverride = false; return autoSpin; },
    setAirflow(val){ airflowGroup.visible = !!val; return airflowGroup.visible; },
    setGlass(val){
      glassVisible = !!val;
      const sg = groups.case.getObjectByName('sideGlass');
      const sge = groups.case.getObjectByName('sideGlassEdge');
      if(sg) sg.visible = glassVisible;
      if(sge) sge.visible = glassVisible;
      return glassVisible;
    },
    snapshot(){
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    },
    resetView(){
      rotY=1.15; rotX=0.14; dist=9.6; exploded=false;
      desiredLook.set(0,-0.05,0); cameraOverride=false;
    },
    focusComponent(cat, partId){
      cameraOverride = true;
      autoSpin = false;
      const focusMap = {
        cpu:  {look:[-0.65, 1.25, -0.50], ry:0.85, rx:0.12, d:4.4},
        mb:   {look:[-0.65, 0.55, -0.15], ry:0.78, rx:0.10, d:5.4},
        ram:  {look:[-0.55, 1.25,  0.32], ry:0.72, rx:0.14, d:4.3},
        gpu:  {look:[-0.15, -0.20, 0.15], ry:0.65, rx:0.08, d:4.9},
        ssd:  {look:[-0.65, 0.34, -0.35], ry:0.82, rx:0.08, d:4.4},
        psu:  {look:[ 0.00, -1.75,-0.95], ry:0.95, rx:-0.08,d:5.2},
        cool: {look:[-0.35, 1.45, -0.25], ry:0.75, rx:0.18, d:5.0},
        case: {look:[ 0.00,  0.00, 0.00], ry:0.58, rx:0.16, d:7.4},
        acc:  {look:[ 0.00, -0.65, 1.15], ry:0.62, rx:0.08, d:5.0}
      };
      if(partId === 'a8') focusMap.acc = {look:[-0.65, 1.25, -0.50], ry:0.82, rx:0.12, d:4.2};
      else if(partId === 'a10') focusMap.acc = {look:[0, 1.85, 0], ry:0.65, rx:0.42, d:5.5};
      const cfg = focusMap[cat] || focusMap.case;
      desiredLook.set(cfg.look[0], cfg.look[1], cfg.look[2]);
      desiredRotY = cfg.ry; desiredRotX = cfg.rx; desiredDist = cfg.d;
    }
  };
  window.addEventListener('forge-theme', e=>{
    if(e.detail && e.detail.hex) api.setRGB(e.detail.hex);
  });
  return api;
}

// ============================================================================
// 2. SINGLE COMPONENT 3D CAD VIEWER (createPartViewer) — 53 UNIQUE MODELS
// ============================================================================
function createPartViewer(canvas, part, opts){
  opts = opts || {};
  const W = canvas.clientWidth || 520, H = canvas.clientHeight || 380;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true});
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, W/H, 0.1, 100);

  const thHex = (typeof getTheme === 'function' && getTheme().hex) ? getTheme().hex : 0xe5a93c;
  scene.add(new THREE.AmbientLight(0xf3f4f6, 0.92));
  scene.add(new THREE.HemisphereLight(0xfef3c7, 0x090b10, 0.82));
  const key = new THREE.DirectionalLight(0xfffbeb, 1.85); key.position.set(5, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(thHex, 1.20); rim.position.set(-6, 4, -5); scene.add(rim);
  const warm = new THREE.DirectionalLight(0x38bdf8, 0.55); warm.position.set(4, -5, 4); scene.add(warm);

  const grid = new THREE.GridHelper(10, 20, thHex, 0x1c1f2b);
  grid.position.y = -1.65; grid.material.opacity = 0.22; grid.material.transparent = true;
  scene.add(grid);

  const root = new THREE.Group();
  scene.add(root);

  const pid = (part && part.id) || 'g6';
  const cat = (part && part.cat) || 'gpu';
  const name = (part && part.name) || 'FORGE Component';
  const spec = (part && part.spec) || '';

  const metalTex = makeBrushedMetalTex('#1e2636', '255,255,255');
  const silverTex = makeBrushedMetalTex('#e2e8f0', '30,41,59');

  const matDark = new THREE.MeshStandardMaterial({color:0x1b2230, map:metalTex, metalness:0.84, roughness:0.25});
  const matSilver = new THREE.MeshStandardMaterial({color:0xe2e8f0, map:silverTex, metalness:0.86, roughness:0.20});
  const matChrome = new THREE.MeshStandardMaterial({color:0xf8fafc, metalness:0.95, roughness:0.10});
  const matGold = new THREE.MeshStandardMaterial({color:0xf59e0b, metalness:0.92, roughness:0.18});
  const matCopper = new THREE.MeshStandardMaterial({color:0xd97742, metalness:0.90, roughness:0.20});
  const matCyan = new THREE.MeshStandardMaterial({color:0x38bdf8, emissive:0x38bdf8, emissiveIntensity:1.5, roughness:0.18});
  const matEmerald = new THREE.MeshStandardMaterial({color:0x10b981, emissive:0x10b981, emissiveIntensity:1.3, roughness:0.2});

  const spinTargets = [];

  function makeMiniFan(r, d, hasRGB, bladeHex){
    const fg = new THREE.Group();
    fg.add(new THREE.Mesh(new THREE.BoxGeometry(r*2.05, r*2.05, d), matDark));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r*0.90, d*0.16, 12, 32), hasRGB ? matCyan : matSilver);
    ring.position.z = d*0.42; fg.add(ring);
    const blades = new THREE.Group();
    const bMat = new THREE.MeshStandardMaterial({color: bladeHex || 0x283244, metalness:0.5, roughness:0.35});
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r*0.30, r*0.30, d*0.88, 20), matChrome);
    hub.rotation.x = Math.PI/2; blades.add(hub);
    for(let i=0;i<9;i++){
      const b = new THREE.Mesh(new THREE.BoxGeometry(r*0.54, d*0.14, r*0.18), bMat);
      const a = (i/9)*Math.PI*2;
      b.position.set(Math.cos(a)*r*0.54, Math.sin(a)*r*0.54, 0);
      b.rotation.z = a + 0.4; b.rotation.y = 0.35;
      blades.add(b);
    }
    fg.add(blades);
    spinTargets.push(blades);
    return fg;
  }

  // Build Model-Specific 3D CAD Geometry with Dynamic Laser-Etched / Printed Label Textures
  if(cat === 'cpu'){
    const isAMD = (part.socket === 'AM5');
    // Substrate PCB
    const subCol = isAMD ? 0x0f5248 : 0x1e3a5f;
    const sub = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 0.14), new THREE.MeshStandardMaterial({color:subCol, metalness:0.45, roughness:0.42}));
    root.add(sub);
    // Gold contact pads on back & perimeter
    for(let i=-3;i<=3;i++){
      const padT = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), matGold); padT.position.set(i*0.24, 0.96, 0.02); root.add(padT);
      const padB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), matGold); padB.position.set(i*0.24, -0.96, 0.02); root.add(padB);
    }
    // Nickel-Plated Copper IHS with Laser-Etched Model Name
    const ihsTex = makeLabelTex({
      w:512, h:512, bg:'#cbd5e1', border:'#64748b', borderW:8,
      tag: isAMD ? 'AMD RYZEN // AM5 ZEN 5' : 'INTEL CORE ULTRA // SERIES 2',
      tagColor: '#334155',
      title: name.replace('AMD ','').replace('Intel ',''),
      titleColor: '#121211', titleSize: 44,
      sub: `${spec} · DIFFUSED SILICON`,
      subColor: '#242422', subSize: 24
    });
    const ihsW = isAMD ? 1.58 : 1.42, ihsH = isAMD ? 1.58 : 1.78;
    const ihsMats = [matSilver, matSilver, matSilver, matSilver, new THREE.MeshStandardMaterial({map:ihsTex, metalness:0.75, roughness:0.25}), matSilver];
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(ihsW, ihsH, 0.18), ihsMats);
    ihs.position.z = 0.14; root.add(ihs);
  }
  else if(cat === 'mb'){
    const isWhite = (pid === 'm4');
    const isGold = (pid === 'm6');
    const pcbMat = new THREE.MeshStandardMaterial({color: isWhite ? 0xdbe4f0 : 0x0f1520, metalness:0.45, roughness:0.48});
    const armorMat = isWhite ? matSilver : (isGold ? matGold : matDark);

    const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.85, 0.12), pcbMat);
    root.add(pcb);
    // VRM Heatsinks with Model Branding
    const vrmTex = makeLabelTex({
      w:512, h:160, bg: isWhite ? '#e2e8f0' : '#161615', border: isGold ? '#f59e0b' : '#38bdf8',
      tag: part.socket || 'PCIe 5.0', title: name.replace('ASUS ','').replace('MSI ','').replace('Gigabyte ','').slice(0,18),
      titleColor: isWhite ? '#121211' : '#f8fafc', sub: spec.slice(0,28)
    });
    const vrmL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.35, 0.32), [armorMat, armorMat, armorMat, armorMat, new THREE.MeshBasicMaterial({map:vrmTex}), armorMat]);
    vrmL.position.set(-0.85, 0.62, 0.20); root.add(vrmL);
    const vrmT = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.28), armorMat);
    vrmT.position.set(-0.08, 1.15, 0.18); root.add(vrmT);
    // CPU Socket
    const sock = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.68, 0.12), matChrome);
    sock.position.set(-0.08, 0.55, 0.10); root.add(sock);
    // 4 DIMM Slots
    for(let i=0;i<4;i++){
      const dimm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.12, 0.14), i%2===0 ? matSilver : matDark);
      dimm.position.set(0.48 + i*0.12, 0.58, 0.10); root.add(dimm);
    }
    // M.2 Thermal Armor & Chipset
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.65, 0.18), armorMat);
    m2.position.set(0.05, -0.62, 0.12); root.add(m2);
    // 2 Steel PCIe 5.0 Slots
    [-0.18, -1.05].forEach(y=>{
      const sl = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.09, 0.15), matChrome);
      sl.position.set(-0.18, y, 0.10); root.add(sl);
    });
  }
  else if(cat === 'ram'){
    const isRoyal = (pid === 'r3');
    const isDom = (pid === 'r5');
    const hasRGB = (pid !== 'r1');
    const spreadMat = isRoyal ? matChrome : (isDom ? matSilver : matDark);
    const ramTex = makeLabelTex({
      w:512, h:160, bg: isRoyal ? '#e2e8f0' : '#121211', border: isRoyal ? '#f59e0b' : '#38bdf8',
      tag: 'DDR5 DUAL-CHANNEL KIT', title: name.replace('Corsair ','').replace('G.Skill ','').replace('Kingston ','').slice(0,20),
      titleColor: isRoyal ? '#121211' : '#f8fafc', sub: spec
    });
    [-0.26, 0.26].forEach((zOff, idx)=>{
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.78, 0.14), [spreadMat, spreadMat, spreadMat, spreadMat, new THREE.MeshBasicMaterial({map:ramTex}), spreadMat]);
      g.add(body);
      // Gold PCB Edge Fingers
      const pins = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.06), matGold);
      pins.position.y = -0.44; g.add(pins);
      // Top Light Bar / Fin Crown
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.16, 0.16), hasRGB ? (isRoyal ? matGold : matCyan) : matSilver);
      topBar.position.y = 0.45; g.add(topBar);
      g.position.set(0, idx*0.18 - 0.08, zOff);
      root.add(g);
    });
  }
  else if(cat === 'gpu'){
    const is2Fan = (pid === 'g1');
    const isWhite = (pid === 'g2');
    const isFlagship = (pid === 'g5' || pid === 'g6');
    const Wg = is2Fan ? 2.35 : (isFlagship ? 3.15 : 2.85);
    const Hg = isFlagship ? 1.28 : 1.15;
    const Dg = isFlagship ? 0.62 : 0.48;
    const shroudMat = isWhite ? matSilver : matDark;

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(Wg, Hg, Dg), shroudMat);
    root.add(shroud);
    // Fin stack core
    root.add(new THREE.Mesh(new THREE.BoxGeometry(Wg*0.94, Hg*0.86, Dg*0.82), matSilver));
    // Fans on front face
    const nFans = is2Fan ? 2 : 3;
    for(let i=0;i<nFans;i++){
      const fx = (i - (nFans-1)/2) * (Wg / (nFans + 0.12));
      const f = makeMiniFan(Hg*0.39, 0.10, isFlagship, isWhite ? 0xcbd5e1 : 0x1e293b);
      f.position.set(fx, 0, Dg/2 + 0.03);
      root.add(f);
    }
    // Backplate with Model Name on rear face + Top LED Bar
    const gpuTex = makeLabelTex({
      w:512, h:256, bg: isWhite ? '#e2e8f0' : '#0b111e', border: isFlagship ? '#f59e0b' : '#38bdf8',
      tag: `${part.watt || 300}W TDP · PCIe 5.0 x16`,
      title: name.replace('NVIDIA GeForce ','').replace('AMD Radeon ',''),
      titleColor: isWhite ? '#121211' : '#f8fafc', sub: spec
    });
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(Wg*0.92, 0.12, Dg*0.92), [shroudMat, shroudMat, new THREE.MeshBasicMaterial({map:gpuTex}), shroudMat, matCyan, shroudMat]);
    topPlate.position.y = Hg/2 + 0.05; root.add(topPlate);
    // PCIe Gold Fingers & I/O Bracket
    const pcie = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.06), matGold);
    pcie.position.set(-0.35, -Hg/2 - 0.06, -0.10); root.add(pcie);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, Hg*1.25, Dg*0.95), matChrome);
    bracket.position.set(-Wg/2 - 0.04, -0.06, 0); root.add(bracket);
  }
  else if(cat === 'ssd'){
    const isGen5 = (pid === 's3' || pid === 's4');
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.78, 0.06), new THREE.MeshStandardMaterial({color:0x111827, metalness:0.4, roughness:0.5}));
    root.add(pcb);
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.66, 0.07), matGold);
    conn.position.x = 1.38; root.add(conn);
    const ssdTex = makeLabelTex({
      w:512, h:180, bg:'#090e17', border: isGen5 ? '#f59e0b' : '#38bdf8',
      tag: isGen5 ? 'PCIe GEN 5.0 x4 NVMe M.2' : 'PCIe GEN 4.0 x4 NVMe M.2',
      title: name.replace('Samsung ','').replace('WD Black ','').replace('Crucial ',''),
      sub: spec
    });
    const sinkH = isGen5 ? 0.36 : 0.18;
    const sink = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.76, sinkH), [matDark, matDark, matDark, matDark, new THREE.MeshBasicMaterial({map:ssdTex}), matDark]);
    sink.position.set(-0.08, 0, sinkH/2 + 0.03); root.add(sink);
  }
  else if(cat === 'psu'){
    const isWhite = (pid === 'p4');
    const isThor = (pid === 'p5');
    const pMat = isWhite ? matSilver : matDark;
    const psuTex = makeLabelTex({
      w:512, h:256, bg: isWhite ? '#e2e8f0' : '#0A0A09', border: isThor ? '#f59e0b' : '#38bdf8',
      tag: isThor ? 'ROG THOR // OLED TITANIUM' : 'ATX 3.1 · NATIVE 12V-2x6',
      title: `${part.cap || 850}W`,
      titleColor: isWhite ? '#121211' : '#f8fafc', sub: name
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.18, 1.85), [pMat, pMat, pMat, pMat, new THREE.MeshBasicMaterial({map:psuTex}), pMat]);
    root.add(box);
    const fan = makeMiniFan(0.72, 0.08, isThor, isWhite ? 0xcbd5e1 : 0x1e293b);
    fan.rotation.x = -Math.PI/2; fan.position.y = 0.60; root.add(fan);
  }
  else if(cat === 'cool'){
    if(part.type === 'air'){
      const isNoctua = (pid === 'k1');
      const fMat = isNoctua ? matDark : matSilver;
      [-0.52, 0.52].forEach(xOff=>{
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.75, 1.32), fMat);
        tower.position.set(xOff, 0.05, 0); root.add(tower);
      });
      for(let i=-2;i<=2;i++){
        const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.95, 12), isNoctua ? matDark : matCopper);
        hp.position.set(i*0.18, 0, 0); root.add(hp);
      }
      const f1 = makeMiniFan(0.62, 0.16, !isNoctua, isNoctua ? 0x27201c : 0x1e293b);
      f1.rotation.y = Math.PI/2; f1.position.set(0, 0.05, 0); root.add(f1);
      const f2 = makeMiniFan(0.62, 0.16, !isNoctua, isNoctua ? 0x27201c : 0x1e293b);
      f2.rotation.y = Math.PI/2; f2.position.set(0.96, 0.05, 0); root.add(f2);
    } else {
      // 360mm AIO Radiator + 3 RGB Fans + LCD Pump Block
      const rad = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.28, 1.12), matDark);
      rad.position.y = 0.68; root.add(rad);
      [-1.02, 0, 1.02].forEach(xPos=>{
        const f = makeMiniFan(0.48, 0.12, true);
        f.rotation.x = Math.PI/2; f.position.set(xPos, 0.46, 0); root.add(f);
      });
      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.36, 32), matDark);
      pump.rotation.x = Math.PI/2; pump.position.set(0, -0.68, 0.25); root.add(pump);
      const lcdTex = makeLabelTex({w:256, h:256, bg:'#070d19', border:'#38bdf8', tag:'AIO TELEMETRY', title:'31°C', sub:name.slice(0,16)});
      const lcd = new THREE.Mesh(new THREE.CircleGeometry(0.36, 32), new THREE.MeshBasicMaterial({map:lcdTex}));
      lcd.position.set(0, -0.68, 0.44); root.add(lcd);
    }
  }
  else if(cat === 'case'){
    const isWhite = (pid === 'x2');
    const isWalnut = (pid === 'x3');
    const isTouch = (pid === 'x4');
    const cMat = isWhite ? matSilver : matDark;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.45, 2.35), new THREE.MeshPhysicalMaterial({color: isWhite ? 0xf8fafc : 0x1e293b, transparent:true, opacity:0.28, roughness:0.1, metalness:0.2}));
    root.add(frame);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.45, 2.36), cMat); bot.position.y = -1.02; root.add(bot);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.12, 2.36), cMat); top.position.y = 1.18; root.add(top);
    if(isWalnut){
      for(let i=-3;i<=3;i++){
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.25, 0.08), new THREE.MeshStandardMaterial({color:0x6b4423, roughness:0.65}));
        slat.position.set(i*0.21, 0.05, 1.18); root.add(slat);
      }
    } else if(isTouch){
      const tScreen = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.15, 0.06), new THREE.MeshBasicMaterial({map:makeTelemetryScreenTex('y70', 'HYTE Y70 // 4K TOUCH')}));
      tScreen.position.set(0.62, 0.08, 1.16); tScreen.rotation.y = -0.45; root.add(tScreen);
    }
    [-0.65, 0, 0.65].forEach(zPos=>{
      const f = makeMiniFan(0.32, 0.09, true);
      f.rotation.y = Math.PI/2; f.position.set(-0.72, 0.15, zPos); root.add(f);
    });
  }
  else {
    // Accessories (a1..a10) — Unique 3D CAD Model for Every Single Accessory!
    if(pid === 'a1'){
      // Braided Cable Kit with CNC Combs
      for(let i=-4;i<=4;i++){
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(i*0.18, -1.15, 0),
          new THREE.Vector3(i*0.18,  0.0,  0.38),
          new THREE.Vector3(i*0.18,  1.15, 0)
        ]);
        const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.055, 12, false), i%2===0 ? matCyan : matDark);
        root.add(t);
      }
      [-0.38, 0.38].forEach(y=>{
        const comb = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.24), matChrome);
        comb.position.set(0, y, 0.28); root.add(comb);
      });
    } else if(pid === 'a2'){
      // Lian Li UNI FAN TL LCD 3-Pack
      [-1.08, 0, 1.08].forEach((xPos, i)=>{
        const f = makeMiniFan(0.50, 0.16, true);
        f.position.set(xPos, 0, 0);
        const lcd = new THREE.Mesh(new THREE.CircleGeometry(0.20, 24), new THREE.MeshBasicMaterial({map:makeLabelTex({w:128,h:128,bg:'#090908',border:'#38bdf8',title:`${31+i}°C`})}));
        lcd.position.z = 0.10; f.add(lcd);
        root.add(f);
      });
    } else if(pid === 'a3'){
      // Thermal Grizzly Kryonaut Extreme Applicator Syringe
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.85, 24), matDark);
      barrel.rotation.z = Math.PI/4; root.add(barrel);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.95, 24), new THREE.MeshStandardMaterial({color:0xe11d48, roughness:0.3}));
      label.rotation.z = Math.PI/4; root.add(label);
      const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.95, 20), matSilver);
      plunger.rotation.z = Math.PI/4; plunger.position.set(0.85, -0.85, 0); root.add(plunger);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.55, 20), matChrome);
      nozzle.rotation.z = Math.PI/4; nozzle.position.set(-0.82, 0.82, 0); root.add(nozzle);
    } else if(pid === 'a4'){
      // FORGE CNC GPU Anti-Sag Pillar & Magnetic Support Arm
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.65, 0.22, 28), matDark);
      base.position.y = -1.15; root.add(base);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.35, 24), matChrome);
      post.position.x = -0.25; root.add(post);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.42), matDark);
      arm.position.set(0.22, 0.35, 0); root.add(arm);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.38), matCyan);
      pad.position.set(0.42, 0.46, 0); root.add(pad);
    } else if(pid === 'a5'){
      // PCIe 5.0 x16 Vertical GPU Riser Kit
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.35, 0.12), matDark);
      bracket.position.set(-0.35, 0.15, -0.35); root.add(bracket);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.24, 0.28), matGold);
      slot.position.set(0.15, -0.65, 0.25); root.add(slot);
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.05, 0.06), matSilver);
      ribbon.position.set(0.15, -0.10, 0); ribbon.rotation.x = 0.45; root.add(ribbon);
    } else if(pid === 'a6'){
      // FORGE 5.0" IPS Internal Sensor Panel
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 0.85), matDark);
      stand.position.y = -1.05; root.add(stand);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.18), matSilver);
      neck.position.y = -0.78; root.add(neck);
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.72, 0.18), matDark);
      bezel.position.y = 0.12; root.add(bezel);
      const hud = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.48, 0.04), new THREE.MeshBasicMaterial({map:makeTelemetryScreenTex('a6', 'FORGE // 5.0" IPS SENSOR HUD')}));
      hud.position.set(0, 0.12, 0.10); root.add(hud);
    } else if(pid === 'a7'){
      // Corsair iCUE LINK System Hub
      const hubTex = makeLabelTex({w:512, h:512, bg:'#121211', border:'#38bdf8', borderW:10, tag:'CORSAIR // DIGITAL BUS', title:'iCUE LINK', sub:'24-DEVICE SYSTEM HUB'});
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.85, 0.46), [matDark, matDark, matDark, matDark, new THREE.MeshBasicMaterial({map:hubTex}), matDark]);
      root.add(box);
    } else if(pid === 'a8'){
      // Thermal Grizzly CPU Contact Frame (Hollow Precision CNC Anodized Collar)
      const topB = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 0.22), matDark); topB.position.y = 0.88; root.add(topB);
      const botB = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 0.22), matDark); botB.position.y = -0.88; root.add(botB);
      const lftB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.42, 0.22), matDark); lftB.position.x = -0.80; root.add(lftB);
      const rgtB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.42, 0.22), matDark); rgtB.position.x = 0.80; root.add(rgtB);
      [[-0.76,0.84],[0.76,0.84],[-0.76,-0.84],[0.76,-0.84]].forEach(p=>{
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 16), matGold);
        sc.rotation.x = Math.PI/2; sc.position.set(p[0], p[1], 0); root.add(sc);
      });
    } else if(pid === 'a9'){
      // Noctua NF-A12x25 PWM chromax.black
      const nf = makeMiniFan(1.05, 0.36, false, 0x1c1917);
      root.add(nf);
      // Colored Swappable Anti-Vibration Corner Pads
      [[-0.95,0.95,0xef4444],[0.95,0.95,0x38bdf8],[-0.95,-0.95,0x10b981],[0.95,-0.95,0xf59e0b]].forEach(p=>{
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.40), new THREE.MeshStandardMaterial({color:p[2]}));
        pad.position.set(p[0], p[1], 0); root.add(pad);
      });
    } else {
      // a10: FORGE Magnetic Fine-Nylon Dust Filter
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.85, 0.08), matDark);
      root.add(frame);
      const meshTex = makeCarbonPerfTex();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.58, 0.10), new THREE.MeshStandardMaterial({map:meshTex, color:0x38bdf8, metalness:0.6, roughness:0.4}));
      root.add(mesh);
    }
  }

  let rotY = 0.48, rotX = 0.20, dist = 4.5;
  let dragging = false, lx = 0, ly = 0, autoSpin = true;

  canvas.addEventListener('mousedown', e=>{ dragging=true; lx=e.clientX; ly=e.clientY; autoSpin=false; });
  window.addEventListener('mouseup', ()=>dragging=false);
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    rotY -= (e.clientX - lx)*0.01;
    rotX = Math.max(-0.85, Math.min(0.85, rotX + (e.clientY - ly)*0.01));
    lx = e.clientX; ly = e.clientY;
  });
  canvas.addEventListener('touchstart', e=>{ if(e.touches.length===1){ dragging=true; lx=e.touches[0].clientX; ly=e.touches[0].clientY; autoSpin=false; }},{passive:true});
  window.addEventListener('touchend', ()=>dragging=false);
  window.addEventListener('touchmove', e=>{
    if(!dragging || e.touches.length!==1) return;
    rotY -= (e.touches[0].clientX - lx)*0.01;
    rotX = Math.max(-0.85, Math.min(0.85, rotX + (e.touches[0].clientY - ly)*0.01));
    lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  },{passive:true});
  canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    dist = Math.max(2.4, Math.min(8.0, dist + e.deltaY*0.004));
  }, {passive:false});

  let alive = true;
  function loop(){
    if(!alive) return;
    requestAnimationFrame(loop);
    if(autoSpin) rotY += 0.0075;
    spinTargets.forEach(b=>{ b.rotation.z += 0.12; });
    camera.position.set(Math.sin(rotY)*Math.cos(rotX)*dist, Math.sin(rotX)*dist, Math.cos(rotY)*Math.cos(rotX)*dist);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();

  return {
    destroy(){ alive = false; renderer.dispose(); }
  };
}

window.createPC = createPC;
window.createPartViewer = createPartViewer;
})();
