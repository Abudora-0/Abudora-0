import { C, esc, svg, wrap } from '../lib/theme.mjs';

const W = 440, H = 270;
const SHELLS = [C.rose, C.sage, C.amber, C.rain, C.lilac, C.peach];
const INK = '#2a2540';

function reel(cx, cy, dur) {
  const spokes = [0, 60, 120].map((a) => `<rect x="-1.6" y="-11" width="3.2" height="22" rx="1.2" fill="${INK}" transform="rotate(${a})"/>`).join('');
  return `<g transform="translate(${cx} ${cy})">
  <circle r="15" fill="${C.cream}"/>
  <g>${spokes}<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${dur}s" repeatCount="indefinite"/></g>
  <circle r="4" fill="${C.cream}" stroke="${INK}" stroke-width="2"/>
</g>`;
}

export function renderTape({ feature, repo, index }) {
  const shell = SHELLS[index % SHELLS.length];
  const title = feature.repo;
  const blurb = wrap(feature.blurb ?? repo?.description ?? '', 44).slice(0, 2);
  const num = String(index + 1).padStart(2, '0');
  const lang = feature.lang ? { name: feature.lang.name, color: feature.lang.color } : repo?.language;

  let cx = 50;
  const chips = (feature.chips ?? []).map((c) => {
    const w = c.length * 7.4 + 18;
    const out = `<rect x="${cx}" y="128" width="${w}" height="20" rx="10" fill="${shell}" fill-opacity="0.35" stroke="${INK}" stroke-opacity="0.25"/><text x="${cx + w / 2}" y="142" font-size="11" text-anchor="middle" fill="${INK}">${esc(c)}</text>`;
    cx += w + 6;
    return out;
  }).join('');

  const body = `
<defs>
  <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="1" stop-color="#000000" stop-opacity="0.12"/></linearGradient>
</defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="20" fill="${shell}"/>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="20" fill="url(#sh)"/>
${[[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${INK}" opacity="0.35"/><path d="M${x - 3} ${y} h6" stroke="${shell}" stroke-width="1.5"/>`).join('')}

<!-- label -->
<rect x="36" y="26" width="${W - 72}" height="172" rx="10" fill="${C.cream}"/>
<rect x="36" y="26" width="${W - 72}" height="24" rx="10" fill="${INK}"/>
<rect x="36" y="40" width="${W - 72}" height="10" fill="${INK}"/>
<text x="52" y="43" font-size="11" fill="${C.cream}" letter-spacing="1.5">SIDE A · ABUDORA TAPES</text>
<text x="${W - 52}" y="43" font-size="11" fill="${shell}" text-anchor="end" font-weight="700">#${num}</text>
<text x="50" y="80" font-size="22" font-weight="800" fill="${INK}">${esc(title)}</text>
${blurb.map((l, i) => `<text x="50" y="${102 + i * 16}" font-size="12" fill="#5a5270">${esc(l)}</text>`).join('')}
${chips}

<!-- window + reels -->
<rect x="122" y="156" width="196" height="36" rx="18" fill="${INK}"/>
<rect x="160" y="170" width="120" height="8" fill="#5b3b33"/>
${reel(160, 174, 3.2)}
${reel(280, 174, 2.4)}

<!-- bottom -->
<path d="M96 ${H - 8} L116 212 H${W - 116} L${W - 96} ${H - 8}Z" fill="${INK}" opacity="0.22"/>
${[150, 200, 240, 290].map((x) => `<circle cx="${x}" cy="240" r="${x === 200 || x === 240 ? 3.5 : 6}" fill="${INK}" opacity="0.4"/>`).join('')}
${lang ? `<circle cx="52" cy="232" r="5" fill="${lang.color ?? C.muted}" stroke="${INK}" stroke-opacity="0.4"/><text x="62" y="236" font-size="11" fill="${INK}">${esc(lang.name.toLowerCase())}</text>` : ''}
<text x="${W - 40}" y="236" font-size="11" fill="${INK}" text-anchor="end" font-weight="700">▶ play</text>
`;
  return svg(W, H, body, { title: `${title}: ${feature.blurb ?? repo?.description ?? ''}` });
}
