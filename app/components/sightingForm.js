"use client";
import { useState, useRef } from "react";
import { searchBirds } from "../../lib/INaturalist";
import { detectLocation, searchLocation } from "../../lib/useLocation";
import { useWingIt } from "../../lib/WingItFunctions";
import { uploadMetadataToPinata } from "../../lib/pinata";

export default function SightingForm() {
  const { connectWallet, mintSighting} = useWingIt();

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [birdQuery, setBirdQuery] = useState("");
  const [birdResults, setBirdResults] = useState([]);
  const [selectedBird, setSelectedBird] = useState(null);
  const [birdLoading, setBirdLoading] = useState(false);

  const [location, setLocation] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const [shouldMint, setShouldMint] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef(null);

  const uploadImageToPinata = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error("Image upload failed: " + err);
    }

    const data = await res.json();
    return data.IpfsHash;
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleBirdSearch = (e) => {
    const q = e.target.value;
    setBirdQuery(q);
    setSelectedBird(null);

    clearTimeout(debounceRef.current);

    if (!q) return setBirdResults([]);

    debounceRef.current = setTimeout(async () => {
      setBirdLoading(true);
      const results = await searchBirds(q);
      setBirdResults(results);
      setBirdLoading(false);
    }, 400);
  };

  const handleSelectBird = (bird) => {
    setSelectedBird(bird);
    setBirdQuery(bird.commonName);
    setBirdResults([]);
  };

  const handleDetectLocation = async () => {
    setLocationLoading(true);
    try {
      const detected = await detectLocation();
      setLocation(detected);
      setLocationResults([]);
    } catch {
      setStatus("Could not detect location");
    }
    setLocationLoading(false);
  };

  const handleLocationSearch = (e) => {
    const q = e.target.value;
    setLocation(q);

    if (q.length < 3) return setLocationResults([]);

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const results = await searchLocation(q);
      setLocationResults(results);
    }, 400);
  };

  const handleSelectLocation = (result) => {
    setLocation(result.display_name);
    setLocationResults([]);
  };

  const handleSubmit = async () => {
    if (!image) return setStatus("Please upload an image");
    if (!selectedBird) return setStatus("Please select a bird");
    if (!location) return setStatus("Please enter a location");

    setSubmitting(true);

    try {
      setStatus("Uploading image...");
      const imageCID = await uploadImageToPinata(image);

      const metadata = {
        name: selectedBird.commonName,
        description: `Bird sighting of ${selectedBird.name}`,
        image: `ipfs://${imageCID}`,
        attributes: [
          {
            trait_type: "Species",
            value: selectedBird.name,
          },
          {
            trait_type: "Common Name",
            value: selectedBird.commonName,
          },
          {
            trait_type: "Location",
            value: location,
          },
          {
            trait_type: "Timestamp",
            value: new Date().toISOString(),
          },
        ],
      };
      if (shouldMint) {
        setStatus("Connecting wallet...");
        await connectWallet();

        setStatus("Uploading metadata...");
        const metadataCID = await uploadMetadataToPinata(metadata);
        const tokenURI = `ipfs://${metadataCID}`;

        setStatus("Minting NFT...");
        await mintSighting(
          selectedBird.name,
          location,
          tokenURI
        );

        setStatus("Sighting minted successfully!");
      }
      else {
        let existing = [];
        try {
          existing = JSON.parse(
            localStorage.getItem("wingit_drafts") || "[]"
          );
        } catch {
          existing = [];
        }

        const draft = {
          id: Date.now(),
          species: selectedBird.name,
          commonName: selectedBird.commonName,
          location,
          image: metadata.image,
          timestamp: new Date().toISOString(),
          minted: false,
        };

        localStorage.setItem(
          "wingit_drafts",
          JSON.stringify([...existing, draft])
        );

        setStatus("Sighting saved!");
      }
      setImage(null);
      setImagePreview(null);
      setBirdQuery("");
      setSelectedBird(null);
      setLocation("");

    } catch (err) {
      setStatus("Error: " + err.message);
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Log a Sighting
      </h1>

      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          id="fileUpload"
        />

        <label
          htmlFor="fileUpload"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Choose File
        </label>

        {imagePreview && (
          <img
            src={imagePreview}
            className="mt-4 rounded w-full max-h-48 object-cover"
          />
        )}
      </div>

      <div className="relative">
        <label className="block font-medium mb-1">
          Search Bird
        </label>

        <input
          className="w-full border rounded p-2"
          value={birdQuery}
          onChange={handleBirdSearch}
          placeholder="e.g. American Robin"
        />

        {birdLoading && (
          <p className="text-sm text-gray-500">Searching...</p>
        )}

        {birdResults.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded w-full shadow max-h-48 overflow-y-auto">
            {birdResults.map((bird) => (
              <li
                key={bird.id}
                onClick={() => handleSelectBird(bird)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
              >
                {bird.photoUrl && (
                  <img
                    src={bird.photoUrl}
                    className="w-8 h-8 rounded object-cover"
                  />
                )}
                <span>
                  {bird.commonName}{" "}
                  <span className="text-gray-400 text-sm italic">
                    ({bird.name})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <label className="block font-medium mb-1">
          Location
        </label>

        <div className="flex gap-2">
          <input
            className="w-full border rounded p-2"
            value={location}
            onChange={handleLocationSearch}
            placeholder="Search or detect location"
          />

          <button
            onClick={handleDetectLocation}
            className="px-3 py-2 bg-gray-200 rounded"
          >
            {locationLoading ? "..." : "📍 Detect"}
          </button>
        </div>

        {locationResults.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full shadow max-h-48 overflow-y-auto">
            {locationResults.map((r, i) => (
              <li
                key={i}
                onClick={() => handleSelectLocation(r)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="font-medium">Mint as NFT?</label>

        <button
          onClick={() => setShouldMint(!shouldMint)}
          className={`w-12 h-6 rounded-full transition-colors ${
            shouldMint ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${
              shouldMint ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>

        <span className="text-sm text-gray-500">
          {shouldMint ? "Will mint on BSC" : "Save locally only"}
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Log Sighting"}
      </button>

      {status && (
        <p className="text-sm text-center text-gray-700">{status}</p>
      )}
    </div>
  );
}