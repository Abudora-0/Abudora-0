// Pure calculations over the fetched data.

export function localDate(tz, d = new Date()) {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function localHour(tz, d = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(d));
}

/** morning 05–11, afternoon 11–17, dusk 17–20, night otherwise */
export function mood(tz, d = new Date()) {
  const h = localHour(tz, d);
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export function streaks(days, today) {
  const past = days.filter((d) => d.date <= today);
  let longest = 0, run = 0, longestEnd = null;
  for (const d of past) {
    run = d.count > 0 ? run + 1 : 0;
    if (run > longest) { longest = run; longestEnd = d.date; }
  }
  // Current streak: today doesn't break it if you haven't committed *yet*.
  let current = 0;
  let i = past.length - 1;
  if (i >= 0 && past[i].count === 0) i--;
  while (i >= 0 && past[i].count > 0) { current++; i--; }
  const total = past.reduce((s, d) => s + d.count, 0);
  const lastYear = past.slice(-365);
  const yearTotal = lastYear.reduce((s, d) => s + d.count, 0);
  const activeDays = lastYear.filter((d) => d.count > 0).length;
  const best = past.reduce((b, d) => (d.count > b.count ? d : b), { count: 0, date: null });
  return { current, longest, longestEnd, total, yearTotal, activeDays, best, since: past[0]?.date };
}

export function languages(repos, top = 7) {
  const acc = new Map();
  for (const r of repos) {
    if (r.isFork) continue;
    for (const l of r.languages) {
      const cur = acc.get(l.name) ?? { name: l.name, color: l.color ?? '#a59fbf', size: 0 };
      cur.size += l.size;
      acc.set(l.name, cur);
    }
  }
  const all = [...acc.values()].sort((a, b) => b.size - a.size);
  const sum = all.reduce((s, l) => s + l.size, 0) || 1;
  const head = all.slice(0, top).map((l) => ({ ...l, pct: (l.size / sum) * 100 }));
  const rest = all.slice(top).reduce((s, l) => s + l.size, 0);
  if (rest / sum >= 0.001) head.push({ name: 'other', color: '#6e6690', size: rest, pct: (rest / sum) * 100 });
  return head;
}

export function ago(iso, now = new Date()) {
  const s = Math.max(0, (now - new Date(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
}
