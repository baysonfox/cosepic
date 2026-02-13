"use client";

import { useEffect, useState } from "react";
import { findDuplicates, type DedupResponse, type DedupResult, thumbnailUrl } from "@/lib/api";

export default function DedupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DedupResponse | null>(null);
  const [threshold, setThreshold] = useState(10);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFindDuplicates = async () => {
    setLoading(true);
    try {
      const data = await findDuplicates(threshold);
      setResults(data);
      showMessage("success", `找到 ${data.exact_count} 个重复，${data.similar_count} 个相似`);
    } catch (e) {
      showMessage("error", e instanceof Error ? e.message : "查找失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    handleFindDuplicates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">图片去重</h1>
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-400">
              相似度阈值 (Hamming 距离):
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="ml-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              >
                <option value={5}>5 (非常严格)</option>
                <option value={10}>10 (标准)</option>
                <option value={15}>15 (宽松)</option>
                <option value={20}>20 (非常宽松)</option>
              </select>
            </label>
            <button
              onClick={handleFindDuplicates}
              disabled={loading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "查找中..." : "重新查找"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success"
                ? "bg-green-900/50 text-green-200"
                : "bg-red-900/50 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {results && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-red-400">
                完全重复 ({results.exact_count})
              </h2>
              {results.exact_duplicates.length === 0 ? (
                <p className="text-gray-400">没有找到完全重复的图片</p>
              ) : (
                <div className="space-y-4">
                  {results.exact_duplicates.map((dup, idx) => (
                    <DuplicateCard key={idx} result={dup} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">
                相似图片 ({results.similar_count})
              </h2>
              {results.similar_pairs.length === 0 ? (
                <p className="text-gray-400">没有找到相似的图片</p>
              ) : (
                <div className="space-y-4">
                  {results.similar_pairs.map((pair, idx) => (
                    <DuplicateCard key={idx} result={pair} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function DuplicateCard({ result }: { result: DedupResult }) {
  const isExact = result.type === "exact";

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-1 text-xs rounded ${
            isExact ? "bg-red-900/50 text-red-300" : "bg-yellow-900/50 text-yellow-300"
          }`}
        >
          {isExact ? "完全相同" : `Hamming 距离: ${result.distance}`}
        </span>
        <span className="text-sm text-gray-400">{result.images.length} 张图片</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {result.images.map((img) => (
          <div key={img.id} className="bg-gray-800 rounded overflow-hidden">
            <img
              src={thumbnailUrl(img.cosplay_id, img.filename.replace(/\.[^.]+$/, ".avif"))}
              alt={img.filename}
              className="w-full aspect-[3/4] object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `/api/files/image/${img.cosplay_id}/${encodeURIComponent(img.filename)}`;
              }}
            />
            <div className="p-2">
              <p className="text-xs text-white truncate">{img.cosplay_title}</p>
              <p className="text-xs text-gray-500 truncate">{img.filename}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}