// Shared palette + tiny SVG helpers. Everything renders as a standalone <img>,
// so no JS and no external fonts: CSS keyframes and SMIL only.

export const C = {
  night: '#1e1b2e',
  deep: '#2a2540',
  plum: '#3a3354',
  line: '#4a4266',
  amber: '#f6c177',
  cream: '#f3e9d2',
  rose: '#eb9f9f',
  sage: '#9ccfb0',
  rain: '#8fb8de',
  lilac: '#c4a7e7',
  peach: '#f2b48c',
  muted: '#a59fbf',
  wood: '#6b4f3f',
  woodDark: '#4e3a30',
};

export const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
export const HAND = "'Caveat','Segoe Print','Bradley Hand','Comic Sans MS','Chalkboard SE',cursive";

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function svg(w, h, body, { title = '', style = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
  text { font-family: ${MONO}; }
  ${style}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
${body}
</svg>
`;
}

/** Rounded cozy card background with a faint inner glow. */
export function frame(w, h, id = 'f') {
  return `<defs>
  <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.night}"/>
  </linearGradient>
  <radialGradient id="${id}glow" cx="0.85" cy="0" r="0.9">
    <stop offset="0" stop-color="${C.amber}" stop-opacity="0.13"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="18" fill="url(#${id}bg)" stroke="${C.line}" stroke-width="1.5"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="18" fill="url(#${id}glow)"/>`;
}

export function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export const fmt = (n) => (n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n.toLocaleString('en-US'));

/** Relative luminance, used to lift dark brand logos onto the dark card. */
export function luminance(hex) {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const readableIcon = (hex) => (luminance('#' + hex) < 0.08 ? C.cream : '#' + hex);
