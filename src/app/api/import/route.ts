import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getAccessToken() {
  const res = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.OSU_CLIENT_ID,
      client_secret: process.env.OSU_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "public",
    }),
  });
  if (!res.ok) throw new Error("osu! token fetch failed");
  const json = await res.json();
  return json.access_token as string;
}

async function searchBeatmapsets(token: string, query: string) {
  const url = `https://osu.ppy.sh/api/v2/beatmapsets/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("osu! search failed");
  const json = await res.json();
  return json.beatmapsets as any[];
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }
    const token = await getAccessToken();
    const sets = await searchBeatmapsets(token, query);

    for (const set of sets.slice(0, 20)) {
      const beatmaps = set.beatmaps.map((b: any) => ({
        id: b.id,
        mode: b.mode,
        version: b.version,
        stars: b.difficulty_rating,
      }));
      await prisma.beatmap.upsert({
        where: { bm_id: set.id },
        create: {
          bm_id: set.id,
          artist: set.artist,
          title: set.title,
          mapper: set.creator,
          length: `${Math.floor(set.beatmaps[0].total_length / 60)}:${(
            set.beatmaps[0].total_length % 60
          )
            .toString()
            .padStart(2, "0")}`,
          mode: set.beatmaps[0].mode,
          difficulty: set.status,
          ranked_at: set.ranked_date?.substring(0, 10) ?? null,
          bg_url: set.covers?.card ?? null,
          beatmaps_json: beatmaps as any,
        },
        update: {},
      });
    }
    return NextResponse.json({ imported: sets.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
