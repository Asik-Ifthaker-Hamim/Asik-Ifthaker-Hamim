// Generates the self-hosted animated SVGs for the profile README.
// Palette matches the portfolio: bg #08090c, cyan #22d3ee, violet #a78bfa, lime #a3e635.
const fs = require("fs");
const path = require("path");

const CYAN = "#22d3ee";
const VIOLET = "#a78bfa";
const LIME = "#a3e635";
const BG = "#08090c";
const LINE = "#1c2030";

const outDir = path.join(__dirname, "assets");
fs.mkdirSync(outDir, { recursive: true });

/* ---------------------------------------------------------------- banner */

const W = 1200;
const H = 260;

// Four layers of a small feed-forward net.
const layers = [
  { x: 190, ys: [70, 120, 170, 215] },
  { x: 450, ys: [40, 85, 130, 175, 220] },
  { x: 720, ys: [55, 105, 155, 205] },
  { x: 980, ys: [95, 145] },
];

const nodeColor = (li) => [CYAN, VIOLET, CYAN, LIME][li];

let edges = "";
let edgeIdx = 0;
for (let li = 0; li < layers.length - 1; li++) {
  const a = layers[li];
  const b = layers[li + 1];
  for (const y1 of a.ys) {
    for (const y2 of b.ys) {
      const delay = ((edgeIdx * 0.13) % 4).toFixed(2);
      edges += `<line class="edge" x1="${a.x}" y1="${y1}" x2="${b.x}" y2="${y2}" style="animation-delay:${delay}s"/>\n`;
      edgeIdx++;
    }
  }
}

// Data packets travelling along a hand-picked subset of edges.
const packetPaths = [];
for (let li = 0; li < layers.length - 1; li++) {
  const a = layers[li];
  const b = layers[li + 1];
  for (let k = 0; k < 4; k++) {
    const y1 = a.ys[(k * 2) % a.ys.length];
    const y2 = b.ys[(k * 3 + li) % b.ys.length];
    packetPaths.push({ x1: a.x, y1, x2: b.x, y2, color: nodeColor(li + 1) });
  }
}

let packets = "";
packetPaths.forEach((p, i) => {
  const dur = (2.6 + (i % 5) * 0.45).toFixed(2);
  const begin = ((i * 0.37) % 4).toFixed(2);
  packets += `<circle r="3" fill="${p.color}" filter="url(#glow)">
      <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="M${p.x1},${p.y1} L${p.x2},${p.y2}"/>
      <animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
    </circle>\n`;
});

let nodes = "";
layers.forEach((l, li) => {
  l.ys.forEach((y, ni) => {
    const delay = ((li * 0.4 + ni * 0.25) % 3).toFixed(2);
    nodes += `<circle class="node" cx="${l.x}" cy="${y}" r="7" fill="${BG}" stroke="${nodeColor(li)}" style="animation-delay:${delay}s"/>\n`;
    nodes += `<circle class="halo" cx="${l.x}" cy="${y}" r="7" fill="none" stroke="${nodeColor(li)}" style="animation-delay:${delay}s"/>\n`;
  });
});

// Vertical grid ticks for a technical backdrop.
let grid = "";
for (let x = 0; x <= W; x += 40) {
  grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${LINE}" stroke-width="0.5" opacity="0.35"/>`;
}
for (let y = 0; y <= H; y += 40) {
  grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="0.5" opacity="0.35"/>`;
}

const banner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Animated neural network banner">
  <defs>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${CYAN}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${LIME}"/>
      <stop offset="50%" stop-color="${CYAN}"/>
      <stop offset="100%" stop-color="${VIOLET}"/>
    </linearGradient>
    <filter id="glow" x="-120%" y="-120%" width="340%" height="340%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .edge { stroke: ${CYAN}; stroke-width: 0.8; opacity: 0.10;
              animation: flicker 4s ease-in-out infinite; }
      @keyframes flicker { 0%,100% { opacity: 0.07 } 50% { opacity: 0.26 } }
      .node { stroke-width: 2; animation: pulse 3s ease-in-out infinite; }
      @keyframes pulse { 0%,100% { r: 6 } 50% { r: 8 } }
      .halo { stroke-width: 1.5; opacity: 0; animation: ring 3s ease-out infinite; }
      @keyframes ring { 0% { r: 7; opacity: 0.55 } 70%,100% { r: 20; opacity: 0 } }
      .scan { animation: sweep 7s linear infinite; }
      @keyframes sweep { 0% { transform: translateX(-380px) } 100% { transform: translateX(1200px) } }
      .tag { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
             font-size: 13px; letter-spacing: 3px; fill: #5a6272; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${BG}"/>
  <g>${grid}</g>
  <rect class="scan" x="0" y="0" width="380" height="${H}" fill="url(#sweep)" opacity="0.16"/>

  <g>${edges}</g>
  <g>${packets}</g>
  <g filter="url(#glow)">${nodes}</g>

  <text class="tag" x="36" y="40">LLM  ·  AGENTIC AI  ·  MLOps</text>
  <text class="tag" x="${W - 36}" y="40" text-anchor="end">IEEE  ·  ACM  ·  SPRINGER</text>
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#rule)" opacity="0.9"/>
</svg>
`;

fs.writeFileSync(path.join(outDir, "banner.svg"), banner);

/* --------------------------------------------------------------- divider */

const divider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 8" width="1200" height="8" role="img" aria-label="">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${LIME}" stop-opacity="0.1"/>
      <stop offset="50%" stop-color="${CYAN}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0.1"/>
    </linearGradient>
    <style>
      .pip { animation: run 5s linear infinite; }
      @keyframes run { 0% { transform: translateX(0) } 100% { transform: translateX(1200px) } }
    </style>
  </defs>
  <rect y="3" width="1200" height="2" fill="url(#g)"/>
  <circle class="pip" cx="0" cy="4" r="3" fill="${CYAN}"/>
</svg>
`;

fs.writeFileSync(path.join(outDir, "divider.svg"), divider);

/* ---------------------------------------------------------------- footer */

const footer = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 130" width="1200" height="130" role="img" aria-label="">
  <defs>
    <linearGradient id="w1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${LIME}"/>
      <stop offset="50%" stop-color="${CYAN}"/>
      <stop offset="100%" stop-color="${VIOLET}"/>
    </linearGradient>
    <style>
      .w { animation: drift 12s ease-in-out infinite alternate; }
      .w2 { animation: drift2 9s ease-in-out infinite alternate; }
      @keyframes drift { from { transform: translateX(-40px) } to { transform: translateX(40px) } }
      @keyframes drift2 { from { transform: translateX(30px) } to { transform: translateX(-30px) } }
    </style>
  </defs>
  <rect width="1200" height="130" fill="${BG}"/>
  <path class="w2" d="M-60,70 C160,30 340,110 600,70 C860,30 1040,110 1260,70 L1260,130 L-60,130 Z"
        fill="url(#w1)" opacity="0.18"/>
  <path class="w" d="M-60,92 C180,52 380,128 620,92 C880,54 1060,128 1260,92 L1260,130 L-60,130 Z"
        fill="url(#w1)" opacity="0.42"/>
</svg>
`;

fs.writeFileSync(path.join(outDir, "footer.svg"), footer);

console.log("wrote banner.svg, divider.svg, footer.svg");
