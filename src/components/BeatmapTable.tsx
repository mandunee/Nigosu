"use client";
import { useEffect, useState } from "react";
import { Beatmap, Difficulty } from "@/types/beatmap";
import { FaStar, FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  endpoint?: string;
}

type SortKey = keyof Beatmap | "ranked_at";

export default function BeatmapTable({ endpoint = "/api/beatmaps" }: Props) {
  const [jp, setJp] = useState<boolean>(true);
  const [data, setData] = useState<Beatmap[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("bm_id");
  const [asc, setAsc] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(()=>setLoading(false));
  }, [endpoint]);

  function handleSort(k: SortKey) {
    if (sortKey === k) {
      setAsc(!asc);
    } else {
      setSortKey(k);
      setAsc(true);
    }
  }

  const filtered = data.filter((d) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      d.title.toLowerCase().includes(term) ||
      (d.title_en ?? "").toLowerCase().includes(term) ||
      d.mapper.toLowerCase().includes(term)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as any;
    const bv = b[sortKey] as any;
    if (av === bv) return 0;
    return asc ? (av > bv ? 1 : -1) : av > bv ? -1 : 1;
  });

  // paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 p-4 bg-[#36393f] rounded-lg shadow-lg text-sm md:text-base">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="flex gap-3 items-center w-full">
          <button
            onClick={() => setJp(true)}
            className={`px-3 py-2 rounded-l ${jp ? "bg-indigo-600" : "bg-gray-600"} text-white`}
          >JP</button>
          <button
            onClick={() => setJp(false)}
            className={`px-3 py-2 rounded-r ${jp ? "bg-gray-600" : "bg-indigo-600"} text-white`}
          >EN</button>
          <div className="ml-auto flex gap-3 items-center w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by title or mapper..."
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 bg-gray-700 text-white placeholder-gray-400 rounded"
            />
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              await fetch('/api/nigo', { method: 'POST' });
              await fetch(endpoint).then(r=>r.json()).then(setData).finally(()=>setLoading(false));
            }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
          >
            ↻
          </button>
        </div>
      </div>
      {/* Header Row */}
      <div className="hidden md:grid grid-cols-12 text-gray-200 mb-2 w-full">
        <div className="cursor-pointer col-span-5 select-none px-3 py-2" onClick={() => handleSort("title") as any}>
          <span className="inline-flex items-center gap-1">
            Title
            {sortKey !== "title" ? <FaSort className="text-xs" /> : asc ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />}
          </span>
        </div>
        <div className="cursor-pointer col-span-2 select-none px-3 py-2" onClick={() => handleSort("mapper") as any}>
          <span className="inline-flex items-center gap-1">
            Mapper
            {sortKey !== "mapper" ? <FaSort className="text-xs" /> : asc ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />}
          </span>
        </div>
        <div className="cursor-pointer col-span-1 select-none px-3 py-2 text-center" onClick={() => handleSort("length") as any}>
          <span className="inline-flex items-center gap-1">
            Length
            {sortKey !== "length" ? <FaSort className="text-xs" /> : asc ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />}
          </span>
        </div>
        <div className="cursor-pointer col-span-1 select-none px-3 py-2 text-center" onClick={() => handleSort("mode") as any}>
          <span className="inline-flex items-center gap-1">
            Mode
            {sortKey !== "mode" ? <FaSort className="text-xs" /> : asc ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />}
          </span>
        </div>
        <div className="cursor-pointer col-span-2 select-none px-3 py-2 text-center" onClick={() => handleSort("ranked_at") as any}>
          <span className="inline-flex items-center gap-1">
            Ranked
            {sortKey !== "ranked_at" ? <FaSort className="text-xs" /> : asc ? <FaSortUp className="text-xs" /> : <FaSortDown className="text-xs" />}
          </span>
        </div>
        <div className="col-span-1 select-none px-3 py-2 text-center">
          Link
        </div>
      </div>

      {/* Data Rows */}
      <AnimatePresence mode="wait" key={page}>
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {currentPageData.map((bm) => (
            <Row key={bm.id} bm={bm} jp={jp} />
          ))}
        </motion.div>
      </AnimatePresence>

      

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4 text-white">
          <button
            className="disabled:opacity-40"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <FaChevronLeft />
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            className="disabled:opacity-40"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ bm, jp }: { bm: Beatmap; jp: boolean }) {
  const [open, setOpen] = useState(false);
  const beatmaps: Difficulty[] = bm.beatmaps_json ?? [];
  const titleDisplay = jp ? bm.title : bm.title_en ?? bm.title;

  const modeOrder = ["osu", "mania", "taiko", "fruits"];
  const sortedDiff = beatmaps?.slice().sort((a, b) => {
    const ai = modeOrder.indexOf(a.mode?.toLowerCase());
    const bi = modeOrder.indexOf(b.mode?.toLowerCase());
    if (ai !== bi) return ai - bi;
    return (a.stars ?? 0) - (b.stars ?? 0);
  });

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className={`relative rounded-md overflow-hidden shadow-lg hover:shadow-xl transition-shadow text-white cursor-pointer ${bm.bg_url ? '' : 'bg-[#2e2f34]'}`}
      >
        {/* blurred bg */}
        {bm.bg_url && (
          <div
            className="absolute inset-0 z-0 bg-center bg-cover scale-110 blur-[3px] opacity-80"
            style={{ backgroundImage: `url(${bm.bg_url})` }}
          />
        )}
        {/* overlay */}
        <div className="absolute inset-0 z-10 bg-black/20 pointer-events-none" />

        <div className="relative z-20 grid grid-cols-12 w-full">
          <div className="px-3 py-4 col-span-5 truncate [text-shadow:0_3px_8px_rgba(0,0,0,1)]">{titleDisplay}</div>
          <div className="px-3 py-4 col-span-2 truncate [text-shadow:0_3px_8px_rgba(0,0,0,1)]">{bm.mapper}</div>
          <div className="px-3 py-4 col-span-1 truncate text-center [text-shadow:0_3px_8px_rgba(0,0,0,1)]">{bm.length}</div>
          <div className="px-3 py-4 col-span-1 truncate text-center [text-shadow:0_3px_8px_rgba(0,0,0,1)]">{bm.mode}</div>
          <div className="px-3 py-4 col-span-2 truncate text-center [text-shadow:0_3px_8px_rgba(0,0,0,1)]">{bm.ranked_at}</div>
          <div className="px-3 py-4 col-span-1 flex justify-center items-center">
            <a
              href={`https://osu.ppy.sh/beatmapsets/${bm.bm_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="diff"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="diff-card bg-[#2e2f34] rounded-md shadow-lg overflow-hidden mt-1"
          >
            {sortedDiff?.map((d) => (
              <div
                key={d.id}
                className="flex justify-between items-center px-4 py-2 text-white font-medium text-sm border-b last:border-b-0 border-white/10"
              >
                <span className="truncate max-w-[70%]">{d.version}</span>
                <span className="flex items-center gap-1 text-gold-400">
                  <FaStar className="text-yellow-400" />
                  {d.stars.toFixed(2)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
