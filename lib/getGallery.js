import { useEffect, useState } from "react";
import { ethers } from "ethers";
import WingItABI from "./WingItABI.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

function resolveIPFS(uri) {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://w3s.link/ipfs/");
  }
  return uri;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export function useGallery() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    let minted = [];

    try {
      const provider = new ethers.JsonRpcProvider(
        "https://bsc-testnet-rpc.publicnode.com"
      );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, WingItABI, provider);

      const total = Number(await contract.totalSightings());

      for (let i = 0; i < total; i++) {
        try {
          const sighting = await contract.getSighting(i);
          const tokenURI = await contract.tokenURI(i);
          const meta = await fetchJSON(resolveIPFS(tokenURI));

          minted.push({
            id: i,
            species: sighting.species,
            commonName:
              meta.attributes?.find((a) => a.trait_type === "Common Name")?.value ||
              sighting.species,
            location: sighting.location,
            timestamp: new Date(Number(sighting.timestamp) * 1000).toISOString(),
            image: resolveIPFS(meta.image),
            birder: sighting.birder,
            minted: true,
          });

          await sleep(100); // small delay between each to avoid rate limiting
        } catch (err) {
          console.error(`Error loading sighting ${i}:`, err);
        }
      }
    } catch (err) {
      console.error("Error fetching minted sightings:", err);
    }

    let drafts = [];
    try {
      drafts =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("wingit_drafts") || "[]")
          : [];
    } catch {
      drafts = [];
    }

    const draftSightings = await Promise.all(
      drafts.map(async (d) => {
        try {
          const meta = await fetchJSON(resolveIPFS(d.metadataURI));
          return { ...d, image: resolveIPFS(meta.image), minted: false };
        } catch {
          return { ...d, image: null, minted: false };
        }
      })
    );

    const all = [...minted, ...draftSightings].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    setSightings(all);
    setLoading(false);
  };

  return { sightings, loading, refresh: loadAll };
}