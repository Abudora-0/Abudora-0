import { C, HAND, esc, svg, wrap, fmt } from '../lib/theme.mjs';

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const INK = '#3a3354';

// ---------------------------------------------------------------- nightstand (anilist)
export function renderNightstand(ani) {
  const W = 1200, H = 370;
  const covers = ani.reading.map((m, i) => {
    const x = 330 + i * 140, y = 62, w = 120, h = 176;
    const tilt = i % 2 ? 1.6 : -1.4;
    const ribbon = m.color ?? C.rose;
    const pct = m.chapters ? Math.min(1, m.progress / m.chapters) : null;
    const img = m.cover
      ? `<image href="${m.cover}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cv${i})"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${ribbon}"/>`;
    return `<g class="lean" style="animation-delay:-${i * 0.9}s">
  <g transform="rotate(${tilt} ${x + w / 2} ${y + h})">
    <clipPath id="cv${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/></clipPath>
    <rect x="${x + 5}" y="${y + 6}" width="${w}" height="${h}" rx="6" fill="#000" opacity="0.35"/>
    ${img}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="#ffffff" stroke-opacity="0.18"/>
    <rect x="${x}" y="${y}" width="10" height="${h}" fill="#000" opacity="0.18" clip-path="url(#cv${i})"/>
    <path d="M${x + w - 30} ${y - 8} h16 v44 l-8 -7 l-8 7z" fill="${ribbon}"/>
  </g>
</g>
<text x="${x}" y="${y + h + 44}" font-size="12" fill="${C.cream}">${esc(clip(m.title.toLowerCase(), 16))}</text>
<rect x="${x}" y="${y + h + 54}" width="${w}" height="6" rx="3" fill="${C.plum}"/>
${pct != null ? `<rect x="${x}" y="${y + h + 54}" width="${(w * pct).toFixed(1)}" height="6" rx="3" fill="${C.amber}"/>` : `<rect x="${x}" y="${y + h + 54}" width="${w}" height="6" rx="3" fill="${C.amber}" opacity="0.35" stroke-dasharray="4 4"/>`}
<text x="${x}" y="${y + h + 76}" font-size="11" fill="${C.muted}">ch ${m.progress}${m.chapters ? ` / ${m.chapters}` : ' · ongoing'}</text>`;
  }).join('\n');

  const body = `
<defs>
  <linearGradient id="nbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.night}"/></linearGradient>
  <radialGradient id="nglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.amber}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></radialGradient>
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="url(#nbg)" stroke="${C.line}" stroke-width="1.5"/>
<ellipse class="glow" cx="120" cy="150" rx="210" ry="170" fill="url(#nglow)"/>

<!-- bedside lamp -->
<g transform="translate(70 40)">
  <path d="M10 70 L90 70 L72 10 L28 10Z" fill="${C.peach}"/>
  <path d="M10 70 L90 70" stroke="#d99a72" stroke-width="4" stroke-linecap="round"/>
  <ellipse class="glow" cx="50" cy="72" rx="22" ry="5" fill="#fff6dc"/>
  <rect x="46" y="74" width="8" height="44" fill="#4a4266"/>
  <ellipse cx="50" cy="122" rx="30" ry="8" fill="#4a4266"/>
</g>

<text x="40" y="220" font-size="38" font-weight="800" fill="${C.amber}">${ani.chaptersRead.toLocaleString('en-US')}</text>
<text x="40" y="246" font-size="13" fill="${C.cream}">chapters read</text>
<text x="40" y="270" font-size="12" fill="${C.muted}">${fmt(ani.total)} titles on anilist</text>
<text x="40" y="312" font-size="20" fill="${C.rose}" style="font-family:${HAND}">backlog status: hopeless ♡</text>
<line x1="296" y1="40" x2="296" y2="${H - 40}" stroke="${C.line}" stroke-dasharray="3 6"/>

<rect x="312" y="${62 + 176 + 4}" width="${W - 340}" height="12" rx="4" fill="${C.wood}"/>
<rect x="312" y="${62 + 176 + 13}" width="${W - 340}" height="3" fill="#000" opacity="0.25"/>
${covers}`;

  const style = `
  .glow { animation: glow 5s ease-in-out infinite; }
  @keyframes glow { 0%,100% { opacity: .9; } 50% { opacity: .7; } }
  .lean { animation: lean 7s ease-in-out infinite; }
  @keyframes lean { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`;
  return svg(W, H, body, { title: `currently reading on anilist: ${ani.reading.map((m) => m.title).join(', ')}`, style });
}

// ---------------------------------------------------------------- fridge guestbook
const PAPERS = ['#f6e3b4', '#f7cfcf', '#cfe8d6', '#d6dcf5', '#f2d6ea', '#fbe0c3'];
const MAGNETS = [C.rose, C.rain, C.amber, C.sage, C.lilac, C.peach];

function note(n, i, x, y) {
  const seed = (n.number ?? i) * 9301 + 49297;
  const tilt = ((seed % 70) / 10 - 3.5).toFixed(1);
  const paper = PAPERS[(n.number ?? i) % PAPERS.length];
  const lines = wrap(n.text, 22).slice(0, 4);
  if (wrap(n.text, 22).length > 4) lines[3] = clip(lines[3], 21) + (lines[3].endsWith('…') ? '' : '…');
  const date = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase() : '';
  return `<g transform="translate(${x} ${y}) rotate(${tilt} 125 80)">
  <rect x="5" y="7" width="250" height="164" rx="3" fill="#000" opacity="0.18"/>
  <rect x="0" y="0" width="250" height="164" rx="3" fill="${paper}"/>
  <path d="M220 164 L250 134 V164Z" fill="#000" opacity="0.07"/>
  <circle cx="125" cy="4" r="11" fill="${MAGNETS[i % MAGNETS.length]}"/><circle cx="121" cy="0" r="3.5" fill="#fff" opacity="0.5"/>
  ${lines.map((l, j) => `<text x="18" y="${44 + j * 25}" font-size="21" fill="#4e3a30" style="font-family:${HAND}">${esc(l)}</text>`).join('\n  ')}
  ${n.avatar ? `<clipPath id="av${i}"><circle cx="28" cy="144" r="11"/></clipPath><image href="${n.avatar}" x="17" y="133" width="22" height="22" clip-path="url(#av${i})"/>` : `<circle cx="28" cy="144" r="11" fill="${MAGNETS[i % MAGNETS.length]}"/>`}
  <text x="46" y="148" font-size="11" fill="#6b5a4a">${esc(n.login ? '@' + clip(n.login, 16) : '')}</text>
  <text x="234" y="148" font-size="10" fill="#9c8a74" text-anchor="end">${esc(date)}</text>
</g>`;
}

export function renderFridge(notes, { owner }) {
  const W = 1200, COLS = 4;
  const list = notes.length ? notes : [{ text: 'the fridge is empty... be the first to leave a note ☕', login: owner, createdAt: null, number: 3 }];
  const rows = Math.ceil(list.length / COLS);
  const H = 120 + rows * 200 + 10;
  const letters = 'guestbook'.split('');
  const body = `
<defs>
  <linearGradient id="door" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9ebe0"/><stop offset="1" stop-color="#b9d4c4"/></linearGradient>
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="26" fill="url(#door)" stroke="#8fb39e" stroke-width="2"/>
<rect x="24" y="16" width="${W - 110}" height="6" rx="3" fill="#ffffff" opacity="0.45"/>
<rect x="${W - 58}" y="60" width="16" height="${H - 120}" rx="8" fill="#9fbfac"/>
<rect x="${W - 55}" y="66" width="5" height="${H - 132}" rx="2.5" fill="#ffffff" opacity="0.5"/>
${letters.map((ch, i) => {
    const x = 50 + i * 38, rot = ((i * 37) % 13) - 6;
    return `<g transform="rotate(${rot} ${x + 15} 58)"><rect x="${x}" y="38" width="30" height="38" rx="7" fill="${MAGNETS[i % MAGNETS.length]}"/><text x="${x + 15}" y="66" font-size="24" font-weight="800" text-anchor="middle" fill="${INK}">${ch}</text></g>`;
  }).join('')}
<text x="${W - 90}" y="66" font-size="22" fill="#4f6b5b" text-anchor="end" style="font-family:${HAND}">${notes.length ? `${notes.length} note${notes.length === 1 ? '' : 's'} on the fridge` : 'waiting for your note'} ♡</text>
${list.map((n, i) => note(n, i, 50 + (i % COLS) * 272, 118 + Math.floor(i / COLS) * 200)).join('\n')}`;
  return svg(W, H, body, { title: `guestbook fridge: ${list.map((n) => `${n.login}: ${n.text}`).join(' | ')}` });
}
