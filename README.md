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
fallback coordinates, quick links, countdowns, news feeds and `FEED_PROXY`.

## Feed proxy (optional)

RSS, MeteoAlarm and the METAR mirror send no CORS headers, so the browser cannot read
them directly. Out of the box the page borrows public proxies (rss2json, AllOrigins)
for that hop. They work, but they have no SLA, and DNS filters classify public CORS
proxies as anonymisers — Whalebone blocks `api.allorigins.win` and `metar.vatsim.net`
on some networks, which leaves the news list with no fallback.

`worker.js` is a Cloudflare Worker that does the same hop on your own domain. To use it:

```sh
npx wrangler deploy worker.js --name go-feeds --compatibility-date 2026-01-01
```

Then set the returned URL in the `CONFIG` block:

```js
const FEED_PROXY = "https://go-feeds.<subdomain>.workers.dev/?url=";
```

and add that origin to `connect-src` in the page's Content-Security-Policy meta tag.
Leaving `FEED_PROXY` as `""` keeps the public-proxy behaviour, so this is optional.

The worker only forwards to an allowlisted set of hosts (an open proxy on your own
domain gets abused), caches for 5 minutes at the edge, and sets the `User-Agent` that
browser JS cannot — which is what MET Norway's terms ask API clients for.

## Data sources

All keyless: MET Norway (forecast, sunrise), Open-Meteo (air quality), NOAA SWPC (Kp
index), MeteoAlarm (warnings), BigDataCloud (reverse geocoding), VATSIM (METAR),
Denník N and Google News (RSS). Nothing is loaded from Google at runtime — quick-link
favicons ship inlined as data URIs and no webfont is fetched.

## Refresh

No whole-page reload. Each source refreshes on its own cadence: clock every second,
news every 5 minutes, warnings every 15, weather every 30 (matching the `Expires` MET
Norway sends). Date-dependent widgets re-render when the clock crosses midnight.
