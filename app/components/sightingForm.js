"use client";
import { useState, useRef } from "react";
import { searchBirds } from "../../lib/INaturalist";
import { uploadMetadata } from "../../lib/Web3Storage";
import { detectLocation, searchLocation } from "../../lib/useLocation";
import { useWingIt } from "../../lib/WingItFunctions";

export default function SightingForm(){
    const {connectWallet, mintSighting} = useWingIt();
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
        setBirdResults(results)
        setBirdLoading(false);
    }, 400);
  }
  const handleSelectBird = (bird) =>{
    setSelectedBird(bird);
    setBirdQuery(bird.commonName);
    setBirdResults([]);
  }
  
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


const handleLocationSearch = async(e) => {
    const q = e.target.value;
    setLocation(q);
    if (q.length < 3){
        return setLocationResults([]);
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
        const results = await searchLocation(q);
        setLocationResults(results)
        }, 400);
    };
    const handleSelectLocation =(results) => {
        setLocation(results.display_name);
        setLocationResults([]);
    }
    const handleSubmit = async() => {
        if (!image){
            return setStatus("Please upload an image");
        }
        if (!selectedBird){
            return setStatus("Please select a bird");
        }
        if (!location){
            return setStatus("Please enter a location");
        }
        setSubmitting(true);
        setStatus("Uploading to IFPS....");

        try{
            const metadataURI = await uploadMetadata({
        species: selectedBird.name,
        commonName: selectedBird.commonName,
        location,
        imageFile: image,
        iNatData: selectedBird,
        });
        if (shouldMint) {
        setStatus("Connecting wallet...");
        await connectWallet();
        setStatus("Minting NFT...");
        await mintSighting(selectedBird.name, location, metadataURI);
        setStatus("Sighting minted successfully!");
      } else {
        const draft = {
          id: Date.now(),
          species: selectedBird.name,
          commonName: selectedBird.commonName,
          location,
          metadataURI,
          timestamp: new Date().toISOString(),
          minted: false,
        };
        const existing = JSON.parse(localStorage.getItem("wingit_drafts") || "[]");
        localStorage.setItem("wingit_drafts", JSON.stringify([...existing, draft]));
        setStatus("Sighting saved!");
      }
    } catch (err) {
      setStatus("Error: " + err.message);
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Log a Sighting</h1>

      <div>
        <label className="block font-medium mb-1">Upload Photo</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && <img src={imagePreview} className="mt-2 rounded w-full max-h-48 object-cover" />}
      </div>


      <div className="relative">
        <label className="block font-medium mb-1">Search Bird</label>
        <input
          className="w-full border rounded p-2"
          value={birdQuery}
          onChange={handleBirdSearch}
          placeholder="e.g. American Robin"
        />
        {birdLoading && <p className="text-sm text-gray-500">Searching...</p>}
        {birdResults.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded w-full shadow max-h-48 overflow-y-auto">
            {birdResults.map((bird) => (
              <li
                key={bird.id}
                onClick={() => handleSelectBird(bird)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
              >
                {bird.photoUrl && <img src={bird.photoUrl} className="w-8 h-8 rounded object-cover" />}
                <span>{bird.commonName} <span className="text-gray-400 text-sm italic">({bird.name})</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <label className="block font-medium mb-1">Location</label>
        <div className="flex gap-2">
          <input
            className="w-full border rounded p-2"
            value={location}
            onChange={handleLocationSearch}
            placeholder="Search or detect location"
          />
          <button
            onClick={handleDetectLocation}
            className="px-3 py-2 bg-gray-200 rounded text-sm"
          >
            {locationLoading ? "..." : "📍 Detect"}
          </button>
        </div>
        {locationResults.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded w-full shadow max-h-48 overflow-y-auto">
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
          className={`w-12 h-6 rounded-full transition-colors ${shouldMint ? "bg-green-500" : "bg-gray-300"}`}
        >
          <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${shouldMint ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className="text-sm text-gray-500">{shouldMint ? "Will mint on BSC" : "Save locally only"}</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Log Sighting"}
      </button>

      {status && <p className="text-sm text-center text-gray-700">{status}</p>}
    </div>
  );
}