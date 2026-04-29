"use client";
import { useState, useRef } from "react";
import { searchBirds } from "../../lib/INaturalist";
import { detectLocation, searchLocation } from "../../lib/useLocation";
import { useWingIt } from "../../lib/WingItFunctions";

export default function SightingForm() {
  const { connectWallet, mintSighting } = useWingIt();

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
        species: selectedBird.name,
        commonName: selectedBird.commonName,
        location,
        image: `ipfs://${imageCID}`,
        iNatData: selectedBird,
        timestamp: new Date().toISOString(),
      };

      // 3. Save or mint
      if (shouldMint) {
        setStatus("Connecting wallet...");
        await connectWallet();

        setStatus("Minting NFT...");
        await mintSighting(
          selectedBird.name,
          location,
          metadata.image
        );

        setStatus("Sighting minted successfully!");
      } else {
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
          ...metadata,
          minted: false,
        };

        localStorage.setItem(
          "wingit_drafts",
          JSON.stringify([...existing, draft])
        );

        setStatus("Sighting saved!");
      }

      // reset form
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

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Log a Sighting
      </h1>

      {/* Image upload */}
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

      {/* Bird search */}
      <div className="relative">
        <input
          className="w-full border rounded p-2"
          value={birdQuery}
          onChange={handleBirdSearch}
          placeholder="Search bird"
        />

        {birdResults.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full shadow max-h-48 overflow-y-auto">
            {birdResults.map((bird) => (
              <li
                key={bird.id}
                onClick={() => handleSelectBird(bird)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {bird.commonName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Location */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            className="w-full border rounded p-2"
            value={location}
            onChange={handleLocationSearch}
            placeholder="Location"
          />

          <button
            onClick={handleDetectLocation}
            className="px-3 py-2 bg-gray-200 rounded"
          >
            📍
          </button>
        </div>

        {locationResults.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full shadow max-h-48 overflow-y-auto">
            {locationResults.map((r, i) => (
              <li
                key={i}
                onClick={() => handleSelectLocation(r)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mint toggle */}
      <button
        onClick={() => setShouldMint(!shouldMint)}
        className={`px-4 py-2 rounded ${
          shouldMint ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {shouldMint ? "Mint ON" : "Mint OFF"}
      </button>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {submitting ? "Processing..." : "Log Sighting"}
      </button>

      {status && (
        <p className="text-center text-sm text-gray-600">
          {status}
        </p>
      )}
    </div>
  );
}