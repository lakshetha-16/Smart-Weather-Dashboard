// Entry point: connects the form, the API calls and the DOM updates.
import { searchCity, getWeather } from './api.js';
import { getWeatherInfo } from './icons.js';
import { getTravelSuggestions } from './suggestions.js';

const $ = (id) => document.getElementById(id);
const form = $('search-form'), input = $('city-input'), statusEl = $('status'), dash = $('dashboard'), skeleton = $('skeleton');
const RECENT_KEY = 'recentCities';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

function render(place, data) {
  const c = data.current, d = data.daily;
  const info = getWeatherInfo(c.weather_code, c.is_day);
  document.body.dataset.theme = info.theme;

  $('place').textContent = [place.city, place.country].filter(Boolean).join(', ');
  $('date').textContent = new Date(c.time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  $('local-time').textContent = `Local time ${fmtTime(c.time)}`;
  $('current-icon').textContent = info.icon;
  $('temp').textContent = Math.round(c.temperature_2m);
  $('condition').textContent = info.label;
  $('hilo').textContent = `High ${Math.round(d.temperature_2m_max[0])}° · Low ${Math.round(d.temperature_2m_min[0])}°`;
  $('feels').textContent = `${Math.round(c.apparent_temperature)}°C`;
  $('humidity').textContent = `${c.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  $('rain').textContent = `${d.precipitation_probability_max[0] ?? 0}%`;
  $('sunrise').textContent = fmtTime(d.sunrise[0]);
  $('sunset').textContent = fmtTime(d.sunset[0]);

  // Forecast: each card shows a bar positioned within the overall 5-day temperature range
  const lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max);
  const span = Math.max(hi - lo, 1);
  $('forecast-list').innerHTML = d.time.map((date, i) => {
    const f = getWeatherInfo(d.weather_code[i]);
    const dt = new Date(`${date}T00:00`);
    const day = i === 0 ? 'Today' : dt.toLocaleDateString('en-IN', { weekday: 'short' });
    const short = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const max = d.temperature_2m_max[i], min = d.temperature_2m_min[i];
    const left = ((min - lo) / span) * 100, width = Math.max(((max - min) / span) * 100, 8);
    return `<li class="${i === 0 ? 'today' : ''}">
      <div class="day">${day}</div><div class="date">${short}</div>
      <div class="f-icon" title="${f.label}">${f.icon}</div>
      <div class="range">${Math.round(max)}° <span>/ ${Math.round(min)}°</span></div>
      <div class="bar" aria-hidden="true"><i style="left:${left}%;width:${width}%"></i></div>
      <div class="pop">💧 ${d.precipitation_probability_max[i] ?? 0}%</div></li>`;
  }).join('');

  const t = getTravelSuggestions({
    city: place.city, temp: c.temperature_2m, code: c.weather_code, wind: c.wind_speed_10m,
    humidity: c.relative_humidity_2m, isDay: c.is_day, daily: d,
  });
  const ring = $('score-ring');
  ring.style.setProperty('--pct', t.score);
  ring.dataset.tone = t.tone;
  ring.setAttribute('aria-label', `Travel score ${t.score} out of 100`);
  $('score').textContent = t.score;
  $('verdict').textContent = t.verdict;
  $('verdict-text').textContent = t.summary;
  $('best-time').textContent = t.bestTime;
  if (t.bestDay) {
    const bd = new Date(`${t.bestDay.date}T00:00`);
    const name = t.bestDay.i === 0 ? 'Today' : bd.toLocaleDateString('en-IN', { weekday: 'long' });
    $('best-day').textContent = `${name} · ${Math.round(t.bestDay.max)}°, ${t.bestDay.rain}% rain`;
  }
  $('travel-list').innerHTML = t.activities.map(a =>
    `<li><span class="tip-icon" aria-hidden="true">${a.icon}</span>
      <div><div class="tip-top"><strong>${a.title}</strong><span class="tag">${a.tag}</span></div><p>${a.text}</p></div></li>`).join('');
  $('pack-list').innerHTML = t.pack.map(p => `<li><span aria-hidden="true">${p.icon}</span>${p.label}</li>`).join('');
  $('safety').innerHTML = `<span aria-hidden="true">${t.safety.icon}</span><span>${t.safety.text}</span>`;

  // Re-trigger entrance animation on every search
  dash.hidden = false;
  dash.style.animation = 'none'; void dash.offsetWidth; dash.style.animation = '';
}

// Recent searches (kept in the browser with localStorage)
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []; } catch { return []; }
}
function saveRecent(city) {
  const list = [city, ...loadRecent().filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  renderRecent();
}
function renderRecent() {
  $('recent').replaceChildren(...loadRecent().map(city => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = city;
    b.addEventListener('click', () => { input.value = city; loadCity(city); });
    return b;
  }));
}

// Async flow: geocode -> fetch weather -> render. One try/catch handles every failure.
async function loadCity(name) {
  setStatus('Loading weather…');
  skeleton.hidden = false;
  try {
    const place = await searchCity(name);
    const data = await getWeather(place);
    render(place, data);
    saveRecent(place.city);
    setStatus(`Showing weather for ${place.city}.`);
  } catch (err) {
    dash.hidden = true;
    setStatus(err instanceof TypeError ? 'Network error. Check your connection.' : err.message, true);
  } finally {
    skeleton.hidden = true;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = input.value.trim();
  if (name) loadCity(name);
});

renderRecent();
