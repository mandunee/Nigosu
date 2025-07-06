import BeatmapTable from "@/components/BeatmapTable";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#2b2d31] text-white py-10">
      <div className="container mx-auto px-4 flex flex-col items-center gap-6">
        <Image src="/25ji-logo.webp" alt="25-ji Logo" width={281*1.5} height={115*1.2} priority className="drop-shadow-[0_6px_24px_rgba(0,0,0,0.8)]" />
        <BeatmapTable />
      </div>
    </main>
  );
}