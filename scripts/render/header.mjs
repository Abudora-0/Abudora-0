import { C, HAND, esc, svg } from '../lib/theme.mjs';

// deterministic randomness so the scene doesn't jitter between builds
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// time of day: colors + lamp. weather is layered on top separately.
const TIMES = {
  night:     { sky: ['#0d0e22', '#1f1d40', '#35305a'], wall: ['#25203a', '#1a1728'], city: '#110f1b', lights: 0.95, lamp: true,  rainColor: C.rain,    cloud: ['#2c2a4d', '#23213d'] },
  dusk:      { sky: ['#3a2a5c', '#b96a78', '#f2a36f'], wall: ['#2c2339', '#1d1829'], city: '#291d33', lights: 0.6,  lamp: true,  rainColor: '#f3d9c8', cloud: ['#8a5a78', '#5e4460'] },
  morning:   { sky: ['#86b3dc', '#c6def0', '#f6e7cf'], wall: ['#352f4c', '#28233a'], city: '#6a6f93', lights: 0,    lamp: false, rainColor: '#ffffff', cloud: ['#ffffff', '#b9c0cf'] },
  afternoon: { sky: ['#6b9fd1', '#a9cbe8', '#dcebf3'], wall: ['#332d49', '#262138'], city: '#5c618a', lights: 0,    lamp: false, rainColor: '#ffffff', cloud: ['#ffffff', '#b5bccb'] },
};

// window glass area (in scene coordinates)
const GX = 74, GY = 64, GW = 352, GH = 232;

const STYLE = `
  .drop { animation: fall linear infinite; }
  @keyframes fall { from { transform: translate(0,0); } to { transform: translate(-22px, 290px); } }
  .flake { animation: flake linear infinite; }
  @keyframes flake { 0% { transform: translate(0,0); } 50% { transform: translate(10px,145px); } 100% { transform: translate(-6px,290px); } }
  .slide { animation: slide ease-in infinite; }
  @keyframes slide { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: .35; } 100% { transform: translateY(215px); opacity: 0; } }
  .twinkle { animation: twinkle ease-in-out infinite; }
  @keyframes twinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
  .flick { animation: flick 9s steps(1) infinite; }
  @keyframes flick { 0%,62% { opacity: .9; } 63%,80% { opacity: 0; } 81%,100% { opacity: .9; } }
  .drift { animation: drift linear infinite; }
  @keyframes drift { from { transform: translateX(-160px); } to { transform: translateX(420px); } }
  .haze { animation: haze ease-in-out infinite alternate; }
  @keyframes haze { from { transform: translateX(-40px); } to { transform: translateX(40px); } }
  .flash { animation: flash 7s linear infinite; opacity: 0; }
  @keyframes flash { 0%,58%,64%,100% { opacity: 0; } 59% { opacity: .9; } 60% { opacity: .15; } 61.5% { opacity: .75; } }
  .roomflash { animation: roomflash 7s linear infinite; opacity: 0; }
  @keyframes roomflash { 0%,58%,64%,100% { opacity: 0; } 59% { opacity: .10; } 61.5% { opacity: .07; } }
  .steam { animation: steam 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
  @keyframes steam { 0% { opacity: 0; transform: translateY(8px) scaleY(.8); } 35% { opacity: .55; } 100% { opacity: 0; transform: translateY(-26px) scaleY(1.15); } }
  .glow { animation: glow 5s ease-in-out infinite; }
  @keyframes glow { 0%,100% { opacity: .9; } 47% { opacity: 1; } 50% { opacity: .78; } 53% { opacity: .96; } }
  .breathe { animation: breathe 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
  @keyframes breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.025,1.07); } }
  .z { animation: z 4.5s ease-out infinite; opacity: 0; }
  @keyframes z { 0% { opacity: 0; transform: translate(0,0) scale(.6); } 25% { opacity: .9; } 100% { opacity: 0; transform: translate(26px,-52px) scale(1.3); } }
  .sway { animation: sway 6s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
  @keyframes sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  .fairy { animation: fairy 2.8s ease-in-out infinite; }
  @keyframes fairy { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
  .note { animation: note 5s ease-out infinite; opacity: 0; }
  @keyframes note { 0% { opacity: 0; transform: translate(0,0); } 20% { opacity: .9; } 100% { opacity: 0; transform: translate(-18px,-60px) rotate(-12deg); } }
  .blink { animation: blinkc 1.05s steps(1) infinite; }
  @keyframes blinkc { 0%,55% { opacity: 1; } 56%,100% { opacity: 0; } }
  .eq { animation: eq 1.1s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
  @keyframes eq { 0%,100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
  .dust { animation: dust 9s ease-in-out infinite; }
  @keyframes dust { 0%,100% { transform: translate(0,0); opacity: .0; } 50% { transform: translate(14px,-18px); opacity: .8; } }
  .tail { animation: tail 5s ease-in-out infinite; transform-box: fill-box; transform-origin: left center; }
  @keyframes tail { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-6deg); } }
`;

// ------------------------------------------------------------------ pieces

function defs(t, w, h) {
  return `<defs>
  <clipPath id="card"><rect width="${w}" height="${h}" rx="22"/></clipPath>
  <clipPath id="glass"><rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" rx="4"/></clipPath>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${t.sky.map((c, i) => `<stop offset="${i / (t.sky.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.wall[0]}"/><stop offset="1" stop-color="${t.wall[1]}"/></linearGradient>
  <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5a47"/><stop offset="0.12" stop-color="${C.wood}"/><stop offset="1" stop-color="#3a2b24"/></linearGradient>
  <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.amber}" stop-opacity="0.55"/><stop offset="0.5" stop-color="${C.amber}" stop-opacity="0.14"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></radialGradient>
  <radialGradient id="screen" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#8fb8de" stop-opacity="0.22"/><stop offset="1" stop-color="#8fb8de" stop-opacity="0"/></radialGradient>
  <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.amber}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.amber}" stop-opacity="0"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3cf" stop-opacity="0.28"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></linearGradient>
</defs>`;
}

function wall(w, h) {
  const rows = Math.ceil(h / 26), cols = Math.ceil(w / 40) + 1;
  const dots = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => `<circle cx="${20 + col * 40 + (row % 2) * 20}" cy="${50 + row * 26}" r="1.2" fill="#ffffff" opacity="0.035"/>`).join('')).join('');
  return `<rect width="${w}" height="${h}" fill="url(#wall)"/>\n${dots}`;
}

function fairyLights(w) {
  const bulbs = [C.amber, C.rose, C.sage, C.lilac, C.peach];
  const n = Math.floor((w - 60) / 44.5) + 1;
  const yAt = (i) => 22 + Math.sin((i / (n - 1)) * Math.PI * 3) * 6;
  const wire = Array.from({ length: n + 1 }, (_, i) => `${(30 + i * 44.5).toFixed(1)},${(yAt(i) + 5).toFixed(1)}`).join(' ');
  const out = [`<polyline points="${wire}" fill="none" stroke="#4a4266" stroke-width="1.5"/>`];
  for (let i = 0; i < n; i++) {
    const x = 30 + i * 44.5, y = yAt(i) + 10, c = bulbs[i % bulbs.length];
    out.push(`<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y}" stroke="#4a4266" stroke-width="1.5"/><circle class="fairy" style="animation-delay:-${(i * 0.37).toFixed(2)}s" cx="${x}" cy="${y + 4}" r="4.2" fill="${c}"/><circle cx="${x}" cy="${y + 4}" r="11" fill="${c}" opacity="0.18"/>`);
  }
  return out.join('\n');
}

function sky(t, wx, timeName, r) {
  const out = [`<rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" fill="url(#sky)"/>`];
  const heavySky = wx.clouds >= 4 || wx.haze;
  const isDay = timeName === 'morning' || timeName === 'afternoon';

  if (timeName === 'night' && !heavySky) {
    const stars = wx.clouds ? 22 : 42;
    for (let i = 0; i < stars; i++) {
      const x = GX + r() * GW, y = GY + r() * GH * 0.6, s = 0.6 + r() * 1.2;
      out.push(`<circle class="twinkle" style="animation-delay:-${(r() * 4).toFixed(2)}s;animation-duration:${(2.5 + r() * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}" fill="${C.cream}"/>`);
    }
  }
  if (timeName === 'night' && wx.clouds < 4) {
    out.push(`<circle cx="352" cy="118" r="46" fill="${C.cream}" opacity="0.08"/><circle cx="352" cy="118" r="24" fill="#f7efd9"/>
<circle cx="343" cy="112" r="4.5" fill="#e6dcc2"/><circle cx="359" cy="126" r="3" fill="#e6dcc2"/><circle cx="360" cy="108" r="2" fill="#e6dcc2"/>`);
  }
  if (timeName === 'dusk' && wx.clouds < 4) {
    out.push(`<circle cx="190" cy="196" r="62" fill="#f6c177" opacity="0.22"/><circle cx="190" cy="196" r="38" fill="#f7b267"/>`);
  }
  if (isDay && wx.clouds < 4) {
    const sx = timeName === 'morning' ? 150 : 330, sy = timeName === 'morning' ? 150 : 110;
    out.push(`<circle cx="${sx}" cy="${sy}" r="44" fill="#fff6dc" opacity="${wx.haze ? 0.15 : 0.35}"/><circle cx="${sx}" cy="${sy}" r="26" fill="#fff3cf" opacity="${wx.haze ? 0.55 : 1}"/>`);
  }

  // grey wash for cloudy / rainy weather
  if (wx.grey) out.push(`<rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" fill="${isDay ? '#7d8398' : '#15131f'}" opacity="${wx.grey}"/>`);

  if (wx.lightning) {
    out.push(`<rect class="flash" x="${GX}" y="${GY}" width="${GW}" height="${GH}" fill="#eef0ff"/>
<path class="flash" d="M292 70 L270 128 L286 128 L262 190 L304 116 L286 116 L306 70Z" fill="#fff8d6"/>`);
  }

  // clouds
  const spots = [[120, 104, 1, 70], [300, 150, 0.8, 95], [220, 88, 0.65, 120], [60, 150, 0.9, 85], [360, 92, 1.1, 110]];
  const fill = wx.grey ? t.cloud[1] : t.cloud[0];
  for (const [cx, cy, sc, dur] of spots.slice(0, wx.clouds)) {
    out.push(`<g class="drift" style="animation-duration:${dur}s;animation-delay:-${(r() * dur).toFixed(1)}s" opacity="0.8">
  <g transform="translate(${cx} ${cy}) scale(${sc})" fill="${fill}"><ellipse cx="0" cy="0" rx="44" ry="15"/><ellipse cx="-18" cy="-9" rx="20" ry="15"/><ellipse cx="14" cy="-13" rx="24" ry="18"/></g></g>`);
  }

  // city silhouette with lit windows
  let x = GX - 4;
  while (x < GX + GW) {
    const bw = 22 + r() * 34, bh = 40 + r() * 80, by = GY + GH - bh;
    out.push(`<rect x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${t.city}"/>`);
    if (t.lights > 0) {
      for (let wy = by + 8; wy < GY + GH - 8; wy += 12)
        for (let wxp = x + 5; wxp < x + bw - 6; wxp += 9)
          if (r() < 0.32)
            out.push(`<rect class="${r() < 0.25 ? 'flick' : ''}" style="animation-delay:-${(r() * 9).toFixed(1)}s" x="${wxp.toFixed(1)}" y="${wy.toFixed(1)}" width="4" height="5" rx="0.5" fill="${C.amber}" opacity="${(t.lights * (0.5 + r() * 0.5)).toFixed(2)}"/>`);
    }
    x += bw + 2;
  }

  // fog / smog drifting in front of the city
  if (wx.haze) {
    out.push(`<rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" fill="${wx.haze}" opacity="${wx.name === 'smog' ? 0.42 : 0.38}"/>`);
    for (let i = 0; i < 5; i++) {
      out.push(`<ellipse class="haze" style="animation-duration:${(9 + i * 3)}s;animation-delay:-${i * 2}s" cx="${GX + 40 + i * 75}" cy="${GY + GH - 30 - i * 28}" rx="120" ry="22" fill="${wx.haze}" opacity="0.45"/>`);
    }
  }

  for (let i = 0; i < wx.rain; i++) {
    const rx = GX + r() * (GW + 40), len = 10 + r() * 12;
    out.push(`<line class="drop" style="animation-duration:${(0.55 + r() * 0.5).toFixed(2)}s;animation-delay:-${(r() * 2).toFixed(2)}s" x1="${rx.toFixed(1)}" y1="${GY - 30}" x2="${(rx - 4).toFixed(1)}" y2="${(GY - 30 + len).toFixed(1)}" stroke="${t.rainColor}" stroke-width="1.3" stroke-linecap="round" opacity="${(0.35 + r() * 0.45).toFixed(2)}"/>`);
  }
  for (let i = 0; i < (wx.snow ?? 0); i++) {
    out.push(`<circle class="flake" style="animation-duration:${(4 + r() * 5).toFixed(2)}s;animation-delay:-${(r() * 8).toFixed(2)}s" cx="${(GX + r() * GW).toFixed(1)}" cy="${GY - 20}" r="${(1.2 + r() * 1.8).toFixed(1)}" fill="#ffffff" opacity="${(0.6 + r() * 0.4).toFixed(2)}"/>`);
  }
  // condensation: droplets slide down the glass whenever it's wet or humid
  if (wx.rain || wx.name === 'fog') {
    for (let i = 0; i < 7; i++) {
      out.push(`<circle class="slide" style="animation-duration:${(7 + r() * 8).toFixed(1)}s;animation-delay:-${(r() * 12).toFixed(1)}s" cx="${(GX + 12 + r() * (GW - 24)).toFixed(1)}" cy="${GY + 10}" r="${(1.8 + r() * 1.6).toFixed(1)}" fill="#ffffff" opacity="0.35"/>`);
    }
  }
  return out.join('\n');
}

function windowBlock(t, wx, timeName) {
  return `<rect x="${GX - 16}" y="${GY - 16}" width="${GW + 32}" height="${GH + 32}" rx="10" fill="${C.woodDark}"/>
<rect x="${GX - 10}" y="${GY - 10}" width="${GW + 20}" height="${GH + 20}" rx="7" fill="${C.wood}"/>
<g clip-path="url(#glass)">
${sky(t, wx, timeName, rng(20251201))}
<rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" fill="#ffffff" opacity="0.04"/>
</g>
<rect x="${GX + GW / 2 - 4}" y="${GY}" width="8" height="${GH}" fill="${C.wood}"/>
<rect x="${GX}" y="${GY + GH / 2 - 4}" width="${GW}" height="8" fill="${C.wood}"/>
<rect x="${GX - 30}" y="${GY + GH + 10}" width="${GW + 60}" height="14" rx="4" fill="${C.woodDark}"/>
<g transform="translate(392 ${GY + GH + 10})">
  <g class="sway"><path d="M0 -8 C -18 -30 -26 -44 -14 -58 C -6 -44 -2 -30 0 -8Z" fill="${C.sage}"/><path d="M0 -8 C 16 -26 30 -34 32 -52 C 16 -46 6 -30 0 -8Z" fill="#7fb898"/><path d="M0 -8 C -2 -34 6 -52 4 -70 C -8 -54 -8 -30 0 -8Z" fill="#8cc4a4"/></g>
  <path d="M-16 -10 H16 L12 12 H-12Z" fill="#c27a5c"/><rect x="-18" y="-13" width="36" height="6" rx="2" fill="#d38b6b"/>
</g>`;
}

/** sunbeam through the window on bright days (lamp off, sky not heavy) */
function sunbeam(t, wx, toX = 900, toY = 420) {
  if (t.lamp || wx.clouds >= 4 || wx.haze) return '';
  return `<polygon points="${GX + GW},${GY + 20} ${GX + GW},${GY + GH} ${toX},${toY} ${toX - 340},${toY}" fill="url(#beam)"/>
${Array.from({ length: 12 }, (_, i) => `<circle class="dust" style="animation-delay:-${(i * 0.8).toFixed(1)}s" cx="${220 + ((i * 53) % 400)}" cy="${170 + ((i * 37) % 200)}" r="1.4" fill="#fff3cf"/>`).join('')}`;
}

function desk(w, h, top = 330) {
  return `<rect x="0" y="${top}" width="${w}" height="${h - top}" fill="url(#desk)"/>
<rect x="0" y="${top}" width="${w}" height="3" fill="#8f6c56"/>
${[22, 42, 65].map((d, i) => `<path d="M0 ${top + d} Q ${w / 4} ${top + d + (i % 2 ? 6 : -5)} ${w / 2} ${top + d} T ${w} ${top + d}" stroke="#000" stroke-opacity="0.08" fill="none"/>`).join('')}`;
}

function deskItems() {
  const books = [{ h: 16, w: 118, c: C.rose }, { h: 14, w: 104, c: C.sage }, { h: 18, w: 112, c: C.lilac }, { h: 13, w: 96, c: C.amber }];
  let by = 332;
  const bookSvg = books.map((b, i) => {
    by -= b.h;
    const x = 108 + (i % 2 ? 8 : 0);
    return `<rect x="${x}" y="${by}" width="${b.w}" height="${b.h}" rx="2.5" fill="${b.c}"/><rect x="${x + 6}" y="${by + 3}" width="${b.w - 12}" height="${b.h - 6}" rx="1" fill="#000" opacity="0.12"/>`;
  }).join('\n');
  const steam = (x, y, d) => `<path class="steam" style="animation-delay:${d}s" d="M${x} ${y} q -8 -12 0 -24 q 8 -12 0 -24" stroke="${C.cream}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `${bookSvg}
<text x="130" y="313" font-size="9" fill="#2a2540" opacity="0.7">manga backlog</text>
<g transform="translate(470 0)">
  ${steam(18, 262, 0)}${steam(32, 266, -1.2)}${steam(46, 262, -2.4)}
  <path d="M60 286 h8 a14 14 0 0 1 0 28 h-8" stroke="${C.rose}" stroke-width="7" fill="none"/>
  <rect x="2" y="272" width="62" height="60" rx="10" fill="${C.rose}"/>
  <ellipse cx="33" cy="274" rx="29" ry="6" fill="#6b3f2f"/>
  <path d="M26 298 c -6 -8 6 -12 7 -4 c 1 -8 13 -4 7 4 l -7 7z" fill="${C.cream}" opacity="0.9"/>
</g>
<g transform="translate(360 332)">
  <path class="tail" d="M40 -6 C 70 -6 74 -34 54 -40" stroke="#e0a27a" stroke-width="11" fill="none" stroke-linecap="round"/>
  <g class="breathe">
    <ellipse cx="10" cy="-20" rx="48" ry="22" fill="#e0a27a"/>
    <path d="M-14 -34 q 10 -6 20 0" stroke="#c98a63" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M8 -38 q 10 -6 20 0" stroke="#c98a63" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
  <g transform="translate(-34 -20)">
    <path d="M-18 -12 L-14 -34 L-2 -20Z M8 -20 L18 -34 L22 -12Z" fill="#e0a27a"/>
    <path d="M-14 -16 L-12 -27 L-6 -19Z" fill="${C.rose}"/>
    <circle cx="0" cy="-4" r="22" fill="#e0a27a"/>
    <path d="M-11 -4 q 5 5 10 0 M5 -4 q 5 5 10 0" stroke="#4e3a30" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M1 4 l3 3 l3 -3" stroke="#4e3a30" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="-12" cy="6" rx="4" ry="2.5" fill="${C.rose}" opacity="0.6"/><ellipse cx="17" cy="6" rx="4" ry="2.5" fill="${C.rose}" opacity="0.6"/>
  </g>
  <text class="z" style="animation-delay:0s" x="-40" y="-60" font-size="16" fill="${C.cream}">z</text>
  <text class="z" style="animation-delay:-1.5s" x="-30" y="-66" font-size="20" fill="${C.cream}">z</text>
  <text class="z" style="animation-delay:-3s" x="-22" y="-72" font-size="13" fill="${C.cream}">z</text>
</g>`;
}

/** Typewriter lines. JetBrains Mono is embedded, so every glyph is exactly 0.6em wide. */
function typing(lines, { x0, y0, lh, fs, id }) {
  const cw = fs * 0.6, gap = Math.round(fs * 1.15), charDur = 0.07, pause = 0.9, hold = 3.2;
  let t = 0.6;
  const starts = lines.map((l) => { const s = t; t += l.length * charDur + pause; return s; });
  const T = t + hold;
  const k = (s) => Math.min(1, s / T).toFixed(4);
  const up = Math.round(fs * 0.93);

  const out = [];
  const cur = { times: ['0'], x: [String(x0 + gap)], y: [String(y0 - up)] };
  lines.forEach((line, i) => {
    const n = line.length, s = starts[i], y = y0 + i * lh;
    const kt = ['0'], vals = ['0'];
    for (let c = 0; c <= n; c++) {
      kt.push(k(s + c * charDur)); vals.push((c * cw).toFixed(1));
      cur.times.push(k(s + c * charDur)); cur.x.push((x0 + gap + c * cw).toFixed(1)); cur.y.push(String(y - up));
    }
    out.push(`<clipPath id="${id}${i}"><rect x="${x0 + gap}" y="${y - fs * 1.15}" height="${fs * 1.6}" width="0">
  <animate attributeName="width" dur="${T.toFixed(2)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${kt.join(';')}" values="${vals.join(';')}"/>
</rect></clipPath>
<text x="${x0}" y="${y}" font-size="${fs}" fill="${C.sage}">›</text>
<text clip-path="url(#${id}${i})" x="${x0 + gap}" y="${y}" font-size="${fs}" fill="${i === 0 ? C.amber : C.cream}" textLength="${(n * cw).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(line)}</text>`);
  });
  out.push(`<rect class="blink" width="${(fs * 0.57).toFixed(1)}" height="${(fs * 1.14).toFixed(1)}" rx="1" fill="${C.amber}">
  <animate attributeName="x" dur="${T.toFixed(2)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${cur.times.join(';')}" values="${cur.x.join(';')}"/>
  <animate attributeName="y" dur="${T.toFixed(2)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${cur.times.join(';')}" values="${cur.y.join(';')}"/>
</rect>`);
  return out.join('\n');
}

const eq = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 1, 2, 3, 4].map((i) => `<rect class="eq" style="animation-delay:-${(i * 0.23).toFixed(2)}s" x="${i * 6}" y="-12" width="3.5" height="12" rx="1.5" fill="${C.lilac}"/>`).join('')}</g>`;

// ------------------------------------------------------------------ layouts

export function renderHeader({ config, timeName, weather: wx, clock }) {
  const W = 1200, H = 420;
  const t = TIMES[timeName];
  const body = `${defs(t, W, H)}
<g clip-path="url(#card)">
${wall(W, H)}
${fairyLights(W)}
${windowBlock(t, wx, timeName)}
${sunbeam(t, wx)}

<g transform="translate(490 44)">
  <rect x="0" y="0" width="296" height="86" rx="8" fill="${C.woodDark}"/>
  <rect x="6" y="6" width="284" height="74" rx="5" fill="#26302b"/>
  <text x="18" y="29" font-size="18" fill="${C.cream}" style="font-family:${HAND}" opacity="0.92">now · ${esc(clock)}</text>
  <text x="18" y="50" font-size="18" fill="${C.amber}" style="font-family:${HAND}">outside · ${esc(wx.short)}</text>
  <text x="18" y="71" font-size="18" fill="${C.sage}" style="font-family:${HAND}">status · brewing code</text>
  <rect x="240" y="76" width="24" height="5" rx="2" fill="#e8e2d0" opacity="0.7"/>
</g>

<g transform="translate(975 56)">
  <rect x="0" y="54" width="200" height="10" rx="3" fill="${C.wood}"/>
  <path d="M22 64 v18 h10 M168 64 v18 h10" stroke="${C.woodDark}" stroke-width="5" fill="none"/>
  ${[[10, 42, C.rose], [26, 50, C.lilac], [42, 38, C.sage], [58, 46, C.amber], [74, 44, C.rain], [90, 36, C.peach]].map(([x, h, c]) => `<rect x="${x}" y="${54 - h}" width="14" height="${h}" rx="2" fill="${c}"/><rect x="${x + 3}" y="${54 - h + 6}" width="8" height="3" fill="#000" opacity="0.18"/>`).join('')}
  <rect x="108" y="18" width="12" height="36" rx="2" fill="${C.rose}" transform="rotate(14 114 54)"/>
  <g transform="translate(168 54)"><path d="M-12 0 H12 L9 -14 H-9Z" fill="#c27a5c"/><rect x="-5" y="-40" width="10" height="28" rx="5" fill="${C.sage}"/><rect x="-15" y="-32" width="8" height="12" rx="4" fill="${C.sage}"/><rect x="7" y="-30" width="8" height="10" rx="4" fill="${C.sage}"/><circle cx="0" cy="-42" r="3" fill="${C.rose}"/></g>
</g>

${t.lamp ? `<ellipse class="glow" cx="930" cy="290" rx="380" ry="230" fill="url(#lamp)"/>` : ''}
${desk(W, H)}
${deskItems()}

<rect x="566" y="140" width="388" height="188" rx="12" fill="#17151f"/>
<rect x="578" y="152" width="364" height="164" rx="6" fill="#1b1829"/>
<rect x="578" y="152" width="364" height="164" rx="6" fill="url(#screen)"/>
<circle cx="594" cy="166" r="4" fill="${C.rose}"/><circle cx="607" cy="166" r="4" fill="${C.amber}"/><circle cx="620" cy="166" r="4" fill="${C.sage}"/>
<text x="760" y="170" font-size="11" fill="${C.muted}" text-anchor="middle">~/abudora — zsh</text>
${typing(config.typing, { x0: 596, y0: 198, lh: 24, fs: 14, id: 'ln' })}
${eq(596, 304)}
<text x="636" y="302" font-size="11" fill="${C.muted}">lofi beats to code/relax to</text>
<path d="M540 326 H980 L1000 340 H520Z" fill="#2b2838"/>
<rect x="720" y="330" width="80" height="4" rx="2" fill="#17151f"/>

<g>
  <ellipse cx="1040" cy="332" rx="40" ry="8" fill="#2b2838"/>
  <rect x="1018" y="318" width="44" height="12" rx="5" fill="#3a3550"/>
  <path d="M1040 320 L1078 240 L1012 190" stroke="#3a3550" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="1078" cy="240" r="7" fill="#4a4266"/><circle cx="1040" cy="320" r="6" fill="#4a4266"/>
  <g transform="translate(1004 184) rotate(38)">
    ${t.lamp ? `<polygon points="-26,4 26,4 100,150 -100,150" fill="url(#cone)"/>` : ''}
    <path d="M-30 4 L30 4 L16 -30 Q0 -40 -16 -30Z" fill="${C.amber}"/>
    <path d="M-30 4 L30 4" stroke="#d9a35c" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="-36" r="6" fill="#4a4266"/>
    ${t.lamp ? `<ellipse class="glow" cx="0" cy="6" rx="15" ry="6" fill="#fff6dc"/>` : `<ellipse cx="0" cy="6" rx="13" ry="5" fill="#8f8aa6"/>`}
  </g>
</g>

<g transform="translate(1090 290)">
  <line x1="60" y1="2" x2="84" y2="-34" stroke="#4a4266" stroke-width="3" stroke-linecap="round"/>
  <rect x="0" y="0" width="84" height="42" rx="9" fill="${C.lilac}"/>
  <rect x="6" y="6" width="72" height="30" rx="6" fill="#a98bd0"/>
  <circle cx="24" cy="21" r="11" fill="#3a3354"/>
  ${[[-5, -4], [0, -4], [5, -4], [-5, 1], [0, 1], [5, 1], [-5, 6], [0, 6], [5, 6]].map(([dx, dy]) => `<circle cx="${24 + dx}" cy="${19 + dy}" r="1.2" fill="${C.lilac}"/>`).join('')}
  <rect x="44" y="12" width="26" height="6" rx="3" fill="${C.cream}"/><rect x="54" y="11" width="3" height="8" fill="${C.rose}"/>
  <circle cx="50" cy="28" r="3.5" fill="${C.amber}"/><circle cx="62" cy="28" r="3.5" fill="${C.sage}"/>
  <text class="note" style="animation-delay:0s" x="20" y="-8" font-size="18" fill="${C.amber}">♪</text>
  <text class="note" style="animation-delay:-1.7s" x="44" y="-10" font-size="15" fill="${C.rose}">♫</text>
  <text class="note" style="animation-delay:-3.4s" x="6" y="-6" font-size="14" fill="${C.sage}">♪</text>
</g>
${wx.lightning ? `<rect class="roomflash" width="${W}" height="${H}" fill="#eef0ff"/>` : ''}
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="${C.line}" stroke-width="2"/>
`;
  return svg(W, H, body, { title: `a cozy desk scene, ${timeName} in lahore with ${wx.label}: hi, i'm ${config.name} (${config.alias}), ${config.role}`, style: STYLE });
}

/** Portrait layout for narrow screens: the window up top, a big readable screen below. */
export function renderHeaderMobile({ config, timeName, weather: wx, clock }) {
  const W = 720, H = 800, SHIFT = 118;
  const t = TIMES[timeName];
  const status = `${wx.short} · ${clock}`;
  const body = `${defs(t, W, H)}
<g clip-path="url(#card)">
${wall(W, H)}
${fairyLights(W)}
<g transform="translate(${SHIFT} 0)">
${windowBlock(t, wx, timeName)}
${sunbeam(t, wx, 560, 400)}
</g>
${t.lamp ? `<ellipse class="glow" cx="${W / 2}" cy="330" rx="420" ry="240" fill="url(#lamp)" opacity="0.8"/>` : ''}
${desk(W, H)}
<g transform="translate(${SHIFT} 0)">${deskItems()}</g>

<rect x="36" y="392" width="${W - 72}" height="366" rx="18" fill="#17151f"/>
<rect x="52" y="408" width="${W - 104}" height="334" rx="10" fill="#1b1829"/>
<rect x="52" y="408" width="${W - 104}" height="334" rx="10" fill="url(#screen)"/>
<circle cx="80" cy="436" r="7" fill="${C.rose}"/><circle cx="102" cy="436" r="7" fill="${C.amber}"/><circle cx="124" cy="436" r="7" fill="${C.sage}"/>
<text x="${W / 2 + 40}" y="442" font-size="17" fill="${C.muted}" text-anchor="middle">~/abudora — zsh</text>
${typing(config.typing, { x0: 78, y0: 504, lh: 46, fs: 25, id: 'mln' })}
<line x1="78" y1="676" x2="${W - 78}" y2="676" stroke="${C.line}" stroke-dasharray="3 6"/>
<text x="78" y="718" font-size="28" fill="${C.amber}" style="font-family:${HAND}">outside · ${esc(status)}</text>
${eq(W - 130, 714, 1.6)}
${wx.lightning ? `<rect class="roomflash" width="${W}" height="${H}" fill="#eef0ff"/>` : ''}
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="${C.line}" stroke-width="2"/>
`;
  return svg(W, H, body, { title: `a cozy desk scene, ${timeName} in lahore with ${wx.label}: hi, i'm ${config.name} (${config.alias}), ${config.role}`, style: STYLE });
}
