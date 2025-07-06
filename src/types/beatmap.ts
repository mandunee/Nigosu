export interface Difficulty {
  id: number;
  mode: string;
  version: string;
  stars: number;
}

export interface Beatmap {
  /**
   * Mongo document ObjectId (hex string)
   */
  id: string;
  /**
   * Numeric osu! beatmapset id – use this when generating hyperlinks.
   */
  bm_id: number;
  artist: string;
  title: string;
  title_en?: string;
  mapper: string;
  length: string;
  mode: string;
  difficulty: string;
  ranked_at?: string;
  bg_url?: string;
  beatmaps_json?: any;
  created_at: string;
}
