"use client";
import { useState } from "react";
import { useGallery } from "../../lib/getGallery";

export default function MakeGallery() {
  const { sightings, loading } = useGallery();
  const [filter, setFilter] = useState("all");

  if (loading) return <p className="text-center text-gray-500">Loading sightings...</p>;
  if (sightings.length === 0) return <p className="text-center text-gray-500">No sightings yet. Go log one!</p>;

  const filtered = sightings.filter((s) => {
    if (filter === "minted") return s.minted;
    if (filter === "drafts") return !s.minted;
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        {["all", "minted", "drafts"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Draft visibility notice */}
      {(filter === "all" || filter === "drafts") && sightings.some((s) => !s.minted) && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <span>🔒</span> Draft sightings are only visible to you on this device.
        </p>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-8">No {filter} sightings found.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={`${s.minted ? "minted" : "draft"}-${s.id}`} className="rounded-xl overflow-hidden shadow border relative">
            {s.image ? (
              <img src={s.image} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                No image
              </div>
            )}

            <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
              s.minted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {s.minted ? "⛓ Minted" : "Draft"}
            </span>

            <div className="p-3 space-y-0.5">
              <p className="font-semibold text-sm">{s.commonName}</p>
              <p className="text-xs text-gray-500 italic">{s.species}</p>
              <p className="text-xs text-gray-500">📍 {s.location}</p>
              {s.minted && (
                <p className="text-xs text-gray-400 truncate">🧑 {s.birder}</p>
              )}
              <p className="text-xs text-gray-400">{new Date(s.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}