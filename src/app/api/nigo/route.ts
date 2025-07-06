import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { OSU_CLIENT_ID, OSU_CLIENT_SECRET } from "@/config/env";

const MAX_FETCH_MAPS = 200;
const MAX_FETCH_PAGES = 15;
const PROJECT_SEKAI_UNICODE = "プロジェクトセカイ カラフルステージ！ feat.初音ミク";
const PROJECT_SEKAI_EN = "Project Sekai: Colorful Stage! feat. Hatsune Miku";
const NIGO_UNICODE = "25時、 ナイトコードで。";
const NIGO_EN = "25-ji, Nightcord de.";
// broader Project Sekai aliases including プロセカ
const PRSK_REGEX = /(プロジェクトセカイ(?: カラフルステージ)?|プロセカ|pjsk|prsk|project sekai)/i;
// broader 25時、 ナイトコードで aliases (various spaces / punctuation)
const NIGO_REGEX = /(nigo|niigo|25[- ]?ji[,]?\s?nightcord de\.|25[- ]?ji|25ji|25時.?ナイトコード.?で。?)/i;

async function getToken(): Promise<string> {
  if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
    throw new Error("OSU_CLIENT_ID / OSU_CLIENT_SECRET env vars not set");
  }
  const res = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: Number(OSU_CLIENT_ID),
      client_secret: OSU_CLIENT_SECRET,
      scope: "public",
    }),
  });
  if (!res.ok) {
    throw new Error("osu! token fetch failed");
  }
  const json = await res.json();
  return json.access_token as string;
}

async function fetchBeatmapsets(token: string) {
  let beatmapsets: any[] = [];
  let cursor = "";
  let pages = 0;
  const headers = { Authorization: `Bearer ${token}` };
  while (beatmapsets.length < MAX_FETCH_MAPS && pages < MAX_FETCH_PAGES) {
    const params = new URLSearchParams({
      categories: "ranked",
      q: PROJECT_SEKAI_UNICODE,
    });
    if (cursor) params.append("cursor_string", cursor);
    const url = `https://osu.ppy.sh/api/v2/beatmapsets/search?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;
    const data = await res.json();
    beatmapsets = beatmapsets.concat(data.beatmapsets || []);
    cursor = data.cursor_string || "";
    pages += 1;
    if (!cursor) break;
  }
  return beatmapsets;
}

export async function POST() {
  try {
    const token = await getToken();
    const rawSets = await fetchBeatmapsets(token);

    // Nigo filter based on artist or tags
    const filtered = rawSets.filter((set: any) => {
      const tags = (set.tags || "").toLowerCase();
      const title = (set.title_unicode || set.title || "").toLowerCase();
      const artist = (set.artist_unicode || set.artist || "").toLowerCase();
      const source = (set.source || "").toLowerCase();

      // Check for Nigo indicators in artist, title or tags
      const hasNigo = NIGO_REGEX.test(artist) || NIGO_REGEX.test(title) || NIGO_REGEX.test(tags);

      // Project Sekai indicator in tags, title or source
      const hasPrsk = PRSK_REGEX.test(tags) || PRSK_REGEX.test(title) || PRSK_REGEX.test(source);

      return hasNigo && hasPrsk;
    });

    let inserted = 0;
    for (const set of filtered) {
      const beatmaps = set.beatmaps || [];
      if (!beatmaps.length) continue;

      const hardest = beatmaps.reduce((prev: any, cur: any) =>
        (cur.difficulty_rating ?? 0) > (prev.difficulty_rating ?? 0) ? cur : prev,
      );

      const lengthSec = hardest.total_length ?? 0;
      const length = `${Math.floor(lengthSec / 60)}:${String(lengthSec % 60).padStart(2, "0")}`;

      const beatmapsList = beatmaps.map((b: any) => ({
        id: b.id,
        version: b.version,
        stars: b.difficulty_rating,
        mode: b.mode,
      }));

      await prisma.beatmap.upsert({
        where: { id: set.id },
        create: {
          id: set.id,
          artist: set.artist_unicode || set.artist,
          title: set.title_unicode || set.title,
          title_en: set.title,
          mapper: set.creator,
          length,
          mode: hardest.mode,
          difficulty: hardest.version,
          ranked_at: set.ranked_date ? set.ranked_date.substring(0, 10) : null,
          bg_url: set.covers?.cover || set.covers?.["cover@2x"] || set.covers?.card || set.covers?.list || null,
          beatmaps_json: beatmapsList as any,
        },
        update: {},
      });
      inserted += 1;
    }

    return NextResponse.json({ inserted, total: filtered.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
