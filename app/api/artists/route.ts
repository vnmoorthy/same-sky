import { FESTIVAL_ARTISTS } from "../../../lib/artists";
import { runtimeEnv } from "../../../lib/server/db";
import type { Artist } from "../../../lib/types";

export const dynamic = "force-dynamic";

function mapJamBase(payload: unknown): Artist[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const values = [root.artists, root.results, root.data].find(Array.isArray) as unknown[] | undefined;
  if (!values) return [];
  return values.slice(0, 8).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const name = row.name ?? row.artistName;
    if (typeof name !== "string") return [];
    const id = String(row.id ?? row.identifier ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    const url = typeof row.url === "string" ? row.url : typeof row.jambaseUrl === "string" ? row.jambaseUrl : undefined;
    return [{ id, name, genre: "Live music", day: "JamBase artist data", url, source: "jambase" as const }];
  });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const apiKey = runtimeEnv().JAMBASE_API_KEY;

  if (apiKey && query.length >= 2) {
    try {
      const url = new URL("https://api.data.jambase.com/v3/artists");
      url.searchParams.set("artistName", query);
      url.searchParams.set("perPage", "8");
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${apiKey}`, accept: "application/json", "user-agent": "SameSky/1.0" },
        signal: AbortSignal.timeout(6_000),
      });
      if (response.ok) {
        const artists = mapJamBase(await response.json());
        if (artists.length) {
          return Response.json({ ok: true, artists, source: "jambase", attribution: "Live music data by JamBase" });
        }
      }
    } catch (error) {
      console.warn("JamBase lookup unavailable; using the festival preview", error);
    }
  }

  const normalized = query.toLowerCase();
  const artists = normalized
    ? FESTIVAL_ARTISTS.filter((artist) => artist.name.toLowerCase().includes(normalized))
    : FESTIVAL_ARTISTS;
  return Response.json({
    ok: true,
    artists: artists.length ? artists : FESTIVAL_ARTISTS,
    source: "festival-preview",
    attribution: "2026 festival preview · JamBase enrichment ready",
  });
}
