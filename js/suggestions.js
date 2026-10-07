// Rule-based travel planner. Turns live weather + the 5-day forecast into a
// travel score, a verdict, things to do, a packing list, best time/day and a safety tip.

const isStorm = (c) => c >= 95;
const isWet   = (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82);
const isSnow  = (c) => (c >= 71 && c <= 77) || c === 85 || c === 86;
const isFog   = (c) => c === 45 || c === 48;

// 0-100 "how good is it to be outside" score for a given set of conditions
function outdoorScore({ temp, code, wind = 0, humidity = 50, rainChance = 0 }) {
  let s = 100;
  s -= Math.min(Math.abs(temp - 24) * 2.6, 55);
  if (isStorm(code)) s -= 60;
  else if (isWet(code)) s -= 35;
  else if (isSnow(code)) s -= 30;
  else if (isFog(code)) s -= 12;
  s -= Math.max(0, rainChance - 30) * 0.3;
  if (wind >= 30) s -= 15; else if (wind >= 20) s -= 6;
  if (humidity > 85 && temp > 27) s -= 8;
  return Math.max(5, Math.min(98, Math.round(s)));
}

function verdictFor(score) {
  if (score >= 80) return { label: 'Excellent day to explore', tone: 'great' };
  if (score >= 60) return { label: 'Good for most plans', tone: 'good' };
  if (score >= 40) return { label: 'Fair, plan with care', tone: 'fair' };
  return { label: 'Better to stay in', tone: 'poor' };
}

function scenario({ temp, code }) {
  if (isStorm(code)) return 'storm';
  if (isWet(code)) return 'wet';
  if (isSnow(code)) return 'snow';
  if (temp >= 35) return 'hot';
  if (temp >= 22) return 'warm';
  if (temp >= 10) return 'mild';
  return 'cold';
}

const ACTIVITIES = {
  storm: [
    { icon: '🏛️', tag: 'Indoor', title: 'Museum & gallery hop', text: 'Spend the day among exhibits, heritage displays and art while the storm passes.' },
    { icon: '☕', tag: 'Cosy', title: 'Cafe & bookstore crawl', text: 'Find a warm corner with a local brew and a good book.' },
    { icon: '🎬', tag: 'Indoor', title: 'Cinema or indoor entertainment', text: 'Catch a film, try an escape room or go bowling.' },
  ],
  wet: [
    { icon: '🍜', tag: 'Food', title: 'Street-food and restaurant trail', text: 'Rain is perfect for hot local specialities, so book a food tour or a covered market.' },
    { icon: '🖼️', tag: 'Indoor', title: 'Galleries and heritage buildings', text: 'Pick covered attractions and keep outdoor stops short.' },
    { icon: '🛍️', tag: 'Indoor', title: 'Malls, bazaars and spas', text: 'Shop, unwind or enjoy a spa while the showers last.' },
  ],
  snow: [
    { icon: '⛷️', tag: 'Outdoor', title: 'Skiing, sledding or snow walks', text: 'Fresh snow is ideal for winter sports and photography.' },
    { icon: '☕', tag: 'Cosy', title: 'Hot-chocolate stop', text: 'Warm up in a mountain cafe between outdoor sessions.' },
    { icon: '♨️', tag: 'Relax', title: 'Hot springs or spa', text: 'Soak in warm water while it snows outside.' },
  ],
  hot: [
    { icon: '🌅', tag: 'Outdoor', title: 'Early-morning sightseeing', text: 'Visit monuments and viewpoints before 9 AM when it is still bearable.' },
    { icon: '🏊', tag: 'Water', title: 'Pool, beach dip or water park', text: 'Cool off with water activities; use waterproof sunscreen.' },
    { icon: '🍧', tag: 'Food', title: 'Cool treats and air-conditioned breaks', text: 'Try ice cream, fresh juices and indoor attractions around midday.' },
  ],
  warm: [
    { icon: '🏖️', tag: 'Outdoor', title: 'Beaches, promenades and parks', text: 'Pleasant weather for long walks, picnics and sunset views.' },
    { icon: '🏛️', tag: 'Culture', title: 'Open-air heritage sites', text: 'Temples, forts and old quarters are at their best in this weather.' },
    { icon: '🚲', tag: 'Active', title: 'Cycling or a guided city walk', text: 'Comfortable temperatures for exploring neighbourhoods on foot or bike.' },
  ],
  mild: [
    { icon: '🥾', tag: 'Active', title: 'Trails and nature walks', text: 'Cool and comfortable, good for hikes, gardens and lakeside strolls.' },
    { icon: '🏘️', tag: 'Culture', title: 'Markets and old town', text: 'Wander bazaars and heritage streets with a light jacket.' },
    { icon: '📸', tag: 'Outdoor', title: 'Photography walk', text: 'Soft light makes it great for photos and viewpoints.' },
  ],
  cold: [
    { icon: '🧣', tag: 'Cosy', title: 'Short outdoor stops', text: 'Keep outdoor time brief and layer up well.' },
    { icon: '🍲', tag: 'Food', title: 'Warm local cuisine', text: 'Soups, stews and hot drinks are the highlight of cold days.' },
    { icon: '🏛️', tag: 'Indoor', title: 'Museums and theatres', text: 'Pick heated attractions for the longer part of the day.' },
  ],
};

function bestTimeFor(sc, temp) {
  switch (sc) {
    case 'storm': return 'Stay indoors until it clears';
    case 'wet':   return 'Between showers, check radar';
    case 'snow':  return '10 AM – 3 PM (daylight)';
    case 'hot':   return '6–9 AM or after 5 PM';
    case 'warm':  return temp >= 29 ? '7–10 AM or 4–7 PM' : '9 AM – 6 PM';
    case 'mild':  return '11 AM – 4 PM';
    default:      return '11 AM – 3 PM (warmest)';
  }
}

function packingList({ temp, code, wind, isDay }) {
  const list = [];
  if (isStorm(code) || isWet(code)) list.push(['☂️', 'Umbrella'], ['🧥', 'Raincoat'], ['🥾', 'Waterproof shoes']);
  if (isSnow(code)) list.push(['🧤', 'Gloves'], ['🥾', 'Snow boots'], ['🧦', 'Thermal socks']);
  if (temp < 10) list.push(['🧥', 'Heavy jacket'], ['🧣', 'Scarf & beanie']);
  else if (temp < 18) list.push(['🧥', 'Light jacket']);
  if (temp >= 24 && !isWet(code) && !isStorm(code)) list.push(['💧', 'Water bottle']);
  if (temp >= 26 && isDay && !isWet(code) && !isStorm(code)) list.push(['🧴', 'Sunscreen'], ['🕶️', 'Sunglasses'], ['🧢', 'Cap']);
  if (temp >= 22 && !isWet(code)) list.push(['👟', 'Comfy walking shoes']);
  if (wind >= 30) list.push(['🧢', 'Wind-proof layer']);
  list.push(['🔋', 'Power bank']);
  const seen = new Set();
  return list.filter(([, l]) => !seen.has(l) && seen.add(l)).slice(0, 7).map(([icon, label]) => ({ icon, label }));
}

function safetyTip({ temp, code, wind }) {
  if (isStorm(code)) return { icon: '⚠️', text: 'Thunderstorm alert: avoid open grounds, tall trees and the waterfront. Delay any long drives.' };
  if (temp >= 38) return { icon: '🔥', text: 'Extreme heat: avoid direct sun from 11 AM to 4 PM, drink water often and watch for heat exhaustion.' };
  if (wind >= 40) return { icon: '💨', text: 'Very strong winds: skip boat rides, ferries and exposed viewpoints.' };
  if (isFog(code)) return { icon: '🌫️', text: 'Low visibility: allow extra travel time and drive carefully.' };
  if (isSnow(code) || temp <= 0) return { icon: '🧊', text: 'Icy conditions possible: wear shoes with good grip and check road status before driving.' };
  if (isWet(code)) return { icon: '🌧️', text: 'Wet and slippery surfaces: take care on stairs, ghats and roads.' };
  return { icon: '✅', text: 'No major weather warnings. A great time to enjoy the outdoors.' };
}

// Finds the best day in the forecast for outdoor plans
function bestDayOf(daily) {
  if (!daily?.time?.length) return null;
  let best = null;
  daily.time.forEach((date, i) => {
    const max = daily.temperature_2m_max[i], min = daily.temperature_2m_min[i];
    const score = outdoorScore({
      temp: (max + min) / 2 + 1, code: daily.weather_code[i],
      rainChance: daily.precipitation_probability_max?.[i] ?? 0,
    });
    if (!best || score > best.score) best = { i, date, score, max, rain: daily.precipitation_probability_max?.[i] ?? 0 };
  });
  return best;
}

export function getTravelSuggestions({ city = 'the city', temp, code, wind = 0, humidity = 50, isDay = 1, daily }) {
  const rainChance = daily?.precipitation_probability_max?.[0] ?? 0;
  const score = outdoorScore({ temp, code, wind, humidity, rainChance });
  const v = verdictFor(score);
  const sc = scenario({ temp, code });
  const best = bestDayOf(daily);

  const summaries = {
    storm: `Thunderstorms are active in ${city}. Switch to indoor plans today.`,
    wet:   `Rain is likely in ${city}. Plan indoor highlights and food stops.`,
    snow:  `Snowy conditions in ${city}. Dress warmly and enjoy winter activities.`,
    hot:   `It's very hot in ${city}. Plan around the cooler parts of the day.`,
    warm:  `Comfortable, ${Math.round(temp)}°C weather in ${city} is great for exploring outdoors.`,
    mild:  `Cool and pleasant in ${city}, perfect for walking tours and nature spots.`,
    cold:  `It's cold in ${city}. Mix short outdoor stops with warm indoor attractions.`,
  };

  return {
    score, verdict: v.label, tone: v.tone, summary: summaries[sc],
    bestTime: bestTimeFor(sc, temp),
    bestDay: best,
    activities: ACTIVITIES[sc],
    pack: packingList({ temp, code, wind, isDay }),
    safety: safetyTip({ temp, code, wind }),
  };
}
