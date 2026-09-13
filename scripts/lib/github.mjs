import { execSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    throw new Error('No GITHUB_TOKEN found (and `gh auth token` failed). Use --offline to build from cache.');
  }
}

async function gql(query, variables, tk) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${tk}`, 'Content-Type': 'application/json', 'User-Agent': 'cozy-profile' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function rest(path, tk) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `bearer ${tk}`, Accept: 'application/vnd.github+json', 'User-Agent': 'cozy-profile' },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

const PROFILE = `query($login:String!){
  user(login:$login){
    name createdAt followers{totalCount}
    contributionsCollection{
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions contributionYears
    }
    repositories(ownerAffiliations:OWNER, privacy:PUBLIC, first:100, orderBy:{field:PUSHED_AT, direction:DESC}){
      totalCount
      nodes{
        name description homepageUrl url isFork isArchived stargazerCount forkCount pushedAt
        primaryLanguage{name color}
        languages(first:12, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } }
      }
    }
  }
}`;

const CALENDAR = `query($login:String!,$from:DateTime!,$to:DateTime!){
  user(login:$login){
    contributionsCollection(from:$from,to:$to){
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

export async function fetchData(login) {
  const tk = token();
  const { user } = await gql(PROFILE, { login }, tk);

  // Calendar per year since the account was created, so streaks are all-time.
  const days = [];
  for (const year of [...user.contributionsCollection.contributionYears].sort()) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;
    const d = await gql(CALENDAR, { login, from, to }, tk);
    for (const w of d.user.contributionsCollection.contributionCalendar.weeks)
      for (const day of w.contributionDays) days.push({ date: day.date, count: day.contributionCount });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));

  const events = await rest(`/users/${login}/events/public?per_page=60`, tk).catch(() => []);

  const repos = user.repositories.nodes;
  return {
    fetchedAt: new Date().toISOString(),
    user: { login, name: user.name, createdAt: user.createdAt, followers: user.followers.totalCount },
    totals: {
      commits: user.contributionsCollection.totalCommitContributions,
      prs: user.contributionsCollection.totalPullRequestContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      repos: user.repositories.totalCount,
      stars: repos.reduce((s, r) => s + r.stargazerCount, 0),
    },
    days,
    repos: repos.map((r) => ({
      name: r.name,
      description: r.description,
      homepage: r.homepageUrl,
      url: r.url,
      isFork: r.isFork,
      isArchived: r.isArchived,
      stars: r.stargazerCount,
      pushedAt: r.pushedAt,
      language: r.primaryLanguage,
      languages: r.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size })),
    })),
    events: events.map((e) => ({
      type: e.type,
      repo: e.repo.name,
      createdAt: e.created_at,
      payload: {
        size: e.payload.size ?? e.payload.commits?.length,
        ref: e.payload.ref,
        refType: e.payload.ref_type,
        action: e.payload.action,
        title: e.payload.pull_request?.title ?? e.payload.issue?.title ?? e.payload.release?.name,
        number: e.payload.pull_request?.number ?? e.payload.issue?.number,
        tag: e.payload.release?.tag_name,
      },
    })),
  };
}

export async function loadCache(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function saveCache(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}
