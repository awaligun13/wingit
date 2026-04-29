import { useEffect, useState } from "react";
import { ethers } from "ethers";
import WingItABI from "./WingItABI.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

function resolveIPFS(uri) {
  if (!uri) return null;

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  if (uri.startsWith("ipfs://")) {
    const cleaned = uri.replace("ipfs://", "");
    const normalized = cleaned.startsWith("ipfs/")
      ? cleaned.replace("ipfs/", "")
      : cleaned;

    return `https://w3s.link/ipfs/${normalized}`;
  }

  return uri;
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Metadata fetch failed:", url, err);
    return null;
  }
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export function useGallery() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const extractImage = (meta) => {
    const raw =
      meta?.image ||
      meta?.image_url ||
      meta?.media ||
      meta?.properties?.files?.[0]?.uri ||
      meta?.image?.uri ||
      null;

    return resolveIPFS(raw);
  };

  const extractCommonName = (meta, fallback) => {
    return (
      meta?.attributes?.find(
        (a) => a.trait_type === "Common Name"
      )?.value || fallback
    );
  };

  const loadAll = async () => {
    setLoading(true);

    let minted = [];

    try {
      const provider = new ethers.JsonRpcProvider(
        "https://bsc-testnet-rpc.publicnode.com"
      );

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        WingItABI,
        provider
      );

      const total = Number(await contract.totalSightings());

      for (let i = 0; i < total; i++) {
        try {
          const sighting = await contract.getSighting(i);
          const tokenURI = await contract.tokenURI(i);

          const meta = await fetchJSON(resolveIPFS(tokenURI));

          minted.push({
            id: i,
            species: sighting.species,
            commonName: extractCommonName(meta, sighting.species),
            location: sighting.location,
            timestamp: new Date(
              Number(sighting.timestamp) * 1000
            ).toISOString(),
            image: meta ? extractImage(meta) : null,
            birder: sighting.birder,
            minted: true,
          });

          await sleep(50);
        } catch (err) {
          console.error(`Error loading sighting ${i}:`, err);
        }
      }
    } catch (err) {
      console.error("Error fetching minted sightings:", err);
    }

    // -------------------------
    // 🔥 FIXED DRAFT HANDLING
    // -------------------------
    let drafts = [];
    try {
      drafts =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("wingit_drafts") || "[]")
          : [];
    } catch {
      drafts = [];
    }

    const draftSightings = drafts.map((d) => {
      // normalize old + new draft formats
      const meta = d;

      return {
        id: d.id,
        species: d.species,
        commonName: d.commonName || d.species,
        location: d.location,
        timestamp: d.timestamp || new Date(d.id).toISOString(),
        image: resolveIPFS(meta.image),
        minted: false,
      };
    });

    const all = [...minted, ...draftSightings].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    setSightings(all);
    setLoading(false);
  };

  return { sightings, loading, refresh: loadAll };
}