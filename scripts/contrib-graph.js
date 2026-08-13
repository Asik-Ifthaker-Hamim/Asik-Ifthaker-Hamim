// Builds assets/activity.svg — an animated weekly contribution chart.
// Self-hosted so it does not depend on any third-party Vercel app.
// Needs GITHUB_TOKEN in the environment.

const fs = require("fs");
const path = require("path");

const LOGIN = process.env.GH_LOGIN || "Asik-Ifthaker-Hamim";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const CYAN = "#22d3ee";
const VIOLET = "#a78bfa";
const LIME = "#a3e635";
const BG = "#08090c";
const LINE = "#1c2030";
const MUTED = "#8a93a6";
const INK = "#e7ecf3";

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays { date contributionCount }
          }
        }
      }
    }
  }`;

async function main() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "profile-readme-contrib-graph",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });

  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));

  const cal = json.data.user.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks.map((w) => ({
    firstDay: w.firstDay,
    total: w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
  }));

  const W = 1000;
  const H = 270;
  const PAD_L = 46;
  const PAD_R = 26;
  const TOP = 78;
  const BASE = 214;

  const max = Math.max(1, ...weeks.map((w) => w.total));
  const n = weeks.length;
  const x = (i) => PAD_L + (i * (W - PAD_L - PAD_R)) / (n - 1);
  const y = (v) => BASE - (v / max) * (BASE - TOP);

  // Smooth the line with a Catmull-Rom -> cubic Bezier conversion.
  const pts = weeks.map((w, i) => [x(i), y(w.total)]);
  let line = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${BASE} L${pts[0][0].toFixed(1)},${BASE} Z`;

  // Month ticks wherever the month changes.
  let months = "";
  let lastMonth = -1;
  const NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  weeks.forEach((w, i) => {
    const m = new Date(w.firstDay + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      months += `<text class="ax" x="${x(i).toFixed(1)}" y="${BASE + 24}" text-anchor="middle">${NAMES[m]}</text>`;
    }
  });

  // Horizontal gridlines with value labels.
  let grid = "";
  for (let k = 0; k <= 3; k++) {
    const v = Math.round((max / 3) * k);
    const gy = y(v);
    grid += `<line x1="${PAD_L}" y1="${gy.toFixed(1)}" x2="${W - PAD_R}" y2="${gy.toFixed(1)}" stroke="${LINE}" stroke-width="1" opacity="0.7"/>`;
    grid += `<text class="ax" x="${PAD_L - 10}" y="${(gy + 4).toFixed(1)}" text-anchor="end">${v}</text>`;
  }

  const peak = weeks.reduce((b, w, i) => (w.total > weeks[b].total ? i : b), 0);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Contribution activity over the last year">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="${CYAN}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${LIME}"/>
      <stop offset="50%" stop-color="${CYAN}"/>
      <stop offset="100%" stop-color="${VIOLET}"/>
    </linearGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace; }
      .ax { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
            font-size: 10px; fill: #5a6272; letter-spacing: 1px; }
      .title { font-size: 14px; letter-spacing: 3px; fill: ${CYAN}; }
      .sub { font-size: 12px; fill: ${MUTED}; letter-spacing: 1px; }
      .big { font-size: 26px; fill: ${INK}; font-weight: 700; }
      .trace { stroke-dasharray: 4200; stroke-dashoffset: 4200;
               animation: draw 3.2s ease-out forwards; }
      @keyframes draw { to { stroke-dashoffset: 0 } }
      .area { opacity: 0; animation: fade 1.6s ease-out 1.5s forwards; }
      @keyframes fade { to { opacity: 1 } }
      .dot { animation: bob 2.6s ease-in-out infinite; }
      @keyframes bob { 0%,100% { r: 4 } 50% { r: 6.5 } }
    </style>
  </defs>

  <rect width="${W}" height="${H}" rx="10" fill="${BG}" stroke="${LINE}"/>
  <text class="mono title" x="26" y="34">CONTRIBUTION ACTIVITY</text>
  <text class="mono sub" x="26" y="56">last 12 months</text>
  <text class="mono big" x="${W - 26}" y="42" text-anchor="end">${cal.totalContributions.toLocaleString("en-US")}</text>
  <text class="mono sub" x="${W - 26}" y="60" text-anchor="end">total contributions</text>

  <g>${grid}</g>
  <path class="area" d="${area}" fill="url(#fill)"/>
  <path class="trace" d="${line}" fill="none" stroke="url(#stroke)" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>

  <circle class="dot" cx="${x(peak).toFixed(1)}" cy="${y(weeks[peak].total).toFixed(1)}" r="4"
          fill="${LIME}" filter="url(#glow)"/>

  <g>${months}</g>
</svg>
`;

  const out = path.join(__dirname, "..", "assets", "activity.svg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  console.log(`wrote activity.svg — ${cal.totalContributions} contributions across ${n} weeks (peak ${weeks[peak].total})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
