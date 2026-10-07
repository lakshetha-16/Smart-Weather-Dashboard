# Smart Weather & Travel Dashboard

Search any city to see live weather, a 5-day forecast, and travel suggestions that change with the conditions.

**Live demo:** _add your GitHub Pages link here_

## Features
- City search (Open-Meteo Geocoding API)
- Current weather and 5-day forecast (Open-Meteo Forecast API, no API key)
- Dynamic weather icons and a background theme that changes with conditions
- Travel planner: 0-100 travel score, verdict, best time/day, things to do, packing list and safety tip (rule-based on temperature, rain, snow, storm, wind, humidity)
- Polished glassmorphism UI with animated gradient backgrounds per weather condition
- Today's high/low, rain chance, sunrise/sunset and local time
- Forecast cards with temperature-range bars and loading skeleton
- Responsive layout, recent searches, error handling, reduced-motion support

## Run locally
ES modules need a server (opening index.html directly will not work).
- VS Code: install **Live Server**, right-click `index.html` > Open with Live Server
- Or: `python -m http.server 8000` then open http://localhost:8000

## Project structure
```
index.html          page structure
css/style.css       layout, themes, responsive rules
js/api.js           fetch calls (async/await)
js/icons.js         weather code -> icon/label/theme
js/suggestions.js   travel recommendation rules
js/app.js           event handling and rendering
docs/               report outline
```

## Deploy (GitHub Pages)
Repo > Settings > Pages > Deploy from branch > `main` / root.

## Tech
ES6+ modules, Fetch API, async/await, CSS Grid/Flexbox, localStorage, Git/GitHub.
