/* FORGE — 2026 Hardware Catalogue & Precision CAD-Style Schematics (No AI Purple) */
const CATS = {
  cpu: 'Processor',
  mb: 'Motherboard',
  ram: 'Memory',
  gpu: 'Graphics Card',
  ssd: 'Storage',
  psu: 'Power Supply',
  cool: 'CPU Cooler',
  case: 'Case',
  acc: 'Accessories'
};

const PARTS = [
  // 1. Processors (2026 Arrow Lake & Zen 5)
  { id: 'c1', cat: 'cpu', name: 'Intel Core Ultra 7 265K', price: 399, watt: 125, socket: 'LGA1851', perf: 88, spec: '20 cores (8P+12E) · 5.5 GHz · Arrow Lake NPU' },
  { id: 'c2', cat: 'cpu', name: 'Intel Core Ultra 9 285K', price: 629, watt: 250, socket: 'LGA1851', perf: 98, spec: '24 cores (8P+16E) · 5.7 GHz · Flagship AI' },
  { id: 'c3', cat: 'cpu', name: 'AMD Ryzen 7 9800X3D', price: 479, watt: 120, socket: 'AM5', perf: 100, spec: '8 cores · 2nd Gen 3D V-Cache · 5.2 GHz Gaming King' },
  { id: 'c4', cat: 'cpu', name: 'AMD Ryzen 9 9950X', price: 649, watt: 170, socket: 'AM5', perf: 99, spec: '16 cores · 32 threads · 5.7 GHz Zen 5 Workstation' },
  { id: 'c5', cat: 'cpu', name: 'AMD Ryzen 5 9600X', price: 279, watt: 65, socket: 'AM5', perf: 72, spec: '6 cores · 5.4 GHz · 65W High-Efficiency Zen 5' },
  { id: 'c6', cat: 'cpu', name: 'Intel Core i5-14600K', price: 289, watt: 125, socket: 'LGA1700', perf: 68, spec: '14 cores · 5.3 GHz · Value Performance' },

  // 2. Motherboards (Z890, X870E, B850, B760)
  { id: 'm1', cat: 'mb', name: 'ASUS ROG Strix Z890-E', price: 499, watt: 20, socket: 'LGA1851', perf: 0, spec: 'ATX · DDR5-8800+ · PCIe 5.0 · Wi-Fi 7 · Dual TB4' },
  { id: 'm2', cat: 'mb', name: 'MSI MAG Z890 Tomahawk', price: 289, watt: 15, socket: 'LGA1851', perf: 0, spec: 'ATX · PCIe 5.0 · 16+1+1 90A VRM · Wi-Fi 7' },
  { id: 'm3', cat: 'mb', name: 'Gigabyte X870E AORUS Master', price: 499, watt: 20, socket: 'AM5', perf: 0, spec: 'ATX · PCIe 5.0 · Dual USB4 · 16+2+2 110A VRM · Wi-Fi 7' },
  { id: 'm4', cat: 'mb', name: 'ASRock X870 Steel Legend', price: 259, watt: 15, socket: 'AM5', perf: 0, spec: 'ATX · Arctic White · Dual USB4 · PCIe 5.0 M.2' },
  { id: 'm5', cat: 'mb', name: 'ASUS TUF Gaming B850-Plus', price: 199, watt: 12, socket: 'AM5', perf: 0, spec: 'ATX · Military Grade · PCIe 5.0 · 2.5G LAN' },
  { id: 'm6', cat: 'mb', name: 'MSI PRO B760M-A WiFi', price: 139, watt: 10, socket: 'LGA1700', perf: 0, spec: 'mATX · DDR5 · Dual M.2 · 2.5G LAN' },

  // 3. High-Speed Memory
  { id: 'r1', cat: 'ram', name: 'Corsair Vengeance 32GB', price: 115, watt: 6, perf: 0, spec: '2×16GB DDR5-6000 CL30 Black Low-Profile' },
  { id: 'r2', cat: 'ram', name: 'G.Skill Trident Z5 RGB 32GB', price: 139, watt: 8, perf: 0, spec: '2×16GB DDR5-6400 CL32 Dual-Tone Silver/Black', rgb: 1 },
  { id: 'r3', cat: 'ram', name: 'G.Skill Trident Z5 Royal 48GB', price: 249, watt: 12, perf: 0, spec: '2×24GB CUDIMM DDR5-8000 CL38 Luxury Crystal Lightbar', rgb: 1 },
  { id: 'r4', cat: 'ram', name: 'Kingston Fury Beast RGB 64GB', price: 219, watt: 10, perf: 0, spec: '2×32GB DDR5-6000 CL30 Low-Latency High-Capacity', rgb: 1 },
  { id: 'r5', cat: 'ram', name: 'Corsair Dominator Titanium 64GB', price: 299, watt: 14, perf: 0, spec: '2×32GB DDR5-7200 CL34 Modular Top Fin Architecture', rgb: 1 },

  // 4. Graphics Cards (2026 Blackwell RTX 50-Series & Radeon)
  { id: 'g1', cat: 'gpu', name: 'NVIDIA GeForce RTX 5060', price: 349, watt: 130, perf: 58, spec: '12GB GDDR7 · Blackwell Architecture · DLSS 4 · 2-Slot', size: 1 },
  { id: 'g2', cat: 'gpu', name: 'AMD Radeon RX 7900 GRE', price: 539, watt: 260, perf: 78, spec: '16GB GDDR6 · RDNA 3 High-Res Raster King · Triple Fan', size: 2 },
  { id: 'g3', cat: 'gpu', name: 'NVIDIA GeForce RTX 5070', price: 599, watt: 220, perf: 82, spec: '12GB GDDR7 · Blackwell 1440p Ultra Ray Tracing', size: 2 },
  { id: 'g4', cat: 'gpu', name: 'NVIDIA GeForce RTX 5070 Ti', price: 799, watt: 285, perf: 90, spec: '16GB GDDR7 · 256-bit Bus · 4K Ray Tracing · Dual BIOS', size: 2 },
  { id: 'g5', cat: 'gpu', name: 'NVIDIA GeForce RTX 5080', price: 1099, watt: 360, perf: 96, spec: '16GB GDDR7 · 10,752 CUDA Cores · Blackwell Enthusiast', size: 3 },
  { id: 'g6', cat: 'gpu', name: 'NVIDIA GeForce RTX 5090', price: 1999, watt: 575, perf: 100, spec: '32GB GDDR7 · 512-bit · 21,760 CUDA Cores · Blackwell Titan', size: 3 },

  // 5. Blazing Gen5 & Gen4 NVMe Storage
  { id: 's1', cat: 'ssd', name: 'Samsung 990 Pro 1TB', price: 109, watt: 6, perf: 0, spec: 'NVMe Gen4 · 7450 MB/s · Graphene Heatspreader' },
  { id: 's2', cat: 'ssd', name: 'WD Black SN850X 2TB', price: 169, watt: 7, perf: 0, spec: 'NVMe Gen4 · 7300 MB/s · Gaming Mode 2.0 Cache' },
  { id: 's3', cat: 'ssd', name: 'Crucial T705 2TB Gen5', price: 289, watt: 9, perf: 0, spec: 'NVMe Gen5 · 14,500 MB/s · Extruded Copper Heatsink' },
  { id: 's4', cat: 'ssd', name: 'Crucial T705 4TB Gen5', price: 499, watt: 10, perf: 0, spec: 'NVMe Gen5 · 14,500 MB/s · Extreme Capacity & Speed' },
  { id: 's5', cat: 'ssd', name: 'Samsung 990 EVO Plus 2TB', price: 149, watt: 5, perf: 0, spec: 'NVMe Gen4/5 x2 · 7250 MB/s · Cool-Running Power Efficiency' },

  // 6. ATX 3.1 Native Power Supplies
  { id: 'p1', cat: 'psu', name: 'Corsair RM750e', price: 99, watt: 0, cap: 750, perf: 0, spec: '750W · 80+ Gold · ATX 3.1 & PCIe 5.1 Native' },
  { id: 'p2', cat: 'psu', name: 'Seasonic Focus GX-850', price: 139, watt: 0, cap: 850, perf: 0, spec: '850W · 80+ Gold · Modular · Japanese 105°C Caps' },
  { id: 'p3', cat: 'psu', name: 'Corsair RM1000x Shift', price: 199, watt: 0, cap: 1000, perf: 0, spec: '1000W · 80+ Gold · ATX 3.1 · Side-Facing Modular' },
  { id: 'p4', cat: 'psu', name: 'Seasonic Vertex GX-1200', price: 249, watt: 0, cap: 1200, perf: 0, spec: '1200W · 80+ Gold · Native 12V-2x6 600W Cable' },
  { id: 'p5', cat: 'psu', name: 'be quiet! Dark Power 1300', price: 389, watt: 0, cap: 1300, perf: 0, spec: '1300W · 80+ Titanium · Digital Full-Bridge LLC' },

  // 7. Thermal Cooling Solutions
  { id: 'k1', cat: 'cool', name: 'Noctua NH-D15 G2 Chromax', price: 149, watt: 5, perf: 0, spec: 'Dual-Tower Next-Gen Flagship · 8 Heatpipes · Dual 140mm G2', type: 'air' },
  { id: 'k2', cat: 'cool', name: 'NZXT Kraken Elite 360 RGB', price: 279, watt: 12, perf: 0, spec: '360mm AIO · 2.36" 640×640 60Hz LCD Screen · F120 RGB Core', type: 'aio', rgb: 1 },
  { id: 'k3', cat: 'cool', name: 'Lian Li HydroShift LCD 360', price: 249, watt: 10, perf: 0, spec: '360mm AIO · Concealed Side-Mounted Ribbed Tubing · 2.88" IPS', type: 'aio', rgb: 1 },
  { id: 'k4', cat: 'cool', name: 'Arctic Liquid Freezer III 360', price: 119, watt: 8, perf: 0, spec: '360mm AIO · 38mm Heavy Radiator · Integrated VRM Fan', type: 'aio', rgb: 1 },
  { id: 'k5', cat: 'cool', name: 'Thermalright Peerless Assassin', price: 39, watt: 4, perf: 0, spec: 'Dual-Tower · 6 Heatpipes · Budget Air Cooling King', type: 'air' },

  // 8. Showcase Chassis
  { id: 'x1', cat: 'case', name: 'Lian Li O11 Dynamic EVO RGB', price: 169, watt: 0, perf: 0, spec: 'Dual-chamber · Top/Bottom ARGB Diffuser Strips · Tinted Glass', color: 0x1a1d24 },
  { id: 'x2', cat: 'case', name: 'NZXT H6 Flow White', price: 119, watt: 0, perf: 0, spec: 'Mid tower · 45° Angled Corner Intake Airflow · Dual White Fans', color: 0xe8ebf0 },
  { id: 'x3', cat: 'case', name: 'Fractal Design North XL', price: 189, watt: 0, perf: 0, spec: 'Full tower · Genuine FSC Walnut Front Slats · Smoked Glass', color: 0x22262d },
  { id: 'x4', cat: 'case', name: 'Hyte Y70 Touch Infinite', price: 379, watt: 0, perf: 0, spec: 'Panoramic Corner · Integrated 14.5" 688×2560 4K Touch Display', color: 0x1c212a },
  { id: 'x5', cat: 'case', name: 'FORGE Titanium Stealth Pro', price: 249, watt: 0, perf: 0, spec: 'CNC Aerospace Titanium · Smoked Tempered Glass · Noise-Dampened', color: 0x2b3440 },

  // 9. Hardware Modding & Accessories
  { id: 'a1', cat: 'acc', name: 'FORGE Braided Cable Kit', price: 49, watt: 0, perf: 0, spec: '16-Pin 12V-2x6 + 24-Pin ATX + Dual 8-Pin EPS · Stealth Cyan/Black Combs' },
  { id: 'a2', cat: 'acc', name: 'Lian Li UNI FAN TL LCD 3-Pack', price: 149, watt: 12, perf: 0, spec: '3×120mm Daisy-Chain Reverse Fans · 1.6" Custom GIF/Telemetry LCD Screen', rgb: 1 },
  { id: 'a3', cat: 'acc', name: 'Thermal Grizzly Kryonaut Extreme 2g', price: 22, watt: 0, perf: 0, spec: '14.2 W/m·K Industrial Overclocking Nano-Aluminum Thermal Compound' },
  { id: 'a4', cat: 'acc', name: 'FORGE Anti-Sag GPU Support Arm', price: 25, watt: 0, perf: 0, spec: 'CNC Anodized Aluminum Telescopic Stand with Magnetic Neodymium Base' },
  { id: 'a5', cat: 'acc', name: 'PCIe 5.0 Vertical GPU Riser Kit', price: 65, watt: 0, perf: 0, spec: '90-Degree Heavy-Duty Shielded Riser Cable · PCIe 5.0 x16 Full Speed' },
  { id: 'a6', cat: 'acc', name: 'FORGE 5.0" IPS Telemetry Panel', price: 59, watt: 3, perf: 0, spec: '800×480 IPS USB-C Internal Display · Live Temps, Clocks & FPS Stats' },
  { id: 'a7', cat: 'acc', name: 'Corsair iCUE LINK System Hub', price: 59, watt: 15, perf: 0, spec: 'Single-Cable Daisy-Chain RGB & PWM Fan Controller · 14-Device Capacity' },
  { id: 'a8', cat: 'acc', name: 'Thermalright CPU Contact Frame', price: 19, watt: 0, perf: 0, spec: 'CNC Aluminum Anti-Bending Buckle Frame for LGA1851 / AM5 (-6°C Temps)' },
  { id: 'a9', cat: 'acc', name: 'Noctua NF-A12x25 G2 PWM 120mm', price: 34, watt: 2, perf: 0, spec: 'Sterrox LCP Liquid Crystal Polymer · Ultra-Quiet 2000 RPM 120mm Fan' },
  { id: 'a10', cat: 'acc', name: 'Magnetic Nylon Dust Filter Kit', price: 18, watt: 0, perf: 0, spec: 'Toolless Snap-On Washable Fine-Mesh Dust Filters · High-Airflow Grid' }
];

const PREBUILT = [
  {
    id: 'pb1',
    name: 'FORGE Pulse 2026',
    tag: 'Esports 1080p/1440p',
    parts: ['c5', 'm5', 'r1', 'g1', 's1', 'p1', 'k5', 'x2', 'a1'],
    desc: 'Ultra-fast esports 360Hz & CAD engineering rig with custom braided cables.'
  },
  {
    id: 'pb2',
    name: 'FORGE Apex 2026',
    tag: 'Competitive 1440p/4K',
    parts: ['c3', 'm4', 'r2', 'g4', 's2', 'p2', 'k3', 'x1', 'a1', 'a4'],
    desc: 'The undisputed gaming champion rig with Ryzen 7 9800X3D, RTX 5070 Ti, and CNC Anti-Sag Arm.'
  },
  {
    id: 'pb3',
    name: 'FORGE Titan Ultra 2026',
    tag: 'Flagship 4K / Blackwell AI',
    parts: ['c2', 'm1', 'r5', 'g6', 's4', 'p5', 'k2', 'x4', 'a1', 'a2', 'a4', 'a6'],
    desc: 'Uncompromised 4K ray tracing & local AI with 32GB RTX 5090, UNI FAN LCDs & 5" internal telemetry display.'
  },
  {
    id: 'pb4',
    name: 'FORGE Studio Creator 2026',
    tag: 'Silent Workstation',
    parts: ['c4', 'm3', 'r4', 'g5', 's3', 'p3', 'k1', 'x3', 'a1', 'a8', 'a9'],
    desc: 'Acoustically tuned architectural workstation with 16-core 9950X, RTX 5080, Noctua G2 and contact frame.'
  }
];

const byId = id => PARTS.find(p => p.id === id) || PREBUILT.find(p => p.id === id);
const kitPrice = k => k.parts.reduce((s, i) => s + (byId(i) ? byId(i).price : 0), 0) + 99;

/* Detailed CAD-style SVG hardware schematics (cyan/emerald/amber palette — zero purple) */
const HUE = { cpu: 190, mb: 160, ram: 175, gpu: 38, ssd: 45, psu: 200, cool: 188, case: 205, acc: 145 };
function partSVG(catOrPart, alt) {
  const isObj = typeof catOrPart === 'object' && catOrPart !== null;
  const cat = isObj ? catOrPart.cat : (catOrPart || 'case');
  const pid = isObj ? catOrPart.id.toUpperCase() : cat.toUpperCase();
  const label = isObj ? catOrPart.name.slice(0, 26) : `${cat.toUpperCase()} // 2026 ARCH`;
  const subLabel = isObj ? catOrPart.spec.slice(0, 34) : 'ISO-9001 CAD SCHEMATIC';
  const h = HUE[cat] || 190, c = `hsl(${h},92%,56%)`, c2 = `hsl(${(h + 30) % 200},85%,52%)`, bg = alt ? '#0c1420' : '#0d121c';
  const grid = `<g stroke="#242422" stroke-width=".5" opacity=".55"><path d="M0 34h240M0 68h240M0 102h240M0 136h240M48 0v170M96 0v170M144 0v170M192 0v170"/></g>
  <g stroke="${c}" stroke-width="1" opacity=".45" fill="none"><path d="M8 18v-10h10M232 18v-10h-10M8 152v10h10M232 152v10h-10"/></g>
  <text x="14" y="18" font-family="monospace" font-size="8.5" fill="${c}" font-weight="bold">CAD // ${pid} · ${label}</text>
  <text x="14" y="159" font-family="monospace" font-size="7.5" fill="#94a3b8">${subLabel}</text>`;
  const g = {
    cpu: `<g stroke="#475569" stroke-width="1.5"><path d="M62 50h116M62 62h116M62 74h116M62 96h116M62 108h116M62 120h116M85 28v114M102 28v114M120 28v114M138 28v114M155 28v114"/></g>
    <rect x="68" y="34" width="104" height="102" rx="8" fill="#162030" stroke="${c}" stroke-width="2"/>
    <rect x="82" y="48" width="76" height="74" rx="5" fill="#242422" stroke="${c2}" stroke-width="1.5"/>
    <rect x="96" y="62" width="48" height="46" rx="3" fill="${c}" opacity=".2"/>
    <text x="120" y="89" font-family="monospace" font-size="12" text-anchor="middle" fill="${c}" font-weight="bold">FORGE-26</text>`,
    mb: `<rect x="52" y="20" width="136" height="130" rx="6" fill="#0f1e19" stroke="${c}" stroke-width="2"/>
    <rect x="60" y="28" width="18" height="68" rx="2" fill="#263345" stroke="${c2}"/>
    <rect x="90" y="38" width="42" height="42" rx="3" fill="#242422" stroke="${c}" stroke-width="1.5"/>
    <circle cx="111" cy="59" r="11" fill="none" stroke="${c2}" stroke-dasharray="3 2"/>
    <g fill="#242422" stroke="${c2}"><rect x="144" y="32" width="6" height="62"/><rect x="154" y="32" width="6" height="62"/><rect x="164" y="32" width="6" height="62"/></g>
    <rect x="64" y="104" width="108" height="9" rx="2" fill="${c}" opacity=".85"/>
    <rect x="64" y="122" width="108" height="7" rx="2" fill="#263345"/>
    <rect x="138" y="116" width="34" height="24" rx="3" fill="#242422" stroke="${c}"/>`,
    ram: `<g transform="translate(0,-4)"><rect x="44" y="44" width="152" height="36" rx="4" fill="#151e2e" stroke="${c}" stroke-width="1.8"/>
    <rect x="44" y="44" width="152" height="8" rx="2" fill="${c}"/>
    <g fill="#0b0f17">${[60, 82, 104, 126, 148, 170].map(x => `<rect x="${x}" y="56" width="14" height="16" rx="1"/>`).join('')}</g>
    <rect x="44" y="96" width="152" height="36" rx="4" fill="#151e2e" stroke="${c2}" stroke-width="1.8"/>
    <rect x="44" y="96" width="152" height="8" rx="2" fill="${c2}"/>
    <g fill="#0b0f17">${[60, 82, 104, 126, 148, 170].map(x => `<rect x="${x}" y="108" width="14" height="16" rx="1"/>`).join('')}</g></g>`,
    gpu: `<rect x="24" y="44" width="192" height="76" rx="8" fill="#141c2b" stroke="${c}" stroke-width="2"/>
    <path d="M24 58h192" stroke="${c}" stroke-width="2.5"/>
    ${[64, 120, 176].map(x => `<circle cx="${x}" cy="86" r="22" fill="#0b1018" stroke="${c2}" stroke-width="1.8"/><circle cx="${x}" cy="86" r="6" fill="${c}"/><path d="M${x - 14} 86h28M${x} 72v28M${x - 10} 76l20 20M${x + 10} 76l-20 20" stroke="#334155"/>`).join('')}
    <rect x="42" y="120" width="96" height="6" rx="1" fill="#f59e0b"/>`,
    ssd: `<rect x="28" y="62" width="184" height="46" rx="5" fill="#111927" stroke="${c}" stroke-width="2"/>
    <rect x="28" y="68" width="8" height="34" fill="#f59e0b"/>
    <rect x="48" y="70" width="44" height="30" rx="2" fill="#242422" stroke="${c2}"/>
    <rect x="102" y="70" width="44" height="30" rx="2" fill="#242422"/><rect x="156" y="70" width="42" height="30" rx="2" fill="#242422"/>
    <text x="70" y="89" font-family="monospace" font-size="9" text-anchor="middle" fill="${c}">PCIe 5.0</text>`,
    psu: `<rect x="48" y="32" width="144" height="106" rx="8" fill="#121926" stroke="${c}" stroke-width="2"/>
    <circle cx="102" cy="85" r="36" fill="none" stroke="${c2}" stroke-width="1.8"/>
    <circle cx="102" cy="85" r="24" fill="none" stroke="#334155" stroke-width="1.2"/>
    <circle cx="102" cy="85" r="10" fill="${c}" opacity=".8"/>
    <path d="M66 85h72M102 49v72M77 60l50 50M127 60l-50 50" stroke="#334155"/>
    <text x="166" y="76" font-family="monospace" font-size="11" text-anchor="middle" fill="${c}" font-weight="bold">80+</text>
    <text x="166" y="92" font-family="monospace" font-size="9" text-anchor="middle" fill="#94a3b8">ATX 3.1</text>`,
    cool: `<rect x="38" y="42" width="164" height="86" rx="8" fill="#121a28" stroke="${c}" stroke-width="2"/>
    ${[78, 162].map(x => `<circle cx="${x}" cy="85" r="31" fill="#0b1018" stroke="${c2}" stroke-width="2"/><circle cx="${x}" cy="85" r="9" fill="${c}"/><path d="M${x - 20} 85h40M${x} 65v40" stroke="#334155"/>`).join('')}`,
    case: `<rect x="74" y="16" width="92" height="138" rx="8" fill="#111826" stroke="${c}" stroke-width="2"/>
    <rect x="82" y="24" width="62" height="102" rx="4" fill="${c}" opacity=".1" stroke="${c2}"/>
    <rect x="82" y="130" width="76" height="16" rx="2" fill="#242422"/>
    <circle cx="154" cy="44" r="9" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="154" cy="70" r="9" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="154" cy="96" r="9" fill="none" stroke="${c}" stroke-width="2"/>`,
    acc: `<rect x="40" y="36" width="160" height="98" rx="8" fill="#111c1d" stroke="${c}" stroke-width="2"/>
    <circle cx="120" cy="85" r="32" fill="none" stroke="${c2}" stroke-width="2"/>
    <path d="M60 85h120M120 53v64" stroke="${c}" stroke-width="1.5" stroke-dasharray="4 2"/>
    <text x="120" y="89" font-family="monospace" font-size="11" text-anchor="middle" fill="${c}">PRO ACC</text>`
  };
  const glow = alt ? `<circle cx="120" cy="85" r="88" fill="${c}" opacity=".11"/>` : '';
  return `<svg viewBox="0 0 240 170" class="${alt ? 'alt' : 'main'}" xmlns="http://www.w3.org/2000/svg"><rect width="240" height="170" fill="${bg}"/>${grid}${glow}<g${alt ? ' transform="scale(1.04) rotate(-3 120 85)"' : ''}>${g[cat] || g.case}</g></svg>`;
}
