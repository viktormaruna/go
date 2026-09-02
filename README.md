# go

Personal browser start page — one static `index.html`, no build step, no dependencies,
no API keys.

## What it shows

- Local time, date, ISO week, timezone and the Slovak name day (meniny)
- Search across Brave / Perplexity / Claude — `!b` `!p` `!c` prefixes override the
  selected engine, `/` focuses the box, results open in a new tab
- Weather from **yr.no** (MET Norway) for the browser's location: current conditions,
  5-day forecast, and a metric row (feels-like, wind, humidity, dew point, pressure,
  cloud layers, UV, rain)
- Air quality, sunrise/sunset, moon phase, aurora chance (NOAA Kp) and the decoded
  METAR of the nearest reporting airport
- Severe-weather warnings for the current region (SHMÚ via MeteoAlarm) — shown only
  when a warning is active
- Month calendar with countdowns, favicon quick links, and a news list

## Deploy

GitHub Pages serves `index.html` from the repository root. `robots.txt` and the page's
`noindex` meta keep it out of search engines.

## Configuration

Everything editable lives in the `CONFIG` block at the top of the `<script>`:
fallback coordinates, quick links, countdowns and news feeds.

## Data sources

All keyless and called directly from the browser: MET Norway (forecast, sunrise),
Open-Meteo (air quality), NOAA SWPC (Kp index), MeteoAlarm (warnings), BigDataCloud
(reverse geocoding), VATSIM (METAR), rss2json / AllOrigins (RSS, which sends no CORS
headers of its own).
