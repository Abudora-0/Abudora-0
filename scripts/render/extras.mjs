import { C, HAND, esc, svg, wrap } from '../lib/theme.mjs';

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const INK = '#3a3354';

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
