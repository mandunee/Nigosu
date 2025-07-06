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
      d.artist?.toLowerCase().includes(term) ||
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
    <div className="max-w-4xl mx-auto mt-8 p-4 bg-[#36393f] rounded-lg shadow-lg text-sm md:text-base">
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
          
          <button
            onClick={async () => {
              setLoading(true);
              await fetch('/api/nigo', { method: 'POST' });
              await fetch(endpoint).then(r=>r.json()).then(setData).finally(()=>setLoading(false));
            }}
            className="ml-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
          >
            ↻
          </button>
          
        </div>
        
      </div>
      <table className="w-full text-left border-separate border-spacing-y-3 table-fixed">
        <thead>
          <tr className="text-left text-gray-200">
            {[
              { k: "title", label: "Title", w: "w-1/2" },
              { k: "mapper", label: "Mapper", w: "w-1/6" },
              { k: "length", label: "Length", w: "w-1/10" },
              { k: "mode", label: "Mode", w: "w-1/10" },
              { k: "ranked_at", label: "Ranked", w: "w-1/6" },
              { k: "link", label: "Link", w: "w-1/12" },
            ].map(({ k, label, w }) => (
              <th
                key={k}
                className={`cursor-pointer select-none px-3 py-2 ${w} overflow-visible`}
                onClick={() => handleSort(k as SortKey)}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  {sortKey !== k ? (
                    <FaSort className="text-xs" />
                  ) : asc ? (
                    <FaSortUp className="text-xs" />
                  ) : (
                    <FaSortDown className="text-xs" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <AnimatePresence mode="wait">
          <motion.tbody
            key={page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="[&>tr_.main]:cursor-pointer"
          >
          {currentPageData.map((bm) => (
            <Row key={bm.id} bm={bm} jp={jp} />
          ))}
        </motion.tbody>
        </AnimatePresence>
      </table>

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
  console.debug('row bg', bm.id, bm.bg_url);
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
      <tr onClick={() => setOpen(!open)}>
        <td colSpan={6} className="p-0">
          <div className={`relative rounded-md overflow-hidden shadow-lg hover:shadow-xl transition-shadow text-white ${bm.bg_url ? '' : 'bg-[#2e2f34]'}`}>
            {/* blurred bg */}
            {bm.bg_url && (
              <div
                className="absolute inset-0 z-0 bg-center bg-cover scale-110 blur-[3px] opacity-80"
                style={{ backgroundImage: `url(${bm.bg_url})` }}
              />
            )}
            {/* overlay to darken */}
            <div className="absolute inset-0 z-10 bg-black/20 pointer-events-none" />

            <div className="relative z-20 flex w-full">
              <div className="px-3 py-4 w-1/2 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] truncate">{titleDisplay}</div>
              <div className="px-3 py-4 w-1/6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] truncate">{bm.mapper}</div>
              <div className="px-3 py-4 w-1/10 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] truncate text-center">{bm.length}</div>
              <div className="px-3 py-4 w-1/10 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] truncate text-center">{bm.mode}</div>
              <div className="px-3 py-4 w-1/6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] truncate text-center">{bm.ranked_at}</div>
              <div className="px-3 py-4 w-1/12 flex justify-center items-center">
                <a href={`https://osu.ppy.sh/beatmapsets/${bm.bm_id}`} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200">
                  <FaExternalLinkAlt />
                </a>
              </div>
            </div>
          </div>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && (
        <motion.tr layout>
          <td colSpan={6} className="pt-1">
            <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 transition={{ duration: 0.25 }}
                 className="diff-card bg-[#2e2f34] rounded-md shadow-lg overflow-hidden"
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
           </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
