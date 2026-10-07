// API layer: all network code lives here. Uses Open-Meteo (free, no API key).
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (status ${res.status}). Try again.`);
  return res.json();
}

// City name -> coordinates
export async function searchCity(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  if (!data.results?.length) throw new Error(`No city found for "${name}". Check the spelling.`);
  const { name: city, country, latitude, longitude } = data.results[0];
  return { city, country, latitude, longitude };
}

// Coordinates -> current weather + 5-day forecast
export async function getWeather({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude, longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: 5,
  });
  return fetchJson(`${WEATHER_URL}?${params}`);
}
