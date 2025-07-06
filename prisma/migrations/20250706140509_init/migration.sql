-- CreateTable
CREATE TABLE "Beatmap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT,
    "mapper" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "ranked_at" TEXT,
    "beatmaps_json" JSONB,
    "bg_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
