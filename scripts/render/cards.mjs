import { C, HAND, esc, svg, frame, wrap, fmt } from '../lib/theme.mjs';

const W = 495, H = 210;

const title = (t, sub) => `<text x="28" y="40" font-size="16" font-weight="700" fill="${C.amber}">${esc(t)}</text>
${sub ? `<text x="${W - 28}" y="40" font-size="11" fill="${C.muted}" text-anchor="end">${esc(sub)}</text>` : ''}
<line x1="28" y1="54" x2="${W - 28}" y2="54" stroke="${C.line}" stroke-dasharray="3 5"/>`;

const shortDate = (iso) => (iso ? new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toLowerCase() : '—');

// ---------------------------------------------------------------- coffee counter
export function renderStats({ totals, streak }) {
  const rows = [
    ['✦', 'contributions · past year', streak.yearTotal],
    ['✎', 'commits · past year', totals.commits],
    ['⇄', 'pull requests', totals.prs],
    ['▣', 'public repos', totals.repos],
    ['★', 'stars collected', totals.stars],
  ];
  const fill = Math.min(1, streak.activeDays / 365);
  const mugTop = 84, mugH = 88, level = mugTop + mugH - mugH * Math.max(0.12, fill);
  const body = `${frame(W, H, 'st')}
${title('☕ coffee counter', `brewing since ${shortDate(streak.since)}`)}
${rows.map(([ic, label, v], i) => {
    const y = 84 + i * 25;
    return `<g class="rise" style="animation-delay:${(i * 0.12).toFixed(2)}s">
  <text x="30" y="${y}" font-size="13" fill="${C.sage}">${ic}</text>
  <text x="52" y="${y}" font-size="13" fill="${C.muted}">${esc(label)}</text>
  <text x="312" y="${y}" font-size="14" font-weight="700" fill="${C.cream}" text-anchor="end">${fmt(v)}</text>
</g>`;
  }).join('\n')}
<g transform="translate(350 0)">
  <clipPath id="mug"><rect x="0" y="${mugTop}" width="84" height="${mugH}" rx="14"/></clipPath>
  ${[18, 38, 58].map((x, i) => `<path class="steam" style="animation-delay:-${i * 1.1}s" d="M${x} 78 q -5 -6 0 -12 q 5 -6 0 -12" stroke="${C.cream}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('')}
  <path d="M84 104 h8 a18 18 0 0 1 0 36 h-8" stroke="${C.rose}" stroke-width="8" fill="none"/>
  <rect x="0" y="${mugTop}" width="84" height="${mugH}" rx="14" fill="#ffffff" fill-opacity="0.06"/>
  <rect clip-path="url(#mug)" x="0" y="${mugTop + mugH}" width="84" height="${mugH}" fill="#8a5a44">
    <animate attributeName="y" from="${mugTop + mugH}" to="${level.toFixed(1)}" dur="1.8s" fill="freeze" calcMode="spline" keySplines="0.3 0 0.2 1" keyTimes="0;1"/>
  </rect>
  <rect x="0" y="${mugTop}" width="84" height="${mugH}" rx="14" fill="none" stroke="${C.rose}" stroke-width="4"/>
  <text x="42" y="192" font-size="11" fill="${C.muted}" text-anchor="middle">${streak.activeDays} cozy days / yr</text>
</g>`;
  const style = `
  .steam { animation: steam 3.3s ease-in-out infinite; }
  @keyframes steam { 0% { opacity: 0; transform: translateY(6px); } 40% { opacity: .5; } 100% { opacity: 0; transform: translateY(-14px); } }
  .rise { animation: rise .8s ease-out both; }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`;
  return svg(W, H, body, { title: `github stats: ${streak.yearTotal} contributions in the past year, ${totals.commits} commits, ${totals.prs} pull requests, ${totals.repos} repos, ${totals.stars} stars`, style });
}

// ---------------------------------------------------------------- tea blend
export function renderLanguages(langs) {
  const bx = 28, bw = W - 56, by = 72;
  let x = bx;
  const segs = langs.map((l, i) => {
    const w = (l.pct / 100) * bw;
    const seg = `<rect x="${x.toFixed(2)}" y="${by}" width="0" height="16" fill="${l.color}">
    <animate attributeName="width" from="0" to="${Math.max(0, w - 1.5).toFixed(2)}" begin="${(i * 0.12).toFixed(2)}s" dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.3 0 0.2 1" keyTimes="0;1"/>
  </rect>`;
    x += w;
    return seg;
  }).join('\n');
  const legend = langs.slice(0, 8).map((l, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const lx = 32 + col * 225, ly = 122 + row * 23;
    return `<circle cx="${lx + 5}" cy="${ly - 4}" r="5.5" fill="${l.color}"/>
<text x="${lx + 18}" y="${ly}" font-size="13" fill="${C.cream}">${esc(l.name.toLowerCase())}</text>
<text x="${lx + 202}" y="${ly}" font-size="12" fill="${C.muted}" text-anchor="end">${l.pct.toFixed(1)}%</text>`;
  }).join('\n');
  const body = `${frame(W, H, 'lg')}
${title('🍵 tea blend', 'languages steeped by bytes')}
<clipPath id="bar"><rect x="${bx}" y="${by}" width="${bw}" height="16" rx="8"/></clipPath>
<rect x="${bx}" y="${by}" width="${bw}" height="16" rx="8" fill="${C.plum}"/>
<g clip-path="url(#bar)">${segs}</g>
${legend}`;
  return svg(W, H, body, { title: `top languages: ${langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', ')}` });
}

// ---------------------------------------------------------------- candle streak
export function renderStreak(streak) {
  const ratio = streak.longest ? streak.current / streak.longest : 0;
  const candleH = 34 + 50 * Math.min(1, ratio);
  const base = 176, cx = W / 2;
  const body = `${frame(W, H, 'sk')}
${title('🕯️ candle streak', `${fmt(streak.total)} contributions all-time`)}
<g text-anchor="middle">
  <text x="112" y="120" font-size="46" font-weight="800" fill="${C.amber}">${streak.current}</text>
  <text x="112" y="146" font-size="12" fill="${C.cream}">current streak</text>
  <text x="112" y="166" font-size="11" fill="${C.muted}">day${streak.current === 1 ? '' : 's'} in a row</text>

  <text x="${W - 112}" y="120" font-size="46" font-weight="800" fill="${C.rose}">${streak.longest}</text>
  <text x="${W - 112}" y="146" font-size="12" fill="${C.cream}">longest streak</text>
  <text x="${W - 112}" y="166" font-size="11" fill="${C.muted}">ended ${shortDate(streak.longestEnd)}</text>
</g>
<g>
  <ellipse cx="${cx}" cy="${base - candleH - 16}" rx="26" ry="30" fill="${C.amber}" opacity="0.12" class="halo"/>
  <g class="flame" style="transform-origin:${cx}px ${base - candleH}px">
    <path d="M${cx} ${base - candleH - 34} C ${cx + 12} ${base - candleH - 18} ${cx + 10} ${base - candleH - 4} ${cx} ${base - candleH - 2} C ${cx - 10} ${base - candleH - 4} ${cx - 12} ${base - candleH - 18} ${cx} ${base - candleH - 34}Z" fill="${C.amber}"/>
    <path d="M${cx} ${base - candleH - 20} C ${cx + 5} ${base - candleH - 12} ${cx + 4} ${base - candleH - 5} ${cx} ${base - candleH - 4} C ${cx - 4} ${base - candleH - 5} ${cx - 5} ${base - candleH - 12} ${cx} ${base - candleH - 20}Z" fill="#fff3cf"/>
  </g>
  <line x1="${cx}" y1="${base - candleH}" x2="${cx}" y2="${base - candleH + 6}" stroke="${C.night}" stroke-width="2"/>
  <rect x="${cx - 16}" y="${base - candleH}" width="32" height="${candleH}" rx="4" fill="${C.cream}"/>
  <path d="M${cx - 16} ${base - candleH + 6} q 6 10 10 0 q 4 16 10 2 q 5 8 12 -2" stroke="#e9dcc0" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="${cx}" cy="${base + 4}" rx="34" ry="8" fill="${C.plum}"/>
  <rect x="${cx - 30}" y="${base - 2}" width="60" height="8" rx="4" fill="${C.line}"/>
</g>
<text x="${W / 2}" y="198" font-size="10.5" fill="${C.muted}" text-anchor="middle">best day: ${streak.best.count} contributions on ${shortDate(streak.best.date)}</text>`;
  const style = `
  .flame { animation: flame 1.6s ease-in-out infinite; transform-box: view-box; }
  @keyframes flame { 0%,100% { transform: scale(1,1) rotate(0); } 30% { transform: scale(.94,1.06) rotate(-2deg); } 60% { transform: scale(1.04,.96) rotate(2deg); } }
  .halo { animation: halo 2.4s ease-in-out infinite; }
  @keyframes halo { 0%,100% { opacity: .1; } 50% { opacity: .22; } }`;
  return svg(W, H, body, { title: `contribution streak: current ${streak.current} days, longest ${streak.longest} days`, style });
}

// ---------------------------------------------------------------- sticky note
export function renderQuote({ quote, date }) {
  const lines = wrap(`“${quote.text}”`, 38).slice(0, 4);
  const top = 92 - (lines.length - 1) * 11;
  const body = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${C.night}" stroke="${C.line}" stroke-width="1.5"/>
<g transform="rotate(-1.6 ${W / 2} ${H / 2})">
  <rect x="44" y="26" width="${W - 84}" height="164" rx="4" fill="#000" opacity="0.28" transform="translate(5 6)"/>
  <rect x="40" y="22" width="${W - 80}" height="164" rx="4" fill="#f6e3b4"/>
  <path d="M${W - 80} 186 L${W - 40} 146 V186Z" fill="#e5cd96"/>
  <rect x="${W / 2 - 46}" y="12" width="92" height="24" fill="${C.cream}" opacity="0.55" transform="rotate(3 ${W / 2} 24)"/>
  <text x="60" y="52" font-size="11" fill="#9c7f5a">note to self · ${esc(date)}</text>
  ${lines.map((l, i) => `<text x="60" y="${top + i * 24}" font-size="17" fill="#4e3a30" style="font-family:${HAND}">${esc(l)}</text>`).join('\n  ')}
  <text x="${W - 64}" y="170" font-size="13" fill="#8a6a4a" text-anchor="end" style="font-family:${HAND}">— ${esc(quote.author)}</text>
</g>`;
  return svg(W, H, body, { title: `quote of the day: ${quote.text} (${quote.author})` });
}

// ---------------------------------------------------------------- link pills
const GLYPH = {
  pen: `<path d="M4 20l1.2-4.8L16.5 3.9a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L8.8 18.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14.5 5.9l3.6 3.6" stroke="currentColor" stroke-width="2"/>`,
  globe: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18" stroke="currentColor" stroke-width="2"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  linkedin: `<rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor"/><rect x="6" y="10" width="3" height="8" fill="${C.deep}"/><circle cx="7.5" cy="6.8" r="1.8" fill="${C.deep}"/><path d="M11.5 10h2.8v1.3c.5-.9 1.6-1.5 2.9-1.5 2.1 0 2.8 1.3 2.8 3.4V18h-3v-4.2c0-1-.3-1.7-1.2-1.7-.9 0-1.3.7-1.3 1.7V18h-3z" fill="${C.deep}"/>`,
};

export function renderButton(link, icons) {
  const color = { portfolio: C.amber, linkedin: C.rain, email: C.rose, x: C.cream, instagram: C.lilac, guestbook: C.sage }[link.id] ?? C.sage;
  const w = Math.round(58 + link.label.length * 8.6);
  const icon = icons[link.icon];
  const glyph = icon ? `<path d="${icon.path}" fill="currentColor"/>` : GLYPH[link.icon] ?? '';
  const body = `
<rect x="1" y="1" width="${w - 2}" height="42" rx="21" fill="${C.deep}" stroke="${color}" stroke-opacity="0.55" stroke-width="1.5"/>
<circle cx="23" cy="22" r="14" fill="${color}" opacity="0.16"/>
<g transform="translate(15 14) scale(0.667)" color="${color}" style="color:${color}">${glyph}</g>
<text x="44" y="27" font-size="14" fill="${C.cream}">${esc(link.label)}</text>`;
  return svg(w, 44, body, { title: link.label });
}

// ---------------------------------------------------------------- rain divider
export function renderDivider({ text = '', seed = 3 } = {}) {
  const w = 1200, h = 90;
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const ripples = Array.from({ length: 9 }, (_, i) => {
    const x = 60 + i * 135 + r() * 40, y = 58 + r() * 14, d = (2.6 + r() * 1.6).toFixed(2), b = (r() * 3).toFixed(2);
    return `<line x1="${x}" y1="-10" x2="${x - 3}" y2="4" stroke="${C.rain}" stroke-width="1.5" stroke-linecap="round" opacity="0">
  <animate attributeName="opacity" values="0;.7;0" keyTimes="0;.1;.3" dur="${d}s" begin="-${b}s" repeatCount="indefinite"/>
  <animateTransform attributeName="transform" type="translate" values="0 0;-6 ${y};-6 ${y}" keyTimes="0;.3;1" dur="${d}s" begin="-${b}s" repeatCount="indefinite"/>
</line>
${[0, 0.25].map((o) => `<ellipse cx="${x - 6}" cy="${y}" rx="0" ry="0" fill="none" stroke="${C.rain}" stroke-width="1.2">
  <animate attributeName="rx" values="0;0;26" keyTimes="0;.3;1" dur="${d}s" begin="-${(Number(b) + o * d).toFixed(2)}s" repeatCount="indefinite"/>
  <animate attributeName="ry" values="0;0;6" keyTimes="0;.3;1" dur="${d}s" begin="-${(Number(b) + o * d).toFixed(2)}s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0;.8;0" keyTimes="0;.3;1" dur="${d}s" begin="-${(Number(b) + o * d).toFixed(2)}s" repeatCount="indefinite"/>
</ellipse>`).join('')}`;
  }).join('\n');
  const label = text
    ? `<rect x="${w / 2 - text.length * 5.2 - 22}" y="14" width="${text.length * 10.4 + 44}" height="32" rx="16" fill="${C.deep}" stroke="${C.line}"/><text x="${w / 2}" y="36" font-size="17" fill="${C.cream}" text-anchor="middle" style="font-family:${HAND}">${esc(text)}</text>`
    : '';
  const body = `<path d="M0 ${h - 8} Q 300 ${h - 20} 600 ${h - 10} T 1200 ${h - 12}" stroke="${C.line}" stroke-width="1.5" fill="none" stroke-dasharray="2 7" stroke-linecap="round"/>
${ripples}
${label}`;
  return svg(w, h, body, { title: text || 'rain divider' });
}
