# Trexis Weather

A small React weather dashboard. Search for any city and see its current
conditions and a 5-day forecast, powered by the
[OpenWeatherMap](https://openweathermap.org/api) API.

## Features

**Core**
- Search for weather by city name
- Current conditions for the selected city:
  - City name and country
  - Current temperature
  - "Feels like" temperature
  - Weather description
  - Humidity
  - Wind speed
  - Weather icon
- Search for another city without reloading the page
- Loading, error, and "no results" states

**Extras**
- 5-day forecast that shows the same detail set as the current day
- Recent searches, persisted in `localStorage` (click a chip to reload)
- Light/dark theme toggle, persisted in `localStorage`
- °C / °F unit toggle (applies to the current day and the forecast)
- Debounced search autocomplete suggestions
- "Use my location" button (browser geolocation)
- Ambiguous city names prompt a disambiguation list (e.g. Springfield, US)
- Stale requests are ignored, so fast repeated searches never show the wrong city

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- [Vitest 5](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html)

## Getting Started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- A free [OpenWeatherMap API key](https://home.openweathermap.org/api_keys)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API key

Create a `.env` file in the project root:

```bash
VITE_OWM_API_KEY=your_openweathermap_api_key
```

Vite only exposes environment variables prefixed with `VITE_`, which is why the
key is named `VITE_OWM_API_KEY`. If the key is missing, the app shows a
`Missing VITE_OWM_API_KEY in .env file` error rather than failing silently.

> New OpenWeatherMap keys can take a few minutes to activate.

### 3. Start the dev server

```bash
npm run dev
```

Then open the URL Vite prints (typically http://localhost:5173).

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-free production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest suite once |
| `npm run lint` | Run oxlint |

## Project Structure

```
src/
  api/
    geocode.js        # city name -> coordinates (OpenWeatherMap geocoding)
    weather.js        # current conditions by coordinates
    forecast.js       # 5-day forecast, grouped into daily summaries
  components/
    SearchBar.jsx     # input, submit, location button, suggestion list
    WeatherCard.jsx   # presentational card for every status/screen
    WeatherIcon.jsx   # <img> for OpenWeatherMap icons, custom SVG for clear night
  test/
    setup.js          # Testing Library + jest-dom setup
  App.jsx             # state container: search flow, theme, recents
  main.jsx            # React entry point
  index.css           # theme variables and global styles
  App.css             # component styles
```

## How It Works

1. A search is geocoded with the **Geocoding API** to get coordinates
   (and a state/country so identical city names are distinguishable).
2. If exactly one place matches, the **Current Weather** and **5-Day Forecast**
   endpoints are called in parallel using those coordinates.
3. The forecast endpoint returns 3-hour steps; they are grouped by the city's
   local date and reduced to one summary per day (min/max plus the reading
   closest to local noon for description/icon/feels-like/humidity/wind).

## Testing

```bash
npm test
```

The suite covers the API normalizers (including the day-grouping logic), the
presentational `WeatherCard`, and the `App` container (loading/error/success
flows, recents persistence, and theme toggling).

## Assumptions & Notes

- Weather data is fetched in metric units; conversion to Fahrenheit happens in
  the UI so the toggle is instant and offline.
- "Current temperature" is the rounded `main.temp` from OpenWeatherMap, while a
  forecast day's headline temperature is that day's reading closest to local
  noon (highs/lows are also available from the API if preferred).
- Recent searches are keyed by rounded coordinates to avoid duplicate entries
  for the same place.
- Geolocation uses the browser's `navigator.geolocation`, and OpenWeatherMap's
  coordinates endpoints, so no reverse-geocoding step is needed — the city name
  comes back from the weather response.
- The OpenWeatherMap free tier does not return a state for every country;
  disambiguation falls back to the country code.
- The API key lives in `.env`, which should stay out of version control
  (see `.gitignore`). Add a `.env.example` with a placeholder for collaborators.

## Things I Would Have Added If I Had More Time

- **Recent search history**: Unique recent search history and the ability to show
  a larger list (e.g. a dropdown instead of just chips), so you can quickly
  reselect past searches without a scrollbar or clutter.
- **Improved UI design**: More polished animations, mobile responsiveness tweaks,
  and better visual hierarchy to make the current day feel even more central.
- **Multilanguage support**: i18n (e.g. English, Arabic, etc.) so descriptions
  and UI labels could be translated based on user preference.
- **Better security for the API key**: Since this is a client-side Vite app,
  the OpenWeatherMap key is exposed in the browser. A proper backend proxy
  (e.g. an API route) to keep the key secret would be more secure for a public
  deployment.
- **Testing improvements**:
  - Add QUnit tests specifically for `geocode.js` (in addition to the current
    Vitest setup).
  - Be consistent with 401 handling across modules. Currently `weather.js` and
    `forecast.js` throw "Invalid API key" on a 401, but `geocode.js` falls
    back to a generic "Failed to search for city" in its catch mapping. This
    should be unified.
- **Abort handling**: When a request is cancelled, `fetch` rejects with
  `AbortError`. The API catch currently converts that to "Network error —
  check your connection". Autocomplete already hides these errors, but it would
  be cleaner to check `error.name === 'AbortError'` and rethrow it (so callers
  can distinguish cancellations from real network failures).