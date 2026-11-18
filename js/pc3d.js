// FORGE 3D Engine (Three.js r147) — Studio PMREM PBR Pipeline + Blender GLB Loader + Precision CAD Assembly
(function () {

// ============================================================================
// 0. STUDIO ENVIRONMENT PMREM, TEXTURE HELPERS & GLB CACHE
// ============================================================================
const studioEnvCache = new WeakMap();
const glbTemplateCache = new Map();
const glbPendingCache = new Map();
let sharedGltfLoader = null;

function getGltfLoader() {
  if (!sharedGltfLoader && typeof THREE.GLTFLoader !== 'undefined') {
    sharedGltfLoader = new THREE.GLTFLoader();
  }
  return sharedGltfLoader;
}

function getStudioEnv(renderer) {
  if (!renderer || typeof THREE.PMREMGenerator === 'undefined') return null;
  if (studioEnvCache.has(renderer)) return studioEnvCache.get(renderer);

  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Vertical studio lighting dome: bright neutral overhead softboxes -> silver studio walls -> carbon floor
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0.00, '#fff8eb');
  skyGrad.addColorStop(0.22, '#f4f4f5');
  skyGrad.addColorStop(0.46, '#52525b');
  skyGrad.addColorStop(0.54, '#27272a');
  skyGrad.addColorStop(0.75, '#121214');
  skyGrad.addColorStop(1.00, '#070708');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Overhead warm titanium softbox strip (#fff8eb)
  const addSoftbox = (cx, cy, rw, rh, rgb, alpha) => {
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(rw, rh));
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.55, `rgba(${rgb},${(alpha * 0.45).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(cx - rw, cy - rh, rw * 2, rh * 2);
  };

  // Warm overhead softbox key
  addSoftbox(w * 0.35, h * 0.16, 150, 56, '255,248,235', 1.0);
  addSoftbox(w * 0.72, h * 0.18, 120, 48, '255,248,235', 0.92);
  // Neutral silver side studio reflectors (0xe4e4e7) for crisp metallic bevel highlights
  addSoftbox(w * 0.14, h * 0.44, 65, 78, '228,228,231', 0.90);
  addSoftbox(w * 0.56, h * 0.42, 72, 74, '228,228,231', 0.88);
  addSoftbox(w * 0.88, h * 0.45, 68, 76, '228,228,231', 0.85);
  // Subtle warm champagne gold edge accent
  addSoftbox(w * 0.78, h * 0.34, 58, 42, '229,169,60', 0.42);

  const envTex = new THREE.CanvasTexture(c);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.encoding = THREE.sRGBEncoding;
  envTex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(envTex);
  envTex.dispose();
  pmrem.dispose();

  studioEnvCache.set(renderer, envRT.texture);
  return envRT.texture;
}

function makeFloorGlowTex() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 124);
  g.addColorStop(0.00, 'rgba(255,255,255,0.42)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.16)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.04)');
  g.addColorStop(1.00, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

function makeBrushedMetalTex(baseHex, streakRgb, width = 256, height = 256) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(${streakRgb},${(Math.random() * 0.065).toFixed(3)})`;
    ctx.fillRect(0, Math.random() * height, width, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.encoding = THREE.sRGBEncoding;
  return t;
}

function makeCarbonPerfTex() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#09090b';
  for (let y = 4; y < 128; y += 12) {
    for (let x = 4; x < 128; x += 12) {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

function makeLabelTex(opts) {
  const W = opts.w || 512, H = opts.h || 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = opts.bg || '#111111';
  ctx.fillRect(0, 0, W, H);

  if (opts.grid) {
    ctx.strokeStyle = opts.gridColor || 'rgba(229,169,60,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  if (opts.border) {
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = opts.borderW || 4;
    ctx.strokeRect(6, 6, W - 12, H - 12);
  }
  if (opts.stripe) {
    ctx.fillStyle = opts.stripe;
    ctx.fillRect(0, H - 18, W, 18);
  }
  if (opts.tag) {
    ctx.fillStyle = opts.tagColor || '#E5A93C';
    ctx.font = `bold ${Math.round(H * 0.09)}px monospace`;
    ctx.fillText(opts.tag, 22, Math.round(H * 0.22));
  }
  if (opts.title) {
    ctx.fillStyle = opts.titleColor || '#F5F5F5';
    ctx.font = `bold ${opts.titleSize || Math.round(H * 0.20)}px sans-serif`;
    ctx.fillText(opts.title, 22, Math.round(H * 0.54));
  }
  if (opts.sub) {
    ctx.fillStyle = opts.subColor || '#A1A1AA';
    ctx.font = `bold ${opts.subSize || Math.round(H * 0.11)}px monospace`;
    ctx.fillText(opts.sub, 22, Math.round(H * 0.78));
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.encoding = THREE.sRGBEncoding;
  return t;
}

function makeVerticalTelemetryTex(labelText) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 768;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, 256, 768);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 256; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 768); ctx.stroke(); }
  for (let y = 0; y < 768; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(229,169,60,0.48)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 752);

  ctx.fillStyle = '#141414';
  ctx.fillRect(16, 20, 224, 44);
  ctx.fillStyle = '#F5F5F5';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(labelText || 'HYTE Y70 · TOUCH', 26, 48);

  const drawGauge = (cx, cy, r, val, unit, sub, col) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = '#242424';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 1.95);
    ctx.strokeStyle = col;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#F5F5F5';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val + unit, cx, cy + 8);
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '600 12px monospace';
    ctx.fillText(sub, cx, cy + 32);
    ctx.textAlign = 'left';
  };
  drawGauge(128, 175, 58, '52', '°C', 'CPU 5.7GHz', '#E5A93C');
  drawGauge(128, 345, 58, '61', '°C', 'GPU 98% LOAD', '#10B981');

  ctx.fillStyle = '#F5F5F5';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('240 FPS', 128, 475);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('1% LOW · 212 FPS', 128, 504);
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#E5A93C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const px = 22 + i * 9;
    const py = 640 - Math.sin(i * 0.6) * 22 - (i % 3) * 4;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '12px monospace';
  ctx.fillText('OCCT VERIFIED · 4.1ms', 24, 725);

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function makeTelemetryScreenTex(mode, labelText) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 320); ctx.stroke(); }
  for (let y = 0; y < 320; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(229,169,60,0.42)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 304);

  ctx.fillStyle = '#141414';
  ctx.fillRect(18, 18, 476, 40);
  ctx.fillStyle = '#F5F5F5';
  ctx.font = '600 16px monospace';
  ctx.fillText(labelText || 'FORGE SYSTEM MONITOR', 28, 44);

  const drawGauge = (cx, cy, r, val, unit, sub, col) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = '#242424';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 1.95);
    ctx.strokeStyle = col;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = '#F5F5F5';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val + unit, cx, cy + 6);
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '600 12px monospace';
    ctx.fillText(sub, cx, cy + 28);
    ctx.textAlign = 'left';
  };
  drawGauge(105, 145, 52, '52', '°C', 'CPU 5.7GHz', '#E5A93C');
  drawGauge(255, 145, 52, '61', '°C', 'GPU 98%', '#10B981');

  ctx.fillStyle = '#F5F5F5';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('240 FPS', 345, 125);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('1% LOW  212', 345, 152);
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '13px monospace';
  ctx.fillText('COOLANT 31.2C', 345, 178);

  ctx.strokeStyle = '#E5A93C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const px = 28 + i * 13;
    const py = 268 - Math.sin(i * 0.5) * 12 - (i % 4) * 2.5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '12px monospace';
  ctx.fillText('FRAMETIME 4.1 ms · STABLE', 28, 296);

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

// Decode Base64 string -> ArrayBuffer
function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// Clone cached glTF scene cleanly with independent material instances
function cloneModelScene(src) {
  const clone = src.clone(true);
  clone.traverse(node => {
    if (node.isMesh && node.material) {
      if (Array.isArray(node.material)) {
        node.material = node.material.map(m => m ? m.clone() : m);
      } else {
        node.material = node.material.clone();
      }
    }
  });
  return clone;
}

// In-memory cached Blender .glb parser
function parseModelBase64(key) {
  if (!key || typeof window.FORGE_3D_MODELS === 'undefined' || !window.FORGE_3D_MODELS[key]) {
    return Promise.resolve(null);
  }
  const loader = getGltfLoader();
  if (!loader) return Promise.resolve(null);

  if (glbTemplateCache.has(key)) {
    return Promise.resolve(cloneModelScene(glbTemplateCache.get(key)));
  }
  if (glbPendingCache.has(key)) {
    return glbPendingCache.get(key).then(tpl => tpl ? cloneModelScene(tpl) : null);
  }

  const p = new Promise(resolve => {
    try {
      const buf = base64ToArrayBuffer(window.FORGE_3D_MODELS[key]);
      loader.parse(buf, '', gltf => {
        const sceneRoot = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (sceneRoot) {
          glbTemplateCache.set(key, sceneRoot);
          resolve(sceneRoot);
        } else {
          resolve(null);
        }
      }, err => {
        console.warn('GLB parse failed for', key, err);
        resolve(null);
      });
    } catch (e) {
      console.warn('GLB decode failed for', key, e);
      resolve(null);
    }
  }).finally(() => {
    glbPendingCache.delete(key);
  });

  glbPendingCache.set(key, p);
  return p.then(tpl => tpl ? cloneModelScene(tpl) : null);
}

// Auto-normalize any loaded GLB scene to fit cleanly around local (0,0,0) inside target dimensions
function normalizeGlbToBox(sceneRoot, targetW, targetH, targetD, uniform = true) {
  sceneRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(sceneRoot);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const wrapper = new THREE.Group();
  const sx = targetW / Math.max(size.x, 1e-4);
  const sy = targetH / Math.max(size.y, 1e-4);
  const sz = targetD / Math.max(size.z, 1e-4);

  if (uniform) {
    const s = Math.min(sx, sy, sz);
    sceneRoot.scale.multiplyScalar(s);
    sceneRoot.position.set(-center.x * s, -center.y * s, -center.z * s);
    sceneRoot.userData.normScale = s;
  } else {
    sceneRoot.scale.set(sceneRoot.scale.x * sx, sceneRoot.scale.y * sy, sceneRoot.scale.z * sz);
    sceneRoot.position.set(-center.x * sx, -center.y * sy, -center.z * sz);
    sceneRoot.userData.normScale = sx;
  }
  wrapper.add(sceneRoot);
  return wrapper;
}

// Resolve SKU ID -> Blender GLB model key (covers all 53 parts cleanly)
function getGlbKeyForPart(part) {
  if (!part) return null;
  const id = part.id || '';
  const cat = part.cat || '';
  const map = {
    // CPUs
    c1: 'cpu_processor', c2: 'cpu_processor', c6: 'cpu_processor',
    c3: 'cpu_am5', c4: 'cpu_am5', c5: 'cpu_am5',
    // Motherboards
    m1: 'motherboard', m2: 'motherboard', m3: 'motherboard', m5: 'motherboard', m6: 'motherboard',
    m4: 'motherboard_white',
    // Memory
    r1: 'ram_ddr5', r2: 'ram_ddr5', r4: 'ram_ddr5',
    r3: 'ram_dominator', r5: 'ram_dominator',
    // GPUs
    g1: 'gpu_rtx5060', g2: 'gpu_rx7900gre', g3: 'gpu_rtx5070',
    g4: 'gpu_rtx5070ti', g5: 'gpu_rtx5080', g6: 'gpu_rtx5090_fe',
    // Storage & PSU
    s1: 'ssd_nvme', s2: 'ssd_nvme', s3: 'ssd_nvme', s4: 'ssd_nvme', s5: 'ssd_nvme',
    p1: 'psu_unit', p2: 'psu_unit', p3: 'psu_unit', p4: 'psu_unit', p5: 'psu_unit',
    // Coolers
    k1: 'cooler_noctua_d15', k5: 'cooler_noctua_d15',
    k2: 'cooler_aio360', k4: 'cooler_aio360',
    k3: 'cooler_hydroshift_360',
    // Cases
    x1: 'case_chassis', x2: 'case_h6_white', x3: 'case_north_walnut',
    x4: 'case_y70_touch', x5: 'case_forge_titanium',
    // Accessories
    a1: 'custom_cables', a2: 'acc_unifan_lcd', a3: 'acc_paste',
    a4: 'acc_antisag', a5: 'acc_riser', a6: 'acc_sensor_panel',
    a7: 'acc_hub', a8: 'acc_contact_frame', a9: 'acc_fan_noctua', a10: 'acc_dust_filter'
  };
  if (map[id]) return map[id];
  const fallbackCat = {
    cpu: 'cpu_am5', mb: 'motherboard', ram: 'ram_ddr5', gpu: 'gpu_rtx5080',
    ssd: 'ssd_nvme', psu: 'psu_unit', cool: 'cooler_aio360', case: 'case_chassis', acc: 'acc_antisag'
  };
  return fallbackCat[cat] || null;
}

// Project clean upright [0..1]x[0..1] planar UVs onto thin LCD telemetry screen meshes
function ensurePlanarScreenUVs(obj) {
  if (!obj.geometry || !obj.geometry.attributes || !obj.geometry.attributes.position) return;
  const geo = obj.geometry.clone();
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const dx = bb.max.x - bb.min.x;
  const dy = bb.max.y - bb.min.y;
  const dz = bb.max.z - bb.min.z;
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let u = 0.5, v = 0.5;
    if (dx <= dy && dx <= dz) {
      // Thin along X (+X facing screen: right is -Z, up is +Y)
      u = (bb.max.z - z) / Math.max(dz, 1e-5);
      v = (y - bb.min.y) / Math.max(dy, 1e-5);
    } else if (dz <= dx && dz <= dy) {
      // Thin along Z (+Z facing screen: right is +X, up is +Y)
      u = (x - bb.min.x) / Math.max(dx, 1e-5);
      v = (y - bb.min.y) / Math.max(dy, 1e-5);
    } else {
      // Thin along Y (+Y facing screen: right is +X, up is -Z)
      u = (x - bb.min.x) / Math.max(dx, 1e-5);
      v = (bb.max.z - z) / Math.max(dz, 1e-5);
    }
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  obj.geometry = geo;
}

// Compute exact local thin axis for SpinFan meshes and center disc around local (0,0,0) to prevent wobble/clipping
function prepareSpinFanMesh(obj) {
  let axis = 'z';
  if (!obj.geometry) return axis;
  obj.geometry.computeBoundingBox();
  const bb = obj.geometry.boundingBox;
  const dx = bb.max.x - bb.min.x;
  const dy = bb.max.y - bb.min.y;
  const dz = bb.max.z - bb.min.z;
  if (dx <= dy && dx <= dz) axis = 'x';
  else if (dy <= dx && dy <= dz) axis = 'y';
  else axis = 'z';

  const cx = (bb.min.x + bb.max.x) * 0.5;
  const cy = (bb.min.y + bb.max.y) * 0.5;
  const cz = (bb.min.z + bb.max.z) * 0.5;
  const ox = axis === 'x' ? 0 : cx;
  const oy = axis === 'y' ? 0 : cy;
  const oz = axis === 'z' ? 0 : cz;
  if (Math.abs(ox) > 1e-4 || Math.abs(oy) > 1e-4 || Math.abs(oz) > 1e-4) {
    const g = obj.geometry.clone();
    g.translate(-ox, -oy, -oz);
    obj.geometry = g;
    const shift = new THREE.Vector3(ox, oy, oz).applyQuaternion(obj.quaternion);
    shift.multiply(obj.scale);
    obj.position.add(shift);
  }
  return axis;
}

// Wire dynamic RGB materials, LCD telemetry screens, glass visibility, and spinning fans inside a loaded GLB
function wireGlbInstance(root, opts) {
  opts = opts || {};
  const rgbColor = new THREE.Color(opts.rgbHex || 0xe5a93c);
  const part = opts.part || {};
  const pid = part.id || '';

  root.traverse(obj => {
    if (!obj.isMesh) return;
    const nm = obj.name || '';

    // Fan rotation registration (exact bounding-box thin axis + centered hub)
    if (nm.indexOf('SpinFan_') === 0 && opts.spinList) {
      const axis = prepareSpinFanMesh(obj);
      opts.spinList.push({ mesh: obj, axis });
    }

    // Tempered glass registration + exploded-view anchor
    if (nm.indexOf('Case_Glass') !== -1) {
      obj.userData.basePos = obj.position.clone();
      obj.userData.glassKind = nm.indexOf('Front') !== -1 ? 'front' : 'side';
      if (opts.glassRefs) opts.glassRefs.push(obj);
      obj.visible = opts.glassVisible !== undefined ? !!opts.glassVisible : true;
      obj.castShadow = false;
      obj.receiveShadow = false;
      if (obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = 0.065;
        obj.material.roughness = 0.04;
        obj.material.envMapIntensity = 0.28;
        obj.material.depthWrite = false;
      }
      return;
    }

    obj.castShadow = true;
    obj.receiveShadow = true;

    const mat = obj.material;
    if (!mat) return;
    const matName = mat.name || '';

    // Dynamic Case Body material tinting
    if (matName.indexOf('Mat_CaseBody') !== -1) {
      if (opts.caseBodyMats) opts.caseBodyMats.push(mat);
      if (opts.caseColorHex) mat.color.set(opts.caseColorHex);
    }

    // Non-RGB SKU overrides (e.g. r1 Vengeance Black, k1 Noctua Chromax)
    if (matName.indexOf('Mat_RGB_Dynamic') !== -1 || matName.indexOf('Mat_RGB_Secondary') !== -1 || nm.indexOf('RGB_') === 0) {
      if (pid === 'r1' || pid === 'k1') {
        mat.color.setHex(0x27272a);
        if (mat.emissive) mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
        mat.roughness = 0.32;
      } else if (pid === 'r3') {
        // Trident Z5 Royal gold/crystal accent
        mat.color.setHex(0xe5a93c);
        if (mat.emissive) mat.emissive.setHex(0xe5a93c);
        mat.emissiveIntensity = 1.65;
      } else {
        mat.color.copy(rgbColor);
        if (mat.emissive) mat.emissive.copy(rgbColor);
        mat.emissiveIntensity = matName.indexOf('Secondary') !== -1 ? 1.45 : 1.85;
        if (opts.rgbMatList) opts.rgbMatList.push(mat);
      }
    }

    // SKU-specific metallic highlights (e.g. m6 Gold VRM, p4 White PSU, r3 Chrome Royal, k5 Silver/Copper)
    if (pid === 'r3' && matName.indexOf('Mat_Titanium') !== -1) {
      mat.color.setHex(0xf4f4f5);
      mat.metalness = 0.96;
      mat.roughness = 0.09;
    } else if (pid === 'p4' && matName.indexOf('Mat_DarkMetal') !== -1) {
      mat.color.setHex(0xe4e4e7);
      mat.metalness = 0.55;
      mat.roughness = 0.28;
    } else if (pid === 'k5' && matName.indexOf('Mat_DarkMetal') !== -1) {
      mat.color.setHex(0xd4d4d8);
      mat.metalness = 0.88;
      mat.roughness = 0.22;
    } else if (pid === 'm6' && matName.indexOf('Mat_Titanium') !== -1) {
      mat.color.setHex(0xd99b26);
      mat.metalness = 0.92;
      mat.roughness = 0.18;
    }

    // Live LCD / Telemetry Screen surfaces (planar full-bleed UV mapped)
    if (matName.indexOf('Mat_LCD_Dynamic') !== -1 || nm.indexOf('LCD_') === 0) {
      ensurePlanarScreenUVs(obj);
      let tex = null;
      if (nm.indexOf('Y70') !== -1 || pid === 'x4') {
        tex = makeVerticalTelemetryTex('HYTE Y70 · 4K TOUCH');
      } else if (nm.indexOf('SensorPanel') !== -1 || pid === 'a6') {
        tex = makeTelemetryScreenTex('a6', 'FORGE 5.0" IPS · SENSOR HUD');
      } else if (nm.indexOf('PSU') !== -1) {
        tex = makeLabelTex({
          w: 512, h: 256, bg: '#0D0D0D', border: pid === 'p5' ? '#E5A93C' : '#10B981',
          tag: 'ATX 3.1 · PCIe 5.1', title: `${part.cap || 850}W`, sub: (part.name || 'FORGE PSU').slice(0, 22)
        });
      } else if (nm.indexOf('UniFan') !== -1 || pid === 'a2') {
        tex = makeLabelTex({ w: 128, h: 128, bg: '#0A0A0A', border: '#E5A93C', title: '31°C', sub: '1400 RPM' });
      } else if (nm.indexOf('HS_IPS') !== -1 || pid === 'k3') {
        tex = makeTelemetryScreenTex('k3', 'HYDROSHIFT 2.88" IPS · 31°C');
      } else {
        tex = makeLabelTex({
          w: 256, h: 256, bg: '#0A0A0A', border: '#E5A93C',
          tag: 'LIQUID TEMP', title: '31°C', sub: (part.name || '360 AIO').slice(0, 16)
        });
        if (nm.indexOf('AIO_PumpScreen') !== -1) {
          tex.center.set(0.5, 0.5);
          tex.rotation = Math.PI / 2;
        }
      }
      obj.material = new THREE.MeshBasicMaterial({ map: tex });
    }
  });
}

// ============================================================================
// 1. FULL PC CONFIGURATOR & SHOWCASE ENGINE (createPC) — ZERO CLIPPING
// ============================================================================
function createPC(canvas, opts) {
  opts = opts || {};
  const W = canvas.clientWidth || 600, H = canvas.clientHeight || 520;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.environment = getStudioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100);

  // Studio Lighting (Warm Titanium Key + Crisp Neutral Silver Fill + Dynamic Theme Rim — ZERO blue/cyan!)
  const initHex = (opts && opts.rgb) ? opts.rgb : ((typeof getTheme === 'function' && getTheme().hex) ? getTheme().hex : 0xe5a93c);
  const initCol = new THREE.Color(initHex);

  const amb = new THREE.AmbientLight(0xf4f4f5, 0.72);
  scene.add(amb);
  const hemi = new THREE.HemisphereLight(0xfff8eb, 0x0e0e10, 0.78);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff8eb, 1.82);
  key.position.set(6, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.bias = -0.0005;
  scene.add(key);

  const rim = new THREE.DirectionalLight(initCol, 1.12);
  rim.position.set(-7, 5, -6);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xe4e4e7, 0.88);
  fill.position.set(5, -3, 6);
  scene.add(fill);

  const rgbLight = new THREE.PointLight(initCol, 2.2, 8.5);
  rgbLight.position.set(0.15, 0.5, 0.25);
  scene.add(rgbLight);

  const rgbLight2 = new THREE.PointLight(initCol, 1.45, 7.5);
  rgbLight2.position.set(-0.2, -0.7, 0.5);
  scene.add(rgbLight2);

  // Shadow-receiving circular dark carbon studio floor + subtle radial studio pedestal glow
  const floorGeo = new THREE.CircleGeometry(9.5, 48);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.88, metalness: 0.08, envMapIntensity: 0.05, transparent: true, opacity: 0.65 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.55;
  floor.receiveShadow = true;
  scene.add(floor);

  const glowMat = new THREE.MeshBasicMaterial({
    map: makeFloorGlowTex(),
    color: initCol,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), glowMat);
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -2.535;
  scene.add(floorGlow);

  const grid = new THREE.GridHelper(16, 32, initCol, 0x1e1e22);
  grid.position.y = -2.54;
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  scene.add(grid);

  const root = new THREE.Group();
  scene.add(root);

  const metalTex = makeBrushedMetalTex('#1b1b1e', '255,248,235');
  const lightMetalTex = makeBrushedMetalTex('#e4e4e7', '24,24,27');
  const perfTex = makeCarbonPerfTex();

  const M = {
    caseBody: new THREE.MeshStandardMaterial({ color: 0x17171a, map: metalTex, metalness: 0.86, roughness: 0.26 }),
    caseInterior: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, map: perfTex, metalness: 0.78, roughness: 0.36 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f5, transparent: true, opacity: 0.14, roughness: 0.04, metalness: 0.08, depthWrite: false }),
    glassEdge: new THREE.MeshStandardMaterial({ color: initCol, transparent: true, opacity: 0.34, roughness: 0.1 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x0e0e10, metalness: 0.42, roughness: 0.50 }),
    pcbWhite: new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.32, roughness: 0.42 }),
    vrm: new THREE.MeshStandardMaterial({ color: 0x27272a, map: metalTex, metalness: 0.88, roughness: 0.22 }),
    vrmSilver: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, map: lightMetalTex, metalness: 0.88, roughness: 0.20 }),
    vrmGold: new THREE.MeshStandardMaterial({ color: 0xe5a93c, metalness: 0.92, roughness: 0.18 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xd97742, metalness: 0.92, roughness: 0.18 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xe5a93c, metalness: 0.95, roughness: 0.15 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xf4f4f5, metalness: 0.96, roughness: 0.10 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x1c1c1f, map: metalTex, metalness: 0.86, roughness: 0.26 }),
    whiteMetal: new THREE.MeshStandardMaterial({ color: 0xf4f4f5, map: lightMetalTex, metalness: 0.60, roughness: 0.28 }),
    walnutWood: new THREE.MeshStandardMaterial({ color: 0x6b4226, metalness: 0.08, roughness: 0.62 }),
    cableDark: new THREE.MeshStandardMaterial({ color: 0x161618, metalness: 0.35, roughness: 0.58 }),
    cableAccent: new THREE.MeshStandardMaterial({ color: initCol, emissive: initCol, emissiveIntensity: 0.22, metalness: 0.55, roughness: 0.36 }),
    rgb: new THREE.MeshStandardMaterial({ color: initCol, emissive: initCol, emissiveIntensity: 1.85, roughness: 0.15 }),
    rgb2: new THREE.MeshStandardMaterial({ color: initCol, emissive: initCol, emissiveIntensity: 1.40, roughness: 0.20 }),
    screen: new THREE.MeshBasicMaterial({ color: initCol })
  };

  let dynamicRgbMats = [];
  let dynamicCaseMats = [];
  let dynamicGlassMeshes = [];
  let glbSpinFans = [];
  const spinFans = [];
  let currentHexStr = initCol.getStyle();
  let manualCaseHex = null;

  const groups = {};
  const slotGen = {};
  ['case', 'mb', 'cpu', 'cool', 'ram', 'gpu', 'ssd', 'psu', 'acc'].forEach(k => {
    const g = new THREE.Group();
    g.name = k;
    root.add(g);
    groups[k] = g;
    slotGen[k] = 0;
  });

  const HOME = {
    case: [0, 0, 0], mb: [0, 0, 0], cpu: [0, 0, 0], cool: [0, 0, 0],
    ram: [0, 0, 0], gpu: [0, 0, 0], ssd: [0, 0, 0], psu: [0, 0, 0], acc: [0, 0, 0]
  };
  // Architectural +X open-side layer explosion (BVH-verified 0 overlaps & 0 floor clips across expT in [0,1])
  const EXP = {
    case: [-1.15, 0, 0.16], psu: [-1.15, 0, 0.16], mb: [-0.45, 0, 0.04],
    cpu: [0.12, 0.04, -0.04], ssd: [0.12, -0.04, -0.04], ram: [0.68, 0.08, -0.08],
    cool: [1.22, -0.03, -0.22], acc: [1.52, 0.05, -0.52], gpu: [2.08, 0.18, -0.32]
  };
  const ACC_CUSTOM_EXP = {
    a1: [-0.45, 0.0, 0.04],
    a4: [1.52, -0.08, 0.14],
    a7: [-0.35, -0.05, 0.12],
    a8: [0.36, 0.06, -0.06],
    a9: [-1.15, 0.0, 0.16],
    a10: [-1.15, 0.26, 0.16]
  };

  function makeFan(radius, depth, hasRGB, bladeColor) {
    const fg = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.08, radius * 2.08, depth), M.darkMetal);
    fg.add(frame);
    const ringMat = hasRGB ? M.rgb : M.vrm;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, depth * 0.18, 12, 32), ringMat);
    ring.position.z = depth * 0.42;
    fg.add(ring);
    const blades = new THREE.Group();
    const bMat = bladeColor ? new THREE.MeshStandardMaterial({ color: bladeColor, metalness: 0.4, roughness: 0.4 }) : (hasRGB ? M.rgb2 : M.vrm);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, depth * 0.85, 20), M.chrome);
    hub.rotation.x = Math.PI / 2;
    blades.add(hub);
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.56, depth * 0.14, radius * 0.20), bMat);
      const a = (i / 9) * Math.PI * 2;
      b.position.set(Math.cos(a) * radius * 0.56, Math.sin(a) * radius * 0.56, 0);
      b.rotation.z = a + 0.42;
      b.rotation.y = 0.36;
      blades.add(b);
    }
    fg.add(blades);
    fg.userData.blades = blades;
    return fg;
  }

  function makeBraidedCable(pts, radius, count, isCustomSleeve, spreadAxis) {
    const cg = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(pts);
    const byY = (spreadAxis === 'y');
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * (radius * 2.40);
      const subPts = pts.map(p => byY
        ? new THREE.Vector3(p.x, p.y + off, p.z)
        : new THREE.Vector3(p.x, p.y, p.z + off)
      );
      const c2 = new THREE.CatmullRomCurve3(subPts);
      const geo = new THREE.TubeGeometry(c2, 20, radius, 8, false);
      const strandMat = (isCustomSleeve && i % 2 === 0) ? M.cableAccent : M.cableDark;
      cg.add(new THREE.Mesh(geo, strandMat));
    }
    if (isCustomSleeve) {
      [0.34, 0.68].forEach(t => {
        const pt = curve.getPoint(t);
        const combGeo = byY
          ? new THREE.BoxGeometry(radius * 3.8, count * radius * 2.55, radius * 2.8)
          : new THREE.BoxGeometry(radius * 3.8, radius * 2.8, count * radius * 2.55);
        const comb = new THREE.Mesh(combGeo, M.chrome);
        comb.position.copy(pt);
        cg.add(comb);
      });
    }
    return cg;
  }

  // Attach parsed Blender GLB asynchronously while keeping synchronous fallback immediate
  function attachGlbSlot(catKey, part, targetSize, pos, extraSetup) {
    const key = getGlbKeyForPart(part);
    if (!key) return;
    const gen = slotGen[catKey];
    parseModelBase64(key).then(sceneRoot => {
      if (!sceneRoot || slotGen[catKey] !== gen) return;
      const normalized = normalizeGlbToBox(sceneRoot, targetSize[0], targetSize[1], targetSize[2], true);
      normalized.position.set(pos[0], pos[1], pos[2]);
      normalized.userData.basePos = new THREE.Vector3(pos[0], pos[1], pos[2]);

      const localSpins = [];
      const localGlass = [];
      const localCaseMats = [];
      const localRgbMats = [];
      wireGlbInstance(normalized, {
        part,
        rgbHex: currentHexStr,
        caseColorHex: manualCaseHex,
        glassVisible,
        spinList: localSpins,
        glassRefs: localGlass,
        caseBodyMats: localCaseMats,
        rgbMatList: localRgbMats
      });

      const grp = groups[catKey];
      // Replace procedural fallback inside catKey (for single-part slots) or tagged wrapper (for acc)
      if (catKey !== 'acc') {
        while (grp.children.length) grp.remove(grp.children[0]);
        grp.add(normalized);
      } else {
        const old = grp.getObjectByName('accSlot_' + part.id);
        if (old) grp.remove(old);
        normalized.name = 'accSlot_' + part.id;
        normalized.userData.accId = part.id;
        grp.add(normalized);
      }

      if (extraSetup) extraSetup(normalized, grp);

      glbSpinFans.push(...localSpins);
      dynamicGlassMeshes.push(...localGlass);
      dynamicCaseMats.push(...localCaseMats);
      dynamicRgbMats.push(...localRgbMats);
    });
  }

  // 1. CHASSIS BUILDER (adapts to x1..x5 with CNC PSU telemetry window)
  function buildCase(casePart) {
    const g = groups.case;
    while (g.children.length) g.remove(g.children[0]);
    slotGen.case++;
    const cid = (casePart && casePart.id) || 'x1';

    if (manualCaseHex) M.caseBody.color.set(manualCaseHex);
    else if (cid === 'x2') M.caseBody.color.setHex(0xe4e4e7);
    else if (cid === 'x3') M.caseBody.color.setHex(0x1c1917);
    else if (cid === 'x5') M.caseBody.color.setHex(0x3f3f46);
    else M.caseBody.color.setHex(0x161618);

    const addBox = (w, h, d, x, y, z, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || M.caseBody);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };
    const isChamfer = (cid === 'x2' || cid === 'x4');
    const addChamferSlab = (xMin, xMax, zMin, zMax, chamXZ, h, yCenter, mat) => {
      // Shape in (x, -z) plane so rotateX(-PI/2) maps (sx, sy) -> (x, 0, -sy = z)
      const cx = chamXZ - zMax;
      const cz = chamXZ - xMax;
      const sh = new THREE.Shape();
      sh.moveTo(xMin, -zMax);
      sh.lineTo(Math.min(xMax, cx), -zMax);
      sh.lineTo(xMax, -Math.min(zMax, cz));
      sh.lineTo(xMax, -zMin);
      sh.lineTo(xMin, -zMin);
      sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mat || M.caseBody);
      m.position.y = yCenter - h * 0.5;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };

    if (isChamfer) {
      const topCham = (cid === 'x2') ? 2.65 : 2.80;
      const deckCham = (cid === 'x2') ? 2.48 : 2.62;
      addChamferSlab(-1.17, 1.17, -2.22, 2.22, topCham, 0.12, -2.30, M.caseBody);
      addChamferSlab(-1.17, 1.17, -2.22, 2.22, topCham, 0.12, 2.30, M.caseBody);
      addChamferSlab(-1.03, 1.03, -2.08, 2.08, deckCham, 0.05, -1.36, M.vrm);
    } else {
      addBox(2.35, 0.12, 4.45, 0, -2.30, 0);
      addBox(2.35, 0.12, 4.45, 0, 2.30, 0);
      addBox(2.10, 0.05, 4.18, 0.02, -1.36, 0, M.vrm);
      addBox(2.12, 0.03, 0.02, 0.02, -1.35, 2.12, M.rgb);
    }
    addBox(2.35, 4.48, 0.10, 0, 0, -2.18);
    addBox(0.08, 4.45, 4.25, -1.00, 0, 0, M.caseInterior);
    addBox(0.09, 0.50, 0.24, -0.98, 1.05, 1.34, M.darkMetal);
    addBox(0.09, 0.36, 0.28, -0.98, -1.07, 0.40, M.darkMetal);
    // Hollow PSU shroud skirt with CNC telemetry cutout revealing PSU bay
    addBox(0.05, 0.86, isChamfer ? 1.66 : 2.15, 1.05, -1.82, isChamfer ? 0.60 : 1.05, M.caseInterior);

    if (cid === 'x3') {
      addBox(2.35, 0.18, 0.14, 0, 2.22, 2.18, M.vrmGold);
      for (let i = -4; i <= 4; i++) addBox(0.16, 4.32, 0.12, i * 0.24, -0.04, 2.20, M.walnutWood);
    } else if (cid === 'x4') {
      const screenTex = makeVerticalTelemetryTex('HYTE Y70 · 4K TOUCH');
      const touchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.60, 3.85, 0.04), new THREE.MeshBasicMaterial({ map: screenTex }));
      touchMesh.position.set(0.84, 0.05, 1.86);
      touchMesh.rotation.y = Math.PI / 4;
      g.add(touchMesh);
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.52, 4.42, 0.05), M.glass);
      frontGlass.position.set(-0.32, 0, 2.18);
      frontGlass.userData.basePos = frontGlass.position.clone();
      frontGlass.userData.glassKind = 'front';
      frontGlass.name = 'Case_Glass_Front';
      frontGlass.visible = glassVisible;
      g.add(frontGlass);
    } else if (cid === 'x2') {
      addBox(1.56, 4.40, 0.08, -0.32, 0, 2.18, M.whiteMetal);
    } else {
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.25, 4.44, 0.06), M.glass);
      frontGlass.position.set(0, 0, 2.18);
      frontGlass.userData.basePos = frontGlass.position.clone();
      frontGlass.userData.glassKind = 'front';
      frontGlass.name = 'Case_Glass_Front';
      frontGlass.visible = glassVisible;
      g.add(frontGlass);
      if (cid === 'x5') addBox(2.36, 0.05, 4.46, 0, 2.22, 0, M.rgb);
    }

    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4.42, cid === 'x4' || cid === 'x2' ? 3.55 : 4.32), M.glass);
    sideGlass.position.set(1.15, 0, cid === 'x4' || cid === 'x2' ? -0.36 : 0);
    sideGlass.userData.basePos = sideGlass.position.clone();
    sideGlass.userData.glassKind = 'side';
    sideGlass.name = 'sideGlass';
    sideGlass.visible = glassVisible;
    g.add(sideGlass);
    const sideEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.44, 0.04), M.glassEdge);
    sideEdge.position.set(1.15, 0, cid === 'x4' || cid === 'x2' ? 1.42 : 2.16);
    sideEdge.userData.basePos = sideEdge.position.clone();
    sideEdge.userData.glassKind = 'side';
    sideEdge.name = 'sideGlassEdge';
    sideEdge.visible = glassVisible;
    g.add(sideEdge);

    [[-0.9, -2.44, -1.8], [0.9, -2.44, -1.8], [-0.9, -2.44, 1.8], [isChamfer ? 0.50 : 0.9, -2.44, isChamfer ? 1.50 : 1.8]].forEach(p => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.16, 20), M.chrome);
      foot.position.set(p[0], p[1], p[2]);
      g.add(foot);
    });

    const rFan = makeFan(0.52, 0.14, true);
    rFan.position.set(-0.30, 1.10, -2.06);
    g.add(rFan);
    spinFans.push(rFan);

    // Upgrade case asynchronously to Blender .glb
    attachGlbSlot('case', casePart || { id: 'x1', cat: 'case' }, [2.36, 4.86, 4.48], [0, -0.07, 0]);
  }

  // 2. COMPONENT BUILDER — BVH-VERIFIED ZERO CLIPPING & GLB HYDRATION
  function clearAndBuild(build) {
    spinFans.length = 0;
    glbSpinFans = [];
    dynamicRgbMats = [];
    dynamicCaseMats = [];
    dynamicGlassMeshes = [];

    buildCase(build.case);
    ['mb', 'cpu', 'cool', 'ram', 'gpu', 'ssd', 'psu', 'acc'].forEach(k => {
      slotGen[k]++;
      const g = groups[k];
      while (g.children.length) g.remove(g.children[0]);
    });

    const hasCustomCables = build.acc && (Array.isArray(build.acc) ? build.acc.some(a => a && a.id === 'a1') : build.acc.id === 'a1');

    // MOTHERBOARD
    if (build.mb) {
      const g = groups.mb;
      const mid = build.mb.id || 'm1';
      const isWhite = (mid === 'm4');
      const isGold = (mid === 'm6');
      const pcbMat = isWhite ? M.pcbWhite : M.pcb;
      const sinkMat = isWhite ? M.vrmSilver : (isGold ? M.vrmGold : M.vrm);

      const board = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.84, 2.44), pcbMat);
      board.position.set(-0.88, 0.46, -0.18);
      board.castShadow = true;
      g.add(board);

      const vrm1 = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.12, 0.36), sinkMat);
      vrm1.position.set(-0.78, 1.25, -1.12);
      g.add(vrm1);
      const vrm2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 1.04), sinkMat);
      vrm2.position.set(-0.78, 1.75, -0.45);
      g.add(vrm2);

      const vrmLogo = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.42, 0.28), isGold ? M.gold : M.rgb);
      vrmLogo.position.set(-0.77, 1.35, -1.12);
      g.add(vrmLogo);

      const pch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.60, 0.70), sinkMat);
      pch.position.set(-0.82, -0.35, 0.45);
      g.add(pch);

      [-0.22, -0.68].forEach(yPos => {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 1.15), M.chrome);
        slot.position.set(-0.82, yPos, -0.32);
        g.add(slot);
      });

      const makeMb24Pin = () => makeBraidedCable([
        new THREE.Vector3(-0.74, 1.08, 1.05),
        new THREE.Vector3(-0.66, 1.08, 1.17),
        new THREE.Vector3(-0.92, 1.08, 1.30)
      ], 0.013, 6, false, 'y');

      if (!hasCustomCables) g.add(makeMb24Pin());

      // Attach MB GLB and keep cable in rig-space grp (never child of translated glb!)
      attachGlbSlot('mb', build.mb, [0.32, 2.86, 2.46], [-0.82, 0.46, -0.18], (_glb, grp) => {
        if (!hasCustomCables) grp.add(makeMb24Pin());
      });
    }

    // CPU
    if (build.cpu) {
      const g = groups.cpu;
      const isAMD = (build.cpu.socket === 'AM5');
      const sub = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.48), new THREE.MeshStandardMaterial({ color: isAMD ? 0x115e59 : 0x18181b, metalness: 0.5, roughness: 0.4 }));
      sub.position.set(-0.77, 1.25, -0.50);
      g.add(sub);
      const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.05, isAMD ? 0.40 : 0.44, isAMD ? 0.40 : 0.34), M.chrome);
      ihs.position.set(-0.74, 1.25, -0.50);
      g.add(ihs);

      attachGlbSlot('cpu', build.cpu, [0.08, 0.48, 0.48], [-0.76, 1.25, -0.50]);
    }

    // COOLER (Centered over CPU z=-0.50, y=1.25 with stepped VRM/RAM/hose clearance — 0 overlap across Air & 360 AIO)
    if (build.cool) {
      const g = groups.cool;
      const kid = build.cool.id || 'k2';
      if (build.cool.type === 'air') {
        const finMat = (kid === 'k1') ? M.darkMetal : M.vrmSilver;
        const bladeCol = (kid === 'k1') ? 0x18181b : null;
        [-0.74, -0.26].forEach(zOff => {
          const stack = new THREE.Group();
          for (let i = 0; i < 16; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.018, 0.30), finMat);
            fin.position.set(-0.21, 0.90 + i * 0.044, zOff);
            stack.add(fin);
          }
          g.add(stack);
        });
        for (let i = -2; i <= 2; i++) {
          const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.78, 12), (kid === 'k1') ? M.darkMetal : M.copper);
          hp.rotation.z = Math.PI / 2;
          hp.position.set(-0.26, 1.25 + i * 0.08, -0.50);
          g.add(hp);
        }
        [-0.94, -0.50].forEach(zPos => {
          const f = makeFan(0.38, 0.08, kid !== 'k1', bladeCol);
          f.position.set(-0.21, 1.25, zPos);
          g.add(f);
          spinFans.push(f);
        });
        attachGlbSlot('cool', build.cool, [0.96, 1.08, 0.92], [-0.21, 1.25, -0.54]);
      } else {
        const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.22, 32), M.darkMetal);
        pump.rotation.z = Math.PI / 2;
        pump.position.set(-0.58, 1.25, -0.50);
        g.add(pump);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 16, 36), M.rgb);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(-0.44, 1.25, -0.50);
        g.add(ring);

        const lcdTex = (kid === 'k3')
          ? makeTelemetryScreenTex('k3', 'HYDROSHIFT 2.88" IPS · 31°C')
          : makeLabelTex({ w: 256, h: 256, bg: '#0A0A0A', border: '#E5A93C', tag: 'LIQUID TEMP', title: '31°C', sub: build.cool.name.slice(0, 16) });
        const lcdGeo = (kid === 'k3') ? new THREE.BoxGeometry(0.016, 0.44, 0.44) : new THREE.CircleGeometry(0.24, 32);
        const lcd = new THREE.Mesh(lcdGeo, new THREE.MeshBasicMaterial({ map: lcdTex }));
        if (kid !== 'k3') lcd.rotation.y = Math.PI / 2;
        lcd.position.set(-0.415, 1.25, -0.50);
        g.add(lcd);

        const rad = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.18, 3.24), M.darkMetal);
        rad.position.set(-0.12, 2.04, 0.01);
        g.add(rad);
        [-1.00, 0.0, 1.00].forEach(zPos => {
          const f = makeFan(0.45, 0.10, true);
          f.rotation.x = Math.PI / 2;
          f.position.set(-0.12, 1.88, zPos);
          g.add(f);
          spinFans.push(f);
        });

        [-0.08, 0.08].forEach(dz => {
          const s = dz / 0.08; // -1 or +1 perpendicular lane
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.56, 1.585, -0.50 + 0.08 * s),
            new THREE.Vector3(-0.18 - 0.09 * s, 1.62, -0.05 + 0.09 * s),
            new THREE.Vector3(0.14 - 0.09 * s, 1.68, 0.95 + 0.07 * s),
            new THREE.Vector3(-0.12 - 0.10 * s, 1.78, 1.555 + 0.025 * s),
            new THREE.Vector3(-0.13 - 0.09 * s, 1.915, 1.555 + 0.025 * s)
          ]);
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.024, 10, false), M.darkMetal);
          g.add(tube);
        });
        const aioPosX = (kid === 'k3') ? -0.115 : -0.148;
        attachGlbSlot('cool', build.cool, [1.42, 1.28, 3.24], [aioPosX, 1.533, 0.013]);
      }
    }

    // RAM
    if (build.ram) {
      const g = groups.ram;
      const rid = build.ram.id || 'r2';
      const heatMat = (rid === 'r3') ? M.chrome : (rid === 'r5' ? M.vrmSilver : M.darkMetal);
      const hasRGB = (rid !== 'r1');
      for (let i = 0; i < 4; i++) {
        const zPos = 0.18 + i * 0.10;
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.86, 0.04), heatMat);
        stick.position.set(-0.68, 1.25, zPos);
        g.add(stick);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.88, 0.044), hasRGB ? M.rgb : M.gold);
        bar.position.set(-0.51, 1.25, zPos);
        g.add(bar);
      }
      attachGlbSlot('ram', build.ram, [0.36, 0.90, 0.40], [-0.64, 1.25, 0.34]);
    }

    // SSD
    if (build.ssd) {
      const g = groups.ssd;
      const sid = build.ssd.id || 's3';
      const ssdSink = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.92), (sid === 's3' || sid === 's4') ? M.darkMetal : M.vrm);
      ssdSink.position.set(-0.75, 0.26, -0.32);
      g.add(ssdSink);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.86), (sid === 's4' || sid === 's2') ? M.gold : M.rgb);
      strip.position.set(-0.75, 0.26, -0.32);
      g.add(strip);

      attachGlbSlot('ssd', build.ssd, [0.13, 0.22, 0.92], [-0.75, 0.26, -0.32]);
    }

    // GPU
    if (build.gpu) {
      const g = groups.gpu;
      const gid = build.gpu.id || 'g6';
      const is2Fan = (gid === 'g1');
      const isWhite = (gid === 'g2');
      const isFlagship = (gid === 'g5' || gid === 'g6');
      const L = is2Fan ? 2.15 : (isFlagship ? 2.98 : 2.68);
      const H = isFlagship ? 0.56 : 0.44;
      const W = 1.20;
      const cx = -0.15, cy = -0.22, cz = -0.04;

      const shroudMat = isWhite ? M.vrmSilver : M.darkMetal;
      const shroud = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), shroudMat);
      shroud.position.set(cx, cy, cz);
      shroud.castShadow = true;
      g.add(shroud);

      const fins = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, H * 0.68, L * 0.94), M.vrmSilver);
      fins.position.set(cx, cy, cz);
      g.add(fins);

      const gpuTitle = build.gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '');
      const bpTex = makeLabelTex({
        w: 512, h: 256,
        bg: isWhite ? '#E4E4E7' : '#141414',
        border: isFlagship ? '#E5A93C' : '#10B981',
        tag: 'FORGE PCIe 5.0 x16 VERIFIED',
        title: gpuTitle,
        titleColor: isWhite ? '#121211' : '#F5F5F5',
        sub: `${build.gpu.watt}W TDP · GDDR7 ARCHITECTURE`
      });
      const bp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.03, L * 0.98), [M.chrome, M.chrome, new THREE.MeshBasicMaterial({ map: bpTex }), M.chrome, M.chrome, M.chrome]);
      bp.position.set(cx, cy + H / 2 + 0.018, cz);
      g.add(bp);

      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, L * 0.82), isFlagship ? M.gold : M.rgb);
      ledBar.position.set(cx + W / 2 + 0.01, cy + H * 0.18, cz);
      g.add(ledBar);

      const fanCount = is2Fan ? 2 : 3;
      for (let i = 0; i < fanCount; i++) {
        const fz = cz + (i - (fanCount - 1) / 2) * (L / (fanCount + 0.15));
        const f = makeFan(0.35, 0.06, false, isWhite ? 0xd4d4d8 : 0x1c1c1f);
        f.rotation.x = Math.PI / 2;
        f.position.set(cx, cy - H / 2 - 0.02, fz);
        g.add(f);
        spinFans.push(f);
      }

      // Clean 12V-2x6 power lead routed outside shroud, above bottom fans, & below MB edge into lower grommet!
      const gpuOuterX = is2Fan ? 0.47 : 0.485;
      const makeGpu12VLead = (startX) => makeBraidedCable([
        new THREE.Vector3(startX, cy - 0.06, 0.38),
        new THREE.Vector3(startX + 0.035, cy - H / 2 - 0.14, 0.40),
        new THREE.Vector3(0.05, -0.94, 0.40),
        new THREE.Vector3(-0.52, -1.06, 0.40),
        new THREE.Vector3(-0.935, -1.07, 0.40)
      ], 0.012, 6, hasCustomCables, 'z');

      g.add(makeGpu12VLead(0.495));

      attachGlbSlot('gpu', build.gpu, [W, H + 0.04, L], [cx, cy, cz], (_glb, grp) => {
        grp.add(makeGpu12VLead(gpuOuterX));
      });
    }

    // PSU (visible cleanly through CNC PSU shroud window)
    if (build.psu) {
      const g = groups.psu;
      const pid = build.psu.id || 'p2';
      const psuMat = (pid === 'p4') ? M.whiteMetal : M.darkMetal;
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.70, 1.58), psuMat);
      box.position.set(-0.18, -1.86, -1.15);
      g.add(box);
      const pTex = makeLabelTex({
        w: 512, h: 256, bg: '#0A0A0A', border: pid === 'p5' ? '#E5A93C' : '#10B981',
        tag: 'ATX 3.1 · PCIe 5.1',
        title: `${build.psu.cap || 850}W`,
        sub: build.psu.name.slice(0, 22)
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.48, 1.28), new THREE.MeshBasicMaterial({ map: pTex }));
      plate.position.set(0.50, -1.86, -1.15);
      g.add(plate);

      attachGlbSlot('psu', build.psu, [1.36, 0.70, 1.58], [-0.18, -1.86, -1.15]);
    }

    // ACCESSORIES (a1..a10 — BVH-verified 0 overlaps even when all 10 are enabled simultaneously!)
    const accList = Array.isArray(build.acc) ? build.acc : (build.acc ? [build.acc] : []);
    if (accList.length) {
      const g = groups.acc;
      accList.forEach(acc => {
        if (!acc) return;
        const id = acc.id;
        const wrap = new THREE.Group();
        wrap.name = 'accSlot_' + id;
        wrap.userData.accId = id;
        wrap.userData.basePos = new THREE.Vector3(0, 0, 0);
        g.add(wrap);

        if (id === 'a1') {
          wrap.add(makeBraidedCable([
            new THREE.Vector3(-0.74, 1.08, 1.05),
            new THREE.Vector3(-0.64, 1.08, 1.17),
            new THREE.Vector3(-0.92, 1.08, 1.30)
          ], 0.013, 6, true, 'y'));
          attachGlbSlot('acc', acc, [0.26, 0.32, 0.34], [-0.74, 1.08, 1.21]);
        } else if (id === 'a2') {
          [-0.92, 0, 0.92].forEach(zPos => {
            const f = makeFan(0.43, 0.11, true);
            f.rotation.x = Math.PI / 2;
            f.position.set(-0.16, -1.25, zPos - 0.10);
            const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 24), M.screen);
            scr.rotation.x = Math.PI / 2;
            f.add(scr);
            wrap.add(f);
            spinFans.push(f);
          });
          attachGlbSlot('acc', acc, [0.92, 0.14, 2.70], [-0.16, -1.25, -0.10]);
        } else if (id === 'a3') {
          const syr = new THREE.Group();
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.48, 16), M.darkMetal);
          body.rotation.z = Math.PI / 2;
          syr.add(body);
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.18, 16), M.gold);
          band.rotation.z = Math.PI / 2;
          syr.add(band);
          const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.14, 16), M.chrome);
          tip.rotation.z = Math.PI / 2;
          tip.position.x = 0.28;
          syr.add(tip);
          syr.position.set(-0.54, -1.28, 1.52);
          wrap.add(syr);
          attachGlbSlot('acc', acc, [0.56, 0.12, 0.24], [-0.54, -1.28, 1.52]);
        } else if (id === 'a4') {
          const gid = (build.gpu && build.gpu.id) || 'g6';
          const gpuL = (gid === 'g1') ? 2.15 : ((gid === 'g5' || gid === 'g6') ? 2.98 : 2.68);
          const gpuH = (gid === 'g5' || gid === 'g6') ? 0.56 : 0.44;
          const gpuBottomY = -0.22 - (gpuH + 0.04) * 0.5;
          const shroudTopY = -1.325;
          const standH = Math.max(0.45, gpuBottomY - shroudTopY - 0.015);
          const gpuFrontZ = Math.max(0.72, Math.min(1.16, -0.04 + gpuL * 0.45 - 0.14));

          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.05, 20), M.darkMetal);
          base.position.set(0.46, shroudTopY + 0.025, gpuFrontZ);
          wrap.add(base);
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, standH, 16), M.chrome);
          rod.position.set(0.46, shroudTopY + standH * 0.5, gpuFrontZ);
          wrap.add(rod);
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.20), M.gold);
          arm.position.set(0.37, shroudTopY + standH - 0.02, gpuFrontZ);
          wrap.add(arm);
          attachGlbSlot('acc', acc, [0.35, standH, 0.27], [0.42, shroudTopY + standH * 0.5, gpuFrontZ]);
        } else if (id === 'a5') {
          const slot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 1.10), M.gold);
          slot.position.set(-0.38, -0.88, -0.35);
          wrap.add(slot);
          const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.90), M.darkMetal);
          ribbon.position.set(-0.56, -0.96, -0.35);
          ribbon.rotation.z = 0.28;
          wrap.add(ribbon);
          attachGlbSlot('acc', acc, [0.40, 0.28, 1.10], [-0.54, -0.96, -0.35]);
        } else if (id === 'a6') {
          const frame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.58, 0.84), M.darkMetal);
          frame.position.set(-0.79, 0.44, 1.34);
          wrap.add(frame);
          const hudTex = makeTelemetryScreenTex('a6', 'FORGE 5.0" IPS · SENSOR HUD');
          const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.50, 0.78), new THREE.MeshBasicMaterial({ map: hudTex }));
          lcd.position.set(-0.78, 0.44, 1.34);
          wrap.add(lcd);
          attachGlbSlot('acc', acc, [0.18, 0.58, 0.84], [-0.79, 0.44, 1.34]);
        } else if (id === 'a7') {
          const hub = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.40, 0.40), M.darkMetal);
          hub.position.set(-0.81, -0.82, 1.56);
          wrap.add(hub);
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.24), M.rgb);
          led.position.set(-0.81, -0.82, 1.56);
          wrap.add(led);
          attachGlbSlot('acc', acc, [0.14, 0.40, 0.40], [-0.81, -0.82, 1.56]);
        } else if (id === 'a8') {
          const cx = -0.745, cy = 1.25, cz = -0.50;
          const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.61), M.gold); bTop.position.set(cx, cy + 0.28, cz); wrap.add(bTop);
          const bBot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.61), M.gold); bBot.position.set(cx, cy - 0.28, cz); wrap.add(bBot);
          const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.50, 0.05), M.gold); bLeft.position.set(cx, cy, cz - 0.28); wrap.add(bLeft);
          const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.50, 0.05), M.gold); bRight.position.set(cx, cy, cz + 0.28); wrap.add(bRight);
          attachGlbSlot('acc', acc, [0.052, 0.62, 0.62], [cx, cy, cz]);
        } else if (id === 'a9') {
          const cid = (build.case && build.case.id) || 'x1';
          const isCham = (cid === 'x2' || cid === 'x4');
          const nfx = isCham ? -0.36 : 0.0;
          const nfz = isCham ? 1.88 : 1.95;
          const nf = makeFan(0.41, 0.12, false, 0x1c1917);
          nf.position.set(nfx, -0.64, nfz);
          wrap.add(nf);
          spinFans.push(nf);
          attachGlbSlot('acc', acc, [0.84, 0.84, 0.13], [nfx, -0.64, nfz]);
        } else {
          const fltFrame = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.025, 3.80), M.rgb2);
          fltFrame.position.set(0, 2.388, 0);
          wrap.add(fltFrame);
          const fltMesh = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.030, 3.66), M.caseInterior);
          fltMesh.position.set(0, 2.388, 0);
          wrap.add(fltMesh);
          attachGlbSlot('acc', acc, [1.88, 0.032, 3.80], [0, 2.388, 0]);
        }
      });
    }
  }

  // Thermal Airflow Particle Stream Group (stratified 3D lanes strictly clear of GPU/Cooler/Anti-Sag/45° Chamfer!)
  const airflowGroup = new THREE.Group();
  airflowGroup.visible = !!opts.airflow;
  root.add(airflowGroup);
  const airParticles = [];
  for (let i = 0; i < 28; i++) {
    const arrow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.013, 0.18, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xe5a93c : 0x10b981, transparent: true, opacity: 0.38 })
    );
    arrow.rotation.x = -0.52;
    const xLane = 0.64 + (i % 4) * 0.062;
    const zOrigin = -0.45 + Math.floor(i / 4) * 0.27;
    const phase = (i * 0.23) % 1.0;
    arrow.position.set(xLane, -1.08 + phase * 2.65, zOrigin - phase * 1.54);
    airflowGroup.add(arrow);
    airParticles.push({ mesh: arrow, xLane, zOrigin, speed: 0.022 + (i % 5) * 0.004 });
  }

  const currentBuild = { case: { id: 'x1' } };
  let glassVisible = true;

  // Smooth Inertial Orbit Camera & Target Focus System (with anti-floor-clipping guard)
  const defaultLook = Array.isArray(opts.lookOffset) ? opts.lookOffset : [0, -0.05, 0];
  let curRotY = 1.15, curRotX = 0.14, curDist = opts.dist || 9.6;
  let targetRotY = curRotY, targetRotX = curRotX, targetDist = curDist;
  const lookTarget = new THREE.Vector3(defaultLook[0], defaultLook[1], defaultLook[2]);
  const desiredLook = new THREE.Vector3(defaultLook[0], defaultLook[1], defaultLook[2]);
  let cameraOverride = false;
  let autoSpin = (opts.auto !== undefined) ? !!opts.auto : (opts.autoSpin !== false);
  let exploded = false, expT = 0, manualExp = null;
  let dragging = false, moved = false, lx = 0, ly = 0;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener('mousedown', e => { dragging = true; moved = false; lx = e.clientX; ly = e.clientY; autoSpin = false; cameraOverride = false; });
  window.addEventListener('mouseup', e => {
    if (dragging && !moved && opts.onPick) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const pickOrder = ['gpu', 'cool', 'ram', 'cpu', 'ssd', 'acc', 'mb', 'psu', 'case'];
      for (const catKey of pickOrder) {
        const grp = groups[catKey];
        if (grp && grp.children.length) {
          const hits = raycaster.intersectObjects(grp.children, true);
          if (hits.length && currentBuild[catKey]) {
            opts.onPick(catKey, currentBuild[catKey]);
            break;
          }
        }
      }
    }
    dragging = false;
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    if (Math.abs(e.clientX - lx) > 3 || Math.abs(e.clientY - ly) > 3) moved = true;
    targetRotY -= (e.clientX - lx) * 0.008;
    targetRotX = Math.max(-0.16, Math.min(0.72, targetRotX + (e.clientY - ly) * 0.008));
    lx = e.clientX;
    ly = e.clientY;
  });
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { dragging = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; autoSpin = false; cameraOverride = false; }
  }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
  window.addEventListener('touchmove', e => {
    if (!dragging || e.touches.length !== 1) return;
    targetRotY -= (e.touches[0].clientX - lx) * 0.008;
    targetRotX = Math.max(-0.16, Math.min(0.72, targetRotX + (e.touches[0].clientY - ly) * 0.008));
    lx = e.touches[0].clientX;
    ly = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cameraOverride = false;
    targetDist = Math.max(4.4, Math.min(15.5, targetDist + e.deltaY * 0.004));
  }, { passive: false });

  let rainbow = false, t = 0;
  function loop() {
    requestAnimationFrame(loop);
    t += 0.016;
    if (autoSpin && !cameraOverride) targetRotY += 0.0045;

    const damp = cameraOverride ? 0.14 : 0.16;
    curRotY += (targetRotY - curRotY) * damp;
    curRotX += (targetRotX - curRotX) * damp;
    curDist += (targetDist - curDist) * damp;
    lookTarget.lerp(desiredLook, 0.14);

    const targetExp = (manualExp !== null) ? manualExp : (exploded ? 1 : 0);
    expT += (targetExp - expT) * 0.16;

    Object.keys(groups).forEach(k => {
      const g = groups[k], h = HOME[k] || [0, 0, 0], x = EXP[k] || [0, 0, 0];
      g.position.set(h[0] + (x[0] - h[0]) * expT, h[1] + (x[1] - h[1]) * expT, h[2] + (x[2] - h[2]) * expT);
    });

    // Slide tempered glass panels cleanly outward during exploded view (both procedural & GLB)
    groups.case.children.forEach(ch => {
      if (ch.userData && ch.userData.basePos && ch.userData.glassKind) {
        const bp = ch.userData.basePos;
        if (ch.userData.glassKind === 'side') {
          ch.position.set(bp.x + 4.05 * expT, bp.y, bp.z - 0.36 * expT);
        } else {
          ch.position.set(bp.x, bp.y, bp.z + 0.95 * expT);
        }
      }
    });
    dynamicGlassMeshes.forEach(gm => {
      if (!gm.userData || !gm.userData.basePos) return;
      const bp = gm.userData.basePos;
      const invS = 1.0 / ((gm.parent && gm.parent.userData && gm.parent.userData.normScale) || 1.0);
      if (gm.userData.glassKind === 'side') {
        gm.position.set(bp.x + 4.05 * invS * expT, bp.y, bp.z - 0.36 * invS * expT);
      } else {
        gm.position.set(bp.x, bp.y, bp.z + 0.95 * invS * expT);
      }
    });

    // Apply per-accessory exploded-view trajectory overrides so chassis/CPU/roof accessories never cross
    groups.acc.children.forEach(ac => {
      const aid = ac.userData && ac.userData.accId;
      const bp = ac.userData && ac.userData.basePos;
      if (aid && bp && ACC_CUSTOM_EXP[aid]) {
        const wd = ACC_CUSTOM_EXP[aid];
        ac.position.set(
          bp.x + (wd[0] - EXP.acc[0]) * expT,
          bp.y + (wd[1] - EXP.acc[1]) * expT,
          bp.z + (wd[2] - EXP.acc[2]) * expT
        );
      }
    });

    spinFans.forEach(f => { if (f.userData.blades) f.userData.blades.rotation.z += 0.14; });
    glbSpinFans.forEach(item => {
      if (item.axis === 'x') item.mesh.rotateX(0.14);
      else if (item.axis === 'y') item.mesh.rotateY(0.14);
      else item.mesh.rotateZ(0.14);
    });

    if (airflowGroup.visible) {
      airParticles.forEach(p => {
        p.mesh.position.y += p.speed;
        p.mesh.position.z -= p.speed * 0.58;
        if (p.mesh.position.y > 1.58 || p.mesh.position.z < -1.68) {
          p.mesh.position.x = p.xLane;
          p.mesh.position.y = -1.08;
          p.mesh.position.z = p.zOrigin;
        }
      });
    }

    if (rainbow) {
      const col = new THREE.Color().setHSL((t * 0.18) % 1, 0.92, 0.56);
      const col2 = new THREE.Color().setHSL(((t * 0.18) + 0.28) % 1, 0.92, 0.56);
      M.rgb.color.copy(col); M.rgb.emissive.copy(col);
      M.rgb2.color.copy(col2); M.rgb2.emissive.copy(col2);
      M.cableAccent.color.copy(col); M.cableAccent.emissive.copy(col);
      dynamicRgbMats.forEach(m => { m.color.copy(col); if (m.emissive) m.emissive.copy(col); });
      rgbLight.color.copy(col);
      rgbLight2.color.copy(col2);
      glowMat.color.copy(col);
    }

    const effDist = Math.max(curDist, 4.4 + expT * 2.8);
    const camY = Math.max(-2.32, lookTarget.y + Math.sin(curRotX) * effDist + 0.15);
    camera.position.set(
      lookTarget.x + Math.sin(curRotY) * Math.cos(curRotX) * effDist,
      camY,
      lookTarget.z + Math.cos(curRotY) * Math.cos(curRotX) * effDist
    );
    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
  }
  clearAndBuild(currentBuild);
  loop();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  const api = {
    get glass() { return glassVisible; },
    set(cat, part, animate) {
      if (cat === 'acc') {
        if (!part) delete currentBuild.acc;
        else if (Array.isArray(part)) currentBuild.acc = part.slice();
        else {
          const prev = Array.isArray(currentBuild.acc) ? currentBuild.acc : (currentBuild.acc ? [currentBuild.acc] : []);
          if (!prev.some(a => a && a.id === part.id)) prev.push(part);
          currentBuild.acc = prev;
        }
      } else {
        if (!part) delete currentBuild[cat];
        else currentBuild[cat] = part;
      }
      clearAndBuild(currentBuild);
      const sg = groups.case.getObjectByName('sideGlass');
      const sge = groups.case.getObjectByName('sideGlassEdge');
      if (sg) sg.visible = glassVisible;
      if (sge) sge.visible = glassVisible;
    },
    updateBuild(b) {
      Object.keys(currentBuild).forEach(k => delete currentBuild[k]);
      Object.assign(currentBuild, b || {});
      clearAndBuild(currentBuild);
    },
    setRGB(hex) {
      if (hex === 'rainbow') { rainbow = true; return; }
      rainbow = false;
      const c = new THREE.Color(hex);
      currentHexStr = c.getStyle();
      [M.rgb, M.rgb2, M.cableAccent].forEach(m => { m.color.copy(c); m.emissive.copy(c); });
      dynamicRgbMats.forEach(m => { m.color.copy(c); if (m.emissive) m.emissive.copy(c); });
      M.glassEdge.color.copy(c);
      rgbLight.color.copy(c);
      rgbLight2.color.copy(c);
      rim.color.copy(c);
      glowMat.color.copy(c);
    },
    setCaseColor(hex) {
      manualCaseHex = hex || null;
      if (hex) {
        M.caseBody.color.set(hex);
        dynamicCaseMats.forEach(m => m.color.set(hex));
      }
    },
    explode(val) { manualExp = null; exploded = (val !== undefined) ? !!val : !exploded; return exploded; },
    setExplodeProgress(val) { manualExp = Math.max(0, Math.min(1, Number(val) || 0)); },
    setOrbit(ry, rx, d) {
      cameraOverride = true;
      autoSpin = false;
      if (ry !== undefined) targetRotY = ry;
      if (rx !== undefined) targetRotX = Math.max(-0.16, Math.min(0.72, rx));
      if (d !== undefined) targetDist = d;
    },
    toggleExplode() { manualExp = null; exploded = !exploded; return exploded; },
    setAuto(val) { autoSpin = !!val; cameraOverride = false; return autoSpin; },
    toggleSpin() { autoSpin = !autoSpin; cameraOverride = false; return autoSpin; },
    setAirflow(val) { airflowGroup.visible = !!val; return airflowGroup.visible; },
    setGlass(val) {
      glassVisible = !!val;
      const sg = groups.case.getObjectByName('sideGlass');
      const sge = groups.case.getObjectByName('sideGlassEdge');
      const fg = groups.case.getObjectByName('Case_Glass_Front');
      if (sg) sg.visible = glassVisible;
      if (sge) sge.visible = glassVisible;
      if (fg) fg.visible = glassVisible;
      dynamicGlassMeshes.forEach(m => { m.visible = glassVisible; });
      return glassVisible;
    },
    snapshot() {
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    },
    resetView() {
      curRotY = targetRotY = 1.15;
      curRotX = targetRotX = 0.14;
      curDist = targetDist = opts.dist || 9.6;
      exploded = false;
      manualExp = null;
      expT = 0;
      lookTarget.set(defaultLook[0], defaultLook[1], defaultLook[2]);
      desiredLook.set(defaultLook[0], defaultLook[1], defaultLook[2]);
      cameraOverride = false;
    },
    focusComponent(cat, partId) {
      cameraOverride = true;
      autoSpin = false;
      const focusMap = {
        cpu: { look: [-0.62, 1.25, -0.50], ry: 0.85, rx: 0.12, d: 4.5 },
        mb: { look: [-0.62, 0.52, -0.18], ry: 0.78, rx: 0.10, d: 5.5 },
        ram: { look: [-0.52, 1.25, 0.34], ry: 0.72, rx: 0.14, d: 4.4 },
        gpu: { look: [-0.12, -0.22, 0.05], ry: 0.66, rx: 0.08, d: 5.0 },
        ssd: { look: [-0.62, 0.26, -0.32], ry: 0.82, rx: 0.08, d: 4.5 },
        psu: { look: [-0.05, -1.82, -1.08], ry: 1.02, rx: 0.04, d: 5.1 },
        cool: { look: [-0.20, 1.48, -0.22], ry: 0.75, rx: 0.18, d: 5.2 },
        case: { look: [0.00, 0.00, 0.00], ry: 0.62, rx: 0.15, d: 7.6 },
        acc: { look: [-0.15, -0.55, 1.05], ry: 0.68, rx: 0.08, d: 5.1 }
      };
      const accFocus = {
        a1: { look: [-0.72, 1.05, 1.15], ry: 0.90, rx: 0.08, d: 4.3 },
        a2: { look: [-0.16, -1.18, -0.05], ry: 0.72, rx: 0.22, d: 4.9 },
        a3: { look: [-0.48, -1.22, 1.48], ry: 0.78, rx: 0.16, d: 4.1 },
        a4: { look: [0.32, -0.82, 0.85], ry: 0.74, rx: 0.08, d: 4.3 },
        a5: { look: [-0.46, -0.92, -0.35], ry: 0.82, rx: 0.06, d: 4.5 },
        a6: { look: [-0.72, 0.44, 1.30], ry: 0.92, rx: 0.06, d: 4.3 },
        a7: { look: [-0.75, -0.82, 1.52], ry: 0.92, rx: 0.08, d: 4.2 },
        a8: { look: [-0.66, 1.25, -0.50], ry: 0.84, rx: 0.10, d: 4.1 },
        a9: { look: [-0.10, -0.64, 1.85], ry: 0.58, rx: 0.08, d: 4.8 },
        a10: { look: [0, 1.85, 0], ry: 0.65, rx: 0.42, d: 5.6 }
      };
      if (partId && accFocus[partId]) focusMap.acc = accFocus[partId];
      const cfg = focusMap[cat] || focusMap.case;
      desiredLook.set(cfg.look[0], cfg.look[1], cfg.look[2]);
      targetRotY = cfg.ry;
      targetRotX = cfg.rx;
      targetDist = cfg.d;
    }
  };
  window.addEventListener('forge-theme', e => {
    if (e.detail && e.detail.hex) api.setRGB(e.detail.hex);
  });
  return api;
}

// ============================================================================
// 2. SINGLE COMPONENT 3D CAD VIEWER (createPartViewer) — 53 UNIQUE MODELS
// ============================================================================
function createPartViewer(canvas, part, opts) {
  opts = opts || {};
  const W = canvas.clientWidth || 520, H = canvas.clientHeight || 380;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.environment = getStudioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);

  const thHex = (typeof getTheme === 'function' && getTheme().hex) ? getTheme().hex : 0xe5a93c;
  const thCol = new THREE.Color(thHex);
  scene.add(new THREE.AmbientLight(0xf4f4f5, 0.80));
  scene.add(new THREE.HemisphereLight(0xfff8eb, 0x0e0e10, 0.84));
  const key = new THREE.DirectionalLight(0xfff8eb, 1.88);
  key.position.set(5, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(thCol, 1.20);
  rim.position.set(-6, 4, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xe4e4e7, 0.92);
  fill.position.set(4, -5, 4);
  scene.add(fill);

  // Subtle radial studio pedestal glow under standalone part
  const glowMat = new THREE.MeshBasicMaterial({
    map: makeFloorGlowTex(),
    color: thCol,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });
  const stageGlow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), glowMat);
  stageGlow.rotation.x = -Math.PI / 2;
  stageGlow.position.y = -1.64;
  scene.add(stageGlow);

  const grid = new THREE.GridHelper(10, 20, thCol, 0x1e1e22);
  grid.position.y = -1.65;
  grid.material.opacity = 0.20;
  grid.material.transparent = true;
  scene.add(grid);

  const root = new THREE.Group();
  scene.add(root);

  const pid = (part && part.id) || 'g6';
  const cat = (part && part.cat) || 'gpu';
  const name = (part && part.name) || 'FORGE Component';
  const spec = (part && part.spec) || '';

  const metalTex = makeBrushedMetalTex('#1b1b1e', '255,248,235');
  const silverTex = makeBrushedMetalTex('#e4e4e7', '24,24,27');

  const matDark = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, map: metalTex, metalness: 0.86, roughness: 0.24 });
  const matSilver = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, map: silverTex, metalness: 0.88, roughness: 0.19 });
  const matChrome = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, metalness: 0.96, roughness: 0.09 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xe5a93c, metalness: 0.94, roughness: 0.17 });
  const matCopper = new THREE.MeshStandardMaterial({ color: 0xd97742, metalness: 0.92, roughness: 0.18 });
  const matThemeLED = new THREE.MeshStandardMaterial({ color: thCol, emissive: thCol, emissiveIntensity: 1.65, roughness: 0.18 });
  const matEmerald = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.35, roughness: 0.20 });

  const spinTargets = [];
  const glbSpinTargets = [];
  const rgbMats = [matThemeLED];

  function makeMiniFan(r, d, hasRGB, bladeHex) {
    const fg = new THREE.Group();
    fg.add(new THREE.Mesh(new THREE.BoxGeometry(r * 2.05, r * 2.05, d), matDark));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.90, d * 0.16, 12, 32), hasRGB ? matThemeLED : matSilver);
    ring.position.z = d * 0.42;
    fg.add(ring);
    const blades = new THREE.Group();
    const bMat = new THREE.MeshStandardMaterial({ color: bladeHex || 0x27272a, metalness: 0.5, roughness: 0.35 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.30, r * 0.30, d * 0.88, 20), matChrome);
    hub.rotation.x = Math.PI / 2;
    blades.add(hub);
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(r * 0.54, d * 0.14, r * 0.18), bMat);
      const a = (i / 9) * Math.PI * 2;
      b.position.set(Math.cos(a) * r * 0.54, Math.sin(a) * r * 0.54, 0);
      b.rotation.z = a + 0.4;
      b.rotation.y = 0.35;
      blades.add(b);
    }
    fg.add(blades);
    spinTargets.push(blades);
    return fg;
  }

  // Synchronous PBR Procedural Fallback (Immediate first frame)
  if (cat === 'cpu') {
    const isAMD = (part.socket === 'AM5');
    const subCol = isAMD ? 0x0f5248 : 0x18181b;
    const sub = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 0.14), new THREE.MeshStandardMaterial({ color: subCol, metalness: 0.45, roughness: 0.42 }));
    root.add(sub);
    for (let i = -3; i <= 3; i++) {
      const padT = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), matGold); padT.position.set(i * 0.24, 0.96, 0.02); root.add(padT);
      const padB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), matGold); padB.position.set(i * 0.24, -0.96, 0.02); root.add(padB);
    }
    const ihsTex = makeLabelTex({
      w: 512, h: 512, bg: '#D4D4D8', border: '#71717A', borderW: 8,
      tag: isAMD ? 'AMD RYZEN · AM5 ZEN 5' : 'INTEL CORE ULTRA · SERIES 2',
      tagColor: '#27272A',
      title: name.replace('AMD ', '').replace('Intel ', ''),
      titleColor: '#121211', titleSize: 44,
      sub: `${spec} · DIFFUSED SILICON`,
      subColor: '#242422', subSize: 24
    });
    const ihsW = isAMD ? 1.58 : 1.42, ihsH = isAMD ? 1.58 : 1.78;
    const ihsMats = [matSilver, matSilver, matSilver, matSilver, new THREE.MeshStandardMaterial({ map: ihsTex, metalness: 0.75, roughness: 0.25 }), matSilver];
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(ihsW, ihsH, 0.18), ihsMats);
    ihs.position.z = 0.14;
    root.add(ihs);
  } else if (cat === 'mb') {
    const isWhite = (pid === 'm4');
    const isGold = (pid === 'm6');
    const pcbMat = new THREE.MeshStandardMaterial({ color: isWhite ? 0xe4e4e7 : 0x111113, metalness: 0.42, roughness: 0.48 });
    const armorMat = isWhite ? matSilver : (isGold ? matGold : matDark);

    const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.85, 0.12), pcbMat);
    root.add(pcb);
    const vrmTex = makeLabelTex({
      w: 512, h: 160, bg: isWhite ? '#E4E4E7' : '#141414', border: isGold ? '#E5A93C' : '#10B981',
      tag: part.socket || 'PCIe 5.0', title: name.replace('ASUS ', '').replace('MSI ', '').replace('Gigabyte ', '').slice(0, 18),
      titleColor: isWhite ? '#121211' : '#F5F5F5', sub: spec.slice(0, 28)
    });
    const vrmL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.35, 0.32), [armorMat, armorMat, armorMat, armorMat, new THREE.MeshBasicMaterial({ map: vrmTex }), armorMat]);
    vrmL.position.set(-0.85, 0.62, 0.20);
    root.add(vrmL);
    const vrmT = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.28), armorMat);
    vrmT.position.set(-0.08, 1.15, 0.18);
    root.add(vrmT);
    const sock = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.68, 0.12), matChrome);
    sock.position.set(-0.08, 0.55, 0.10);
    root.add(sock);
    for (let i = 0; i < 4; i++) {
      const dimm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.12, 0.14), i % 2 === 0 ? matSilver : matDark);
      dimm.position.set(0.48 + i * 0.12, 0.58, 0.10);
      root.add(dimm);
    }
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.65, 0.18), armorMat);
    m2.position.set(0.05, -0.62, 0.12);
    root.add(m2);
    [-0.18, -1.05].forEach(y => {
      const sl = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.09, 0.15), matChrome);
      sl.position.set(-0.18, y, 0.10);
      root.add(sl);
    });
  } else if (cat === 'ram') {
    const isRoyal = (pid === 'r3');
    const isDom = (pid === 'r5');
    const hasRGB = (pid !== 'r1');
    const spreadMat = isRoyal ? matChrome : (isDom ? matSilver : matDark);
    const ramTex = makeLabelTex({
      w: 512, h: 160, bg: isRoyal ? '#E4E4E7' : '#121211', border: '#E5A93C',
      tag: 'DDR5 DUAL-CHANNEL KIT', title: name.replace('Corsair ', '').replace('G.Skill ', '').replace('Kingston ', '').slice(0, 20),
      titleColor: isRoyal ? '#121211' : '#F5F5F5', sub: spec
    });
    [-0.26, 0.26].forEach((zOff, idx) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.78, 0.14), [spreadMat, spreadMat, spreadMat, spreadMat, new THREE.MeshBasicMaterial({ map: ramTex }), spreadMat]);
      g.add(body);
      const pins = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 0.06), matGold);
      pins.position.y = -0.44;
      g.add(pins);
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.16, 0.16), hasRGB ? (isRoyal ? matGold : matThemeLED) : matSilver);
      topBar.position.y = 0.45;
      g.add(topBar);
      g.position.set(0, idx * 0.18 - 0.08, zOff);
      root.add(g);
    });
  } else if (cat === 'gpu') {
    const is2Fan = (pid === 'g1');
    const isWhite = (pid === 'g2');
    const isFlagship = (pid === 'g5' || pid === 'g6');
    const Wg = is2Fan ? 2.35 : (isFlagship ? 3.15 : 2.85);
    const Hg = isFlagship ? 1.28 : 1.15;
    const Dg = isFlagship ? 0.62 : 0.48;
    const shroudMat = isWhite ? matSilver : matDark;

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(Wg, Hg, Dg), shroudMat);
    root.add(shroud);
    root.add(new THREE.Mesh(new THREE.BoxGeometry(Wg * 0.94, Hg * 0.86, Dg * 0.82), matSilver));
    const nFans = is2Fan ? 2 : 3;
    for (let i = 0; i < nFans; i++) {
      const fx = (i - (nFans - 1) / 2) * (Wg / (nFans + 0.12));
      const f = makeMiniFan(Hg * 0.39, 0.10, isFlagship, isWhite ? 0xd4d4d8 : 0x1c1c1f);
      f.position.set(fx, 0, Dg / 2 + 0.03);
      root.add(f);
    }
    const gpuTex = makeLabelTex({
      w: 512, h: 256, bg: isWhite ? '#E4E4E7' : '#111111', border: isFlagship ? '#E5A93C' : '#10B981',
      tag: `${part.watt || 300}W TDP · PCIe 5.0 x16`,
      title: name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', ''),
      titleColor: isWhite ? '#121211' : '#F5F5F5', sub: spec
    });
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(Wg * 0.92, 0.12, Dg * 0.92), [shroudMat, shroudMat, new THREE.MeshBasicMaterial({ map: gpuTex }), shroudMat, matThemeLED, shroudMat]);
    topPlate.position.y = Hg / 2 + 0.05;
    root.add(topPlate);
    const pcie = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.06), matGold);
    pcie.position.set(-0.35, -Hg / 2 - 0.06, -0.10);
    root.add(pcie);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, Hg * 1.25, Dg * 0.95), matChrome);
    bracket.position.set(-Wg / 2 - 0.04, -0.06, 0);
    root.add(bracket);
  } else if (cat === 'ssd') {
    const isGen5 = (pid === 's3' || pid === 's4');
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.78, 0.06), new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.4, roughness: 0.5 }));
    root.add(pcb);
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.66, 0.07), matGold);
    conn.position.x = 1.38;
    root.add(conn);
    const ssdTex = makeLabelTex({
      w: 512, h: 180, bg: '#111111', border: isGen5 ? '#E5A93C' : '#10B981',
      tag: isGen5 ? 'PCIe GEN 5.0 x4 NVMe M.2' : 'PCIe GEN 4.0 x4 NVMe M.2',
      title: name.replace('Samsung ', '').replace('WD Black ', '').replace('Crucial ', ''),
      sub: spec
    });
    const sinkH = isGen5 ? 0.36 : 0.18;
    const sink = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.76, sinkH), [matDark, matDark, matDark, matDark, new THREE.MeshBasicMaterial({ map: ssdTex }), matDark]);
    sink.position.set(-0.08, 0, sinkH / 2 + 0.03);
    root.add(sink);
  } else if (cat === 'psu') {
    const isWhite = (pid === 'p4');
    const isThor = (pid === 'p5');
    const pMat = isWhite ? matSilver : matDark;
    const psuTex = makeLabelTex({
      w: 512, h: 256, bg: isWhite ? '#E4E4E7' : '#0A0A0A', border: isThor ? '#E5A93C' : '#10B981',
      tag: isThor ? 'TITANIUM · DIGITAL LLC' : 'ATX 3.1 · NATIVE 12V-2x6',
      title: `${part.cap || 850}W`,
      titleColor: isWhite ? '#121211' : '#F5F5F5', sub: name
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.18, 1.85), [pMat, pMat, pMat, pMat, new THREE.MeshBasicMaterial({ map: psuTex }), pMat]);
    root.add(box);
    const fan = makeMiniFan(0.72, 0.08, isThor, isWhite ? 0xd4d4d8 : 0x1c1c1f);
    fan.rotation.x = -Math.PI / 2;
    fan.position.y = 0.60;
    root.add(fan);
  } else if (cat === 'cool') {
    if (part.type === 'air') {
      const isNoctua = (pid === 'k1');
      const fMat = isNoctua ? matDark : matSilver;
      [-0.52, 0.52].forEach(xOff => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.75, 1.32), fMat);
        tower.position.set(xOff, 0.05, 0);
        root.add(tower);
      });
      for (let i = -2; i <= 2; i++) {
        const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.95, 12), isNoctua ? matDark : matCopper);
        hp.position.set(i * 0.18, 0, 0);
        root.add(hp);
      }
      const f1 = makeMiniFan(0.62, 0.16, !isNoctua, isNoctua ? 0x27201c : 0x1c1c1f);
      f1.rotation.y = Math.PI / 2; f1.position.set(0, 0.05, 0); root.add(f1);
      const f2 = makeMiniFan(0.62, 0.16, !isNoctua, isNoctua ? 0x27201c : 0x1c1c1f);
      f2.rotation.y = Math.PI / 2; f2.position.set(0.96, 0.05, 0); root.add(f2);
    } else {
      const rad = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.28, 1.12), matDark);
      rad.position.y = 0.68;
      root.add(rad);
      [-1.02, 0, 1.02].forEach(xPos => {
        const f = makeMiniFan(0.48, 0.12, true);
        f.rotation.x = Math.PI / 2; f.position.set(xPos, 0.46, 0); root.add(f);
      });
      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.36, 32), matDark);
      pump.rotation.x = Math.PI / 2; pump.position.set(0, -0.68, 0.25); root.add(pump);
      const lcdTex = makeLabelTex({ w: 256, h: 256, bg: '#0A0A0A', border: '#E5A93C', tag: 'AIO TELEMETRY', title: '31°C', sub: name.slice(0, 16) });
      const lcd = new THREE.Mesh(new THREE.CircleGeometry(0.36, 32), new THREE.MeshBasicMaterial({ map: lcdTex }));
      lcd.position.set(0, -0.68, 0.44);
      root.add(lcd);
    }
  } else if (cat === 'case') {
    const isWhite = (pid === 'x2');
    const isWalnut = (pid === 'x3');
    const isTouch = (pid === 'x4');
    const cMat = isWhite ? matSilver : matDark;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.45, 2.35), new THREE.MeshPhysicalMaterial({ color: isWhite ? 0xf4f4f5 : 0x27272a, transparent: true, opacity: 0.26, roughness: 0.1, metalness: 0.2 }));
    root.add(frame);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.45, 2.36), cMat); bot.position.y = -1.02; root.add(bot);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.12, 2.36), cMat); top.position.y = 1.18; root.add(top);
    if (isWalnut) {
      for (let i = -3; i <= 3; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.25, 0.08), new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.62 }));
        slat.position.set(i * 0.21, 0.05, 1.18);
        root.add(slat);
      }
    } else if (isTouch) {
      const tScreen = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.15, 0.06), new THREE.MeshBasicMaterial({ map: makeTelemetryScreenTex('y70', 'HYTE Y70 · 4K TOUCH') }));
      tScreen.position.set(0.62, 0.08, 1.16);
      tScreen.rotation.y = -0.45;
      root.add(tScreen);
    }
    [-0.65, 0, 0.65].forEach(zPos => {
      const f = makeMiniFan(0.32, 0.09, true);
      f.rotation.y = Math.PI / 2; f.position.set(-0.72, 0.15, zPos); root.add(f);
    });
  } else {
    if (pid === 'a1') {
      for (let i = -4; i <= 4; i++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(i * 0.18, -1.15, 0),
          new THREE.Vector3(i * 0.18, 0.0, 0.38),
          new THREE.Vector3(i * 0.18, 1.15, 0)
        ]);
        const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.055, 12, false), i % 2 === 0 ? matGold : matDark);
        root.add(t);
      }
      [-0.38, 0.38].forEach(y => {
        const comb = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.24), matChrome);
        comb.position.set(0, y, 0.28);
        root.add(comb);
      });
    } else if (pid === 'a2') {
      [-1.08, 0, 1.08].forEach((xPos, i) => {
        const f = makeMiniFan(0.50, 0.16, true);
        f.position.set(xPos, 0, 0);
        const lcd = new THREE.Mesh(new THREE.CircleGeometry(0.20, 24), new THREE.MeshBasicMaterial({ map: makeLabelTex({ w: 128, h: 128, bg: '#0A0A0A', border: '#E5A93C', title: `${31 + i}°C` }) }));
        lcd.position.z = 0.10;
        f.add(lcd);
        root.add(f);
      });
    } else if (pid === 'a3') {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.85, 24), matDark); barrel.rotation.z = Math.PI / 4; root.add(barrel);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.95, 24), new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 })); label.rotation.z = Math.PI / 4; root.add(label);
      const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.95, 20), matSilver); plunger.rotation.z = Math.PI / 4; plunger.position.set(0.85, -0.85, 0); root.add(plunger);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.55, 20), matChrome); nozzle.rotation.z = Math.PI / 4; nozzle.position.set(-0.82, 0.82, 0); root.add(nozzle);
    } else if (pid === 'a4') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.65, 0.22, 28), matDark); base.position.y = -1.15; root.add(base);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.35, 24), matChrome); post.position.x = -0.25; root.add(post);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.42), matDark); arm.position.set(0.22, 0.35, 0); root.add(arm);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.38), matThemeLED); pad.position.set(0.42, 0.46, 0); root.add(pad);
    } else if (pid === 'a5') {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.35, 0.12), matDark); bracket.position.set(-0.35, 0.15, -0.35); root.add(bracket);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.24, 0.28), matGold); slot.position.set(0.15, -0.65, 0.25); root.add(slot);
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.05, 0.06), matSilver); ribbon.position.set(0.15, -0.10, 0); ribbon.rotation.x = 0.45; root.add(ribbon);
    } else if (pid === 'a6') {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 0.85), matDark); stand.position.y = -1.05; root.add(stand);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.18), matSilver); neck.position.y = -0.78; root.add(neck);
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.72, 0.18), matDark); bezel.position.y = 0.12; root.add(bezel);
      const hud = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.48, 0.04), new THREE.MeshBasicMaterial({ map: makeTelemetryScreenTex('a6', 'FORGE 5.0" IPS · SENSOR HUD') }));
      hud.position.set(0, 0.12, 0.10);
      root.add(hud);
    } else if (pid === 'a7') {
      const hubTex = makeLabelTex({ w: 512, h: 512, bg: '#121211', border: '#E5A93C', borderW: 10, tag: 'CORSAIR · DIGITAL BUS', title: 'iCUE LINK', sub: '24-DEVICE SYSTEM HUB' });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.85, 0.46), [matDark, matDark, matDark, matDark, new THREE.MeshBasicMaterial({ map: hubTex }), matDark]);
      root.add(box);
    } else if (pid === 'a8') {
      const topB = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 0.22), matDark); topB.position.y = 0.88; root.add(topB);
      const botB = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 0.22), matDark); botB.position.y = -0.88; root.add(botB);
      const lftB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.42, 0.22), matDark); lftB.position.x = -0.80; root.add(lftB);
      const rgtB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.42, 0.22), matDark); rgtB.position.x = 0.80; root.add(rgtB);
      [[-0.76, 0.84], [0.76, 0.84], [-0.76, -0.84], [0.76, -0.84]].forEach(p => {
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 16), matGold);
        sc.rotation.x = Math.PI / 2; sc.position.set(p[0], p[1], 0); root.add(sc);
      });
    } else if (pid === 'a9') {
      const nf = makeMiniFan(1.05, 0.36, false, 0x1c1917);
      root.add(nf);
      [[-0.95, 0.95, 0xd97742], [0.95, 0.95, 0xe5a93c], [-0.95, -0.95, 0x10b981], [0.95, -0.95, 0xff7a17]].forEach(p => {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.40), new THREE.MeshStandardMaterial({ color: p[2] }));
        pad.position.set(p[0], p[1], 0);
        root.add(pad);
      });
    } else {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.85, 0.08), matDark);
      root.add(frame);
      const meshTex = makeCarbonPerfTex();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.58, 0.10), new THREE.MeshStandardMaterial({ map: meshTex, color: 0xe5a93c, metalness: 0.6, roughness: 0.4 }));
      root.add(mesh);
    }
  }

  // Upgrade Single-Part Viewer asynchronously to crisp Blender GLB!
  const modelKey = getGlbKeyForPart(part);
  let alive = true;
  if (modelKey) {
    parseModelBase64(modelKey).then(sceneRoot => {
      if (!alive || !sceneRoot) return;
      // Fit within a comfortable 2.32 x 1.84 x 2.32 turntable showcase bounding cube (0 frustum clipping across all 53 SKUs)
      const normalized = normalizeGlbToBox(sceneRoot, 2.32, 1.84, 2.32, true);
      // Apply ergonomic horizontal showcase orientation per hardware category
      if (cat === 'gpu') normalized.rotation.set(0.42, -1.16, 0.18);
      else if (cat === 'mb' || cat === 'cpu') normalized.rotation.set(0.08, -Math.PI / 2, 0);
      else if (cat === 'ram') normalized.rotation.set(0.05, -0.58, 0);
      else if (cat === 'ssd') normalized.rotation.set(0.28, -Math.PI / 2 + 0.22, 0);
      else if (cat === 'psu') normalized.rotation.set(0.18, -0.72, 0);
      else if (cat === 'cool') normalized.rotation.set(0.12, -0.48, 0);
      else if (cat === 'case') normalized.rotation.set(0.0, -0.45, 0);
      else if (pid === 'a2') normalized.rotation.set(-0.85, 0, 0);
      else if (pid === 'a6' || pid === 'a8' || pid === 'a7') normalized.rotation.set(0, -Math.PI / 2, 0);
      else if (pid === 'a10') normalized.rotation.set(0.65, 0.2, 0);

      const localSpins = [];
      const localRgb = [];
      wireGlbInstance(normalized, {
        part,
        rgbHex: thCol.getStyle(),
        glassVisible: true,
        spinList: localSpins,
        rgbMatList: localRgb
      });

      while (root.children.length) root.remove(root.children[0]);
      spinTargets.length = 0;
      glbSpinTargets.length = 0;
      glbSpinTargets.push(...localSpins);
      rgbMats.push(...localRgb);
      root.add(normalized);
    });
  }

  let curRotY = 0.48, curRotX = 0.20, curDist = 5.95;
  let targetRotY = curRotY, targetRotX = curRotX, targetDist = curDist;
  let dragging = false, lx = 0, ly = 0, autoSpin = true;

  const onDown = e => { dragging = true; lx = e.clientX; ly = e.clientY; autoSpin = false; };
  const onUp = () => { dragging = false; };
  const onMove = e => {
    if (!dragging) return;
    targetRotY -= (e.clientX - lx) * 0.01;
    targetRotX = Math.max(-0.22, Math.min(0.82, targetRotX + (e.clientY - ly) * 0.01));
    lx = e.clientX;
    ly = e.clientY;
  };
  const onTouchStart = e => {
    if (e.touches.length === 1) { dragging = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; autoSpin = false; }
  };
  const onTouchMove = e => {
    if (!dragging || e.touches.length !== 1) return;
    targetRotY -= (e.touches[0].clientX - lx) * 0.01;
    targetRotX = Math.max(-0.22, Math.min(0.82, targetRotX + (e.touches[0].clientY - ly) * 0.01));
    lx = e.touches[0].clientX;
    ly = e.touches[0].clientY;
  };
  const onWheel = e => {
    e.preventDefault();
    targetDist = Math.max(2.6, Math.min(8.0, targetDist + e.deltaY * 0.004));
  };

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('mousemove', onMove);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('wheel', onWheel, { passive: false });

  const onTheme = e => {
    if (!e.detail || !e.detail.hex) return;
    const c = new THREE.Color(e.detail.hex);
    rim.color.copy(c);
    glowMat.color.copy(c);
    rgbMats.forEach(m => { m.color.copy(c); if (m.emissive) m.emissive.copy(c); });
  };
  window.addEventListener('forge-theme', onTheme);

  function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    if (autoSpin) targetRotY += 0.0075;
    curRotY += (targetRotY - curRotY) * 0.14;
    curRotX += (targetRotX - curRotX) * 0.14;
    curDist += (targetDist - curDist) * 0.14;

    spinTargets.forEach(b => { b.rotation.z += 0.12; });
    glbSpinTargets.forEach(item => {
      if (item.axis === 'x') item.mesh.rotateX(0.12);
      else if (item.axis === 'y') item.mesh.rotateY(0.12);
      else item.mesh.rotateZ(0.12);
    });

    camera.position.set(
      Math.sin(curRotY) * Math.cos(curRotX) * curDist,
      Math.max(-1.48, Math.sin(curRotX) * curDist),
      Math.cos(curRotY) * Math.cos(curRotX) * curDist
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();

  return {
    destroy() {
      alive = false;
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('forge-theme', onTheme);
      renderer.dispose();
    }
  };
}

window.createPC = createPC;
window.createPartViewer = createPartViewer;
})();
