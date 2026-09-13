// Real weather outside the window, from Open-Meteo (free, no key).

const CONDITIONS = {
  clear:    { label: 'clear skies',        emoji: '✨', rain: 0,   clouds: 0, grey: 0 },
  partly:   { label: 'a few lazy clouds',  emoji: '⛅', rain: 0,   clouds: 2, grey: 0 },
  overcast: { label: 'grey skies',         emoji: '☁️', rain: 0,   clouds: 5, grey: 0.35 },
  fog:      { label: 'thick fog',          emoji: '🌫️', rain: 0,   clouds: 0, grey: 0.2, haze: '#dfe3ea' },
  smog:     { label: 'smoggy haze',        emoji: '😶‍🌫️', rain: 0,   clouds: 0, grey: 0.2, haze: '#c9b58c' },
  drizzle:  { label: 'soft drizzle',       emoji: '🌦️', rain: 28,  clouds: 3, grey: 0.2 },
  rain:     { label: 'rain on the window', emoji: '🌧️', rain: 70,  clouds: 4, grey: 0.3 },
  heavy:    { label: 'heavy rain',         emoji: '🌧️', rain: 110, clouds: 5, grey: 0.4 },
  storm:    { label: 'a thunderstorm',     emoji: '⛈️', rain: 110, clouds: 5, grey: 0.45, lightning: true },
  snow:     { label: 'snow, somehow',      emoji: '🌨️', rain: 0,   clouds: 4, grey: 0.3, snow: 60 },
};

export const conditionNames = Object.keys(CONDITIONS);

function fromWmo(code) {
  if (code <= 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 65 || code === 82 || code === 67) return 'heavy';
  if ((code >= 61 && code <= 66) || code === 80 || code === 81) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'partly';
}

export async function fetchWeather({ lat, lon }, tz) {
  const q = `latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(tz)}`;
  try {
    const [w, a] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=weather_code,temperature_2m`).then((r) => r.json()),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi`).then((r) => r.json()).catch(() => null),
    ]);
    return { code: w.current.weather_code, temp: Math.round(w.current.temperature_2m), aqi: a?.current?.us_aqi ?? null, at: w.current.time };
  } catch (err) {
    console.warn(`🌫️  weather fetch failed (${err.message}), using a cozy default`);
    return null;
  }
}

/** Resolve raw weather (or a forced condition name) into scene parameters. */
export function resolveWeather(raw, forced) {
  let name = forced ?? (raw ? fromWmo(raw.code) : 'drizzle');
  // Lahore winters: dry days with a bad AQI read as smog, not "clear"
  if (!forced && raw?.aqi >= 150 && ['clear', 'partly', 'overcast', 'fog'].includes(name)) name = 'smog';
  const c = CONDITIONS[name] ?? CONDITIONS.drizzle;
  const temp = raw?.temp;
  return { name, ...c, temp, aqi: raw?.aqi ?? null, short: `${temp != null ? `${temp}° · ` : ''}${c.label}` };
}
