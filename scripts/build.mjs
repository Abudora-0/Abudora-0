#!/usr/bin/env node
// Brews the whole profile: fetch GitHub data -> render SVGs -> render README.md
//   node scripts/build.mjs            (uses GITHUB_TOKEN, or `gh auth token` locally)
//   node scripts/build.mjs --offline  (reuses scripts/data/cache.json)
//   node scripts/build.mjs --mood=dusk  (force a header mood, for previews)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import * as icons from 'simple-icons';

import { fetchData, loadCache, saveCache } from './lib/github.mjs';
import { localDate, mood, streaks, languages, ago } from './lib/derive.mjs';
import { renderHeader } from './render/header.mjs';
import { renderStack } from './render/stack.mjs';
import { renderTape } from './render/tapes.mjs';
import { renderStats, renderLanguages, renderStreak, renderQuote, renderButton, renderDivider } from './render/cards.mjs';

const ROOT = join(import.meta.dirname, '..');
const ASSETS = join(ROOT, 'assets');
const CACHE = join(ROOT, 'scripts', 'data', 'cache.json');
const args = new Set(process.argv.slice(2));
const forcedMood = [...args].find((a) => a.startsWith('--mood='))?.split('=')[1];

const config = JSON.parse(await readFile(join(ROOT, 'profile.config.json'), 'utf8'));
const quotes = JSON.parse(await readFile(join(ROOT, 'scripts', 'data', 'quotes.json'), 'utf8'));

let data;
if (args.has('--offline')) {
  data = await loadCache(CACHE);
  console.log(`☁  offline build from cache (${data.fetchedAt})`);
} else {
  data = await fetchData(config.login);
  await saveCache(CACHE, data);
  console.log(`☕ fetched ${data.repos.length} repos, ${data.days.length} calendar days, ${data.events.length} events`);
}

const now = new Date();
const tz = config.timezone;
const today = localDate(tz, now);
const moodName = forcedMood ?? mood(tz, now);
const clock = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(now).toLowerCase() + ' ' + config.timezoneLabel.toLowerCase();

const streak = { ...streaks(data.days, today), since: data.user.createdAt.slice(0, 10) };
const langs = languages(data.repos);
const dayOfYear = Math.floor((Date.parse(today) - Date.parse(today.slice(0, 4) + '-01-01')) / 86400000);
const quote = quotes[dayOfYear % quotes.length];

// ------------------------------------------------------------------ SVGs
const out = new Map();
out.set('header.svg', renderHeader({ config, moodName, clock }));
out.set('stack.svg', renderStack(config));
out.set('stats.svg', renderStats({ totals: data.totals, streak }));
out.set('languages.svg', renderLanguages(langs));
out.set('streak.svg', renderStreak(streak));
out.set('quote.svg', renderQuote({ quote, date: new Date(today + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toLowerCase() }));
out.set('divider.svg', renderDivider());
out.set('footer.svg', renderDivider({ text: 'thanks for stopping by · stay cozy', seed: 11 }));
for (const link of config.links) out.set(`buttons/${link.id}.svg`, renderButton(link, icons));

const repoByName = new Map(data.repos.map((r) => [r.name.toLowerCase(), r]));
config.featured.forEach((feature, index) => {
  out.set(`tapes/${feature.repo.toLowerCase()}.svg`, renderTape({ feature, repo: repoByName.get(feature.repo.toLowerCase()), index }));
});

await mkdir(join(ASSETS, 'buttons'), { recursive: true });
await mkdir(join(ASSETS, 'tapes'), { recursive: true });
for (const [file, content] of out) await writeFile(join(ASSETS, file), content);

// ------------------------------------------------------------------ README pieces
const mdEsc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/[<>]/g, '');
const repoLink = (full) => `[${full.split('/')[1]}](https://github.com/${full})`;

const buttons = config.links
  .map((l) => `<a href="${l.url}"><img src="assets/buttons/${l.id}.svg" height="40" alt="${l.label}"></a>`)
  .join(' ');

const tapes = config.featured
  .map((f) => {
    const repo = repoByName.get(f.repo.toLowerCase());
    const href = repo?.homepage || repo?.url || `https://github.com/${config.login}/${f.repo}`;
    return `<a href="${href}"><img src="assets/tapes/${f.repo.toLowerCase()}.svg" width="49%" alt="${f.repo}: ${f.blurb}"></a>`;
  })
  .join('\n');

const hidden = new Set(config.hideFromMixtape.map((n) => n.toLowerCase()));
const tracks = data.repos.filter((r) => !r.isFork && !hidden.has(r.name.toLowerCase()));
const mixtape = [
  '| # | track | liner notes | flavor | listen |',
  '|:-:|:--|:--|:--|:-:|',
  ...tracks.map((r, i) => {
    const desc = r.description ? (r.description.length > 90 ? r.description.slice(0, 88).trimEnd() + '…' : r.description) : '<i>shh, still writing this one</i>';
    const live = r.homepage ? `[▶ live](${r.homepage})` : '·';
    return `| ${String(i + 1).padStart(2, '0')} | **[${r.name}](${r.url})** | ${desc.startsWith('<i>') ? desc : mdEsc(desc)} | ${r.language ? r.language.name.toLowerCase() : '·'} | ${live} |`;
  }),
].join('\n');

function describe(e) {
  const p = e.payload;
  const repo = repoLink(e.repo);
  switch (e.type) {
    case 'PushEvent': return p.size ? `☕ poured **${p.size}** commit${p.size === 1 ? '' : 's'} into ${repo}` : `☕ pushed to ${repo}`;
    case 'CreateEvent': return p.refType === 'repository' ? `🌱 planted a new repo, ${repo}` : p.refType === 'tag' ? `🏷️ tagged \`${p.ref}\` in ${repo}` : null;
    case 'ReleaseEvent': return `📦 released **${mdEsc(p.tag ?? p.title)}** of ${repo}`;
    case 'PullRequestEvent': return p.action === 'opened' || p.action === 'closed' ? `🔀 ${p.action} PR #${p.number} in ${repo}: ${mdEsc(p.title)}` : null;
    case 'IssuesEvent': return p.action === 'opened' ? `📝 opened issue #${p.number} in ${repo}: ${mdEsc(p.title)}` : null;
    case 'WatchEvent': return `⭐ starred ${repo}`;
    case 'ForkEvent': return `🍴 forked ${repo}`;
    case 'PublicEvent': return `🌤️ opened up ${repo} to the world`;
    default: return null;
  }
}
// collapse consecutive pushes to the same repo so the feed doesn't repeat itself
const activity = [];
for (const e of data.events) {
  const prev = activity.at(-1);
  if (prev && e.type === 'PushEvent' && prev.e.type === 'PushEvent' && prev.e.repo === e.repo) {
    prev.e = { ...prev.e, payload: { ...prev.e.payload, size: (prev.e.payload.size ?? 0) + (e.payload.size ?? 0) } };
    continue;
  }
  if (describe(e)) activity.push({ e });
  if (activity.length >= 6) break;
}
const activityMd = activity.length
  ? activity.map(({ e }) => `- <code>${ago(e.createdAt, now)}</code> ${describe(e)}`).join('\n')
  : '- <code>shh</code> the kettle is quiet right now, check back soon';

const moodLine = {
  morning: '🌤️ it\'s a drizzly morning in lahore, the lamp is off and the kettle is on',
  afternoon: '🌦️ soft afternoon rain in lahore, a good time for deep work',
  dusk: '🌇 dusk is settling over lahore, lamp on, second coffee poured',
  night: '🌙 it\'s a rainy night in lahore, the cat is asleep and the code is flowing',
}[moodName];

const vars = {
  BUTTONS: buttons,
  TAPES: tapes,
  MIXTAPE: mixtape,
  TRACK_COUNT: String(tracks.length),
  ACTIVITY: activityMd,
  MOOD_LINE: moodLine,
  UPDATED: `${clock}, ${new Date(today + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toLowerCase()}`,
  LOGIN: config.login,
};

const template = await readFile(join(ROOT, 'README.template.md'), 'utf8');
const readme = template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
await writeFile(join(ROOT, 'README.md'), readme);

console.log(`🕯️ brewed ${out.size} svgs + README.md · mood: ${moodName} · streak ${streak.current}/${streak.longest} · quote #${dayOfYear % quotes.length}`);
