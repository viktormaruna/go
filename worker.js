/**
 * Cloudflare Worker — same-origin proxy for the start page's no-CORS sources.
 *
 * Why this exists: RSS feeds, MeteoAlarm and the VATSIM METAR mirror send no
 * CORS headers, so the browser cannot read them directly. The page used to
 * borrow public proxies (rss2json, allorigins) for this, which has two problems:
 *
 *   1. DNS filters categorise public CORS proxies as anonymisers. Whalebone —
 *      widely deployed by ISPs and enterprises — blocks api.allorigins.win and
 *      metar.vatsim.net outright on at least one network this page is used from,
 *      so the news ticker lost its only fallback exactly where it was needed.
 *   2. Free tiers have no SLA and rate-limit without warning.
 *
 * Running the hop on our own domain fixes both, and lets us set a User-Agent —
 * something browser JS cannot do, but which MET Norway's terms ask API clients
 * for. Deploy notes are in README.md.
 */

// Strict allowlist. An open proxy gets found and abused within days, and this
// one runs on the same domain as the page — keep it to the sources we call.
const ALLOW_HOSTS = new Set([
  "dennikn.sk",
  "news.google.com",
  "metar.vatsim.net",
  "feeds.meteoalarm.org",
]);

const ALLOW_ORIGINS = new Set([
  "https://go.viktormaruna.com",
  "http://localhost:8080", // local preview
]);

// Matches the page's fastest consumer (news, 5 min), so a reload is cheap and
// upstreams see at most one request per source per 5 minutes across all tabs.
const TTL = 300;

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOW_ORIGINS.has(origin) ? origin : "https://go.viktormaruna.com",
      Vary: "Origin",
    };
    const fail = (status, msg) => new Response(msg, { status, headers: cors });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return fail(405, "Method not allowed");

    const target = new URL(request.url).searchParams.get("url");
    if (!target) return fail(400, "Missing ?url=");

    let url;
    try {
      url = new URL(target);
    } catch {
      return fail(400, "Malformed ?url=");
    }
    if (url.protocol !== "https:") return fail(400, "https only");
    if (!ALLOW_HOSTS.has(url.hostname)) return fail(403, `Host not allowed: ${url.hostname}`);

    let upstream;
    try {
      upstream = await fetch(url.toString(), {
        headers: {
          "User-Agent": "go.viktormaruna.com personal start page (+https://github.com/viktormaruna/go)",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/plain;q=0.8, */*;q=0.5",
        },
        cf: { cacheTtl: TTL, cacheEverything: true },
      });
    } catch (e) {
      return fail(502, `Upstream fetch failed: ${e.message}`);
    }

    if (!upstream.ok) return fail(502, `Upstream ${upstream.status}`);

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": upstream.headers.get("Content-Type") || "text/plain; charset=utf-8",
        "Cache-Control": `public, max-age=${TTL}`,
      },
    });
  },
};
