import { useEffect, useState } from "react";

export interface WeatherData { temp: number; label: string }

export function wmoLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Fog";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Showers";
  if (code <= 94) return "Thunder";
  return "Stormy";
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const { current_weather: c } = await res.json();
    return { temp: Math.round(c.temperature), label: wmoLabel(c.weathercode) };
  } catch {
    return null;
  }
}

/** Current weather for the browser's location (falls back to a central-India default if denied). */
export function useWeather(): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    let cancelled = false;
    const done = (w: WeatherData | null) => { if (!cancelled && w) setWeather(w); };
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => done(await fetchWeather(coords.latitude, coords.longitude)),
      async () => done(await fetchWeather(20, 77))
    );
    return () => { cancelled = true; };
  }, []);
  return weather;
}

/** Re-renders every `intervalMs` so clocks stay current. */
export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
