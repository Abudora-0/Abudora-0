// Embeds tiny per-SVG subsets of JetBrains Mono + Caveat (both OFL) so every
// visitor sees the same type, whatever fonts their OS happens to have.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);

const FACES = [
  { family: 'JetBrains Mono', weight: 400, file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2' },
  { family: 'JetBrains Mono', weight: 700, file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2' },
  { family: 'JetBrains Mono', weight: 800, file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2' },
  { family: 'Caveat', weight: 400, file: '@fontsource/caveat/files/caveat-latin-400-normal.woff2' },
];

const buffers = new Map();
const load = async (file) => {
  if (!buffers.has(file)) buffers.set(file, await readFile(require.resolve(file)));
  return buffers.get(file);
};

const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);

/** Collect text per face: Caveat text is marked with font-family:'Caveat' in its style attribute. */
function textByFace(svgSource) {
  const out = { mono400: '', mono700: '', mono800: '', hand: '' };
  for (const m of svgSource.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)) {
    const attrs = m[1], text = decode(m[2]);
    if (attrs.includes("'Caveat'")) out.hand += text;
    else if (/font-weight="800"/.test(attrs)) out.mono800 += text;
    else if (/font-weight="700"/.test(attrs)) out.mono700 += text;
    else out.mono400 += text;
  }
  return out;
}

export async function embedFonts(svgSource) {
  const text = textByFace(svgSource);
  const wanted = [
    [FACES[0], text.mono400], [FACES[1], text.mono700], [FACES[2], text.mono800], [FACES[3], text.hand],
  ].filter(([, chars]) => chars.trim().length);

  const rules = [];
  for (const [face, chars] of wanted) {
    const unique = [...new Set(chars)].join('');
    const sub = await subsetFont(await load(face.file), unique, { targetFormat: 'woff2' });
    rules.push(`@font-face { font-family: '${face.family}'; font-weight: ${face.weight}; font-style: normal; src: url(data:font/woff2;base64,${sub.toString('base64')}) format('woff2'); }`);
  }
  if (!rules.length) return svgSource;
  return svgSource.replace('<style>', `<style>\n  ${rules.join('\n  ')}`);
}
