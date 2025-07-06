const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  // If a seed.json exists, use that; otherwise insert minimal demo records
  let records = [];
  if (fs.existsSync("prisma/seed.json")) {
    records = JSON.parse(fs.readFileSync("prisma/seed.json", "utf-8"));
  } else {
    records = [
      {
        artist: "xi",
        title: "FREEDOM DiVE",
        title_en: "FREEDOM DiVE",
        mapper: "Nakagawa-Kanon",
        length: "2:23",
        mode: "osu",
        difficulty: "Extra",
        ranked_at: "2013-01-01",
        bg_url: "https://assets.ppy.sh/beatmaps/126645/covers/cover.jpg",
        beatmaps_json: [
          {
            id: 1,
            mode: "osu",
            version: "Normal",
            stars: 2.3,
          },
          {
            id: 2,
            mode: "osu",
            version: "Hard",
            stars: 4.5,
          },
          {
            id: 3,
            mode: "osu",
            version: "Extra",
            stars: 5.95,
          },
        ],
      },
    ];
  }

  for (const rec of records) {
    await prisma.beatmap.upsert({
      where: { id: rec.id ?? 0 },
      create: rec,
      update: rec,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
