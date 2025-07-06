export interface Difficulty {
  id: number;
  mode: string;
  version: string;
  stars: number;
}

export interface Beatmap {
  id: number;
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
