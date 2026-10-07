// Maps WMO weather codes (returned by Open-Meteo) to an emoji icon, label and page theme.
export function getWeatherInfo(code, isDay = 1) {
  if (code === 0) return isDay ? { icon: '☀️', label: 'Clear sky', theme: 'clear-day' }
                               : { icon: '🌙', label: 'Clear night', theme: 'clear-night' };
  if (code <= 2) return { icon: isDay ? '⛅' : '☁️', label: 'Partly cloudy', theme: isDay ? 'clear-day' : 'clear-night' };
  if (code === 3) return { icon: '☁️', label: 'Overcast', theme: 'cloudy' };
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Fog', theme: 'cloudy' };
  if (code >= 51 && code <= 57) return { icon: '🌦️', label: 'Drizzle', theme: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: '🌧️', label: 'Rain', theme: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: '❄️', label: 'Snow', theme: 'snow' };
  if (code >= 95) return { icon: '⛈️', label: 'Thunderstorm', theme: 'storm' };
  return { icon: '🌡️', label: 'Unknown', theme: 'cloudy' };
}
