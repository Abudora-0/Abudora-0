import * as icons from 'simple-icons';
import { C, HAND, esc, svg, readableIcon } from '../lib/theme.mjs';

const JW = 88, STEP = 122, ROW = 170, X0 = 44;
const LIDS = [C.rose, C.sage, C.lilac];

function jar(item, x, y, lid, delay, uid) {
  const icon = icons[item.icon];
  const color = icon ? readableIcon(icon.hex) : C.cream;
  const s = 30 / 24;
  const glyph = icon
    ? `<g transform="translate(${JW / 2 - 15} 36) scale(${s})"><path d="${icon.path}" fill="${color}"/></g>`
    : `<text x="${JW / 2}" y="58" font-size="22" text-anchor="middle" fill="${C.cream}">${esc(item.name[0])}</text>`;
  return `<g class="bob" style="animation-delay:-${delay}s">
  <g transform="translate(${x} ${y})">
    <clipPath id="jc${uid}"><rect x="0" y="18" width="${JW}" height="84" rx="18"/></clipPath>
    <rect x="0" y="18" width="${JW}" height="84" rx="18" fill="#ffffff" fill-opacity="0.06"/>
    <rect clip-path="url(#jc${uid})" x="0" y="84" width="${JW}" height="20" fill="${color}" opacity="0.22"/>
    <rect x="0" y="18" width="${JW}" height="84" rx="18" fill="none" stroke="${C.cream}" stroke-opacity="0.35" stroke-width="2"/>
    <rect x="10" y="28" width="7" height="44" rx="3.5" fill="#ffffff" opacity="0.13"/>
    <rect x="12" y="10" width="${JW - 24}" height="10" rx="3" fill="#ffffff" fill-opacity="0.08" stroke="${C.cream}" stroke-opacity="0.3"/>
    <rect x="6" y="0" width="${JW - 12}" height="13" rx="5" fill="${lid}"/>
    <rect x="6" y="9" width="${JW - 12}" height="4" rx="2" fill="#000" opacity="0.15"/>
    ${glyph}
    <rect x="10" y="73" width="${JW - 20}" height="19" rx="3" fill="${C.cream}" transform="rotate(-2 ${JW / 2} 82)"/>
    <text x="${JW / 2}" y="86" font-size="10.5" font-weight="700" text-anchor="middle" fill="#3a3354" transform="rotate(-2 ${JW / 2} 82)">${esc(item.name)}</text>
  </g>
</g>`;
}

export function renderStack(config) {
  const cols = Math.max(...config.stack.map((s) => s.items.length));
  const W = X0 * 2 + (cols - 1) * STEP + JW;
  const H = config.stack.length * ROW + 24;
  let uid = 0;
  const rows = config.stack.map((shelf, r) => {
    const y = 26 + r * ROW;
    const jars = shelf.items.map((it, i) => jar(it, X0 + i * STEP, y, LIDS[r % LIDS.length], (i * 0.45 + r * 0.3).toFixed(2), uid++)).join('\n');
    const plankY = y + 104;
    return `${jars}
<rect x="18" y="${plankY}" width="${W - 36}" height="14" rx="4" fill="${C.wood}"/>
<rect x="18" y="${plankY + 11}" width="${W - 36}" height="3" rx="1.5" fill="#000" opacity="0.2"/>
<path d="M52 ${plankY + 14} v14 h12 M${W - 64} ${plankY + 14} v14 h12" stroke="${C.woodDark}" stroke-width="5" fill="none"/>
<g transform="translate(${W / 2} ${plankY + 14})">
  <line x1="-30" y1="0" x2="-22" y2="10" stroke="${C.muted}" stroke-width="1.2"/><line x1="30" y1="0" x2="22" y2="10" stroke="${C.muted}" stroke-width="1.2"/>
  <rect x="-${shelf.shelf.length * 4.6 + 18}" y="10" width="${shelf.shelf.length * 9.2 + 36}" height="24" rx="5" fill="#26302b" stroke="${C.woodDark}" stroke-width="2"/>
  <text x="0" y="27" font-size="15" text-anchor="middle" fill="${C.cream}" style="font-family:${HAND}">${esc(shelf.shelf)}</text>
</g>`;
  });

  const style = `
  .bob { animation: bob 4.8s ease-in-out infinite; }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`;

  const bg = `<defs><linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.night}"/></linearGradient>
<radialGradient id="sglow" cx="0.5" cy="0" r="0.8"><stop offset="0" stop-color="${C.amber}" stop-opacity="0.12"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></radialGradient></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="url(#sbg)" stroke="${C.line}" stroke-width="1.5"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="url(#sglow)"/>`;

  return svg(W, H, bg + rows.join('\n'), { title: `tech stack spice shelf: ${config.stack.flatMap((s) => s.items.map((i) => i.name)).join(', ')}`, style });
}
