// What's on the nightstand: currently-reading manga from AniList (public API, no key).

const QUERY = `query($u:String){
  User(name:$u){ name siteUrl statistics{ manga{ count chaptersRead } } }
  MediaListCollection(userName:$u, type:MANGA, status_in:[CURRENT,REPEATING], sort:UPDATED_TIME_DESC){
    lists{ entries{ progress updatedAt media{ title{ english romaji } chapters coverImage{ medium color } siteUrl } } }
  }
}`;

async function cover(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return `data:${res.headers.get('content-type') ?? 'image/jpeg'};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function fetchAniList({ username, count }) {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { u: username } }),
    });
    const { data } = await res.json();
    const entries = data.MediaListCollection.lists
      .flatMap((l) => l.entries)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, count);
    const reading = [];
    for (const e of entries) {
      reading.push({
        title: e.media.title.english ?? e.media.title.romaji,
        progress: e.progress,
        chapters: e.media.chapters,
        color: e.media.coverImage.color,
        url: e.media.siteUrl,
        updatedAt: e.updatedAt,
        cover: await cover(e.media.coverImage.medium),
      });
    }
    return {
      profile: data.User.siteUrl,
      total: data.User.statistics.manga.count,
      chaptersRead: data.User.statistics.manga.chaptersRead,
      reading,
    };
  } catch (err) {
    console.warn(`📚 anilist fetch failed (${err.message})`);
    return null;
  }
}
