"use client";
import { useState } from "react";
import { useWingIt } from "../../lib/WingItFunctions";

export default function HomePage() {
  const { connectWallet } = useWingIt();
  const [status, setStatus] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleGetStarted = async () => {
    setConnecting(true);
    try {
      const address = await connectWallet();
      setStatus(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err) {
      setStatus("Could not connect wallet: " + err.message);
    }
    setConnecting(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 py-16">
      <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl w-full">

        {/* Left: Text + CTA */}
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            WingIt
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            WingIt is a decentralized bird sighting logger built on the BSC blockchain.
            Spot a bird, log it, and mint it as an NFT — forever preserved on-chain.
            Whether you're a casual birdwatcher or a seasoned birder, WingIt lets you
            build a verifiable record of every sighting you've ever made.
          </p>

          <div className="flex flex-col items-start gap-3">
            <button
              onClick={handleGetStarted}
              disabled={connecting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-full shadow transition-colors disabled:opacity-50"
            >
              {connecting ? "Connecting..." : "Get Started"}
            </button>

            {status && (
              <p className="text-sm text-gray-500">{status}</p>
            )}

            <p className="text-xs text-gray-400">
              Requires MetaMask · BSC Testnet
            </p>
          </div>
        </div>

        {/* Right: Image */}
        <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center h-80">
          <img
            src="/homeBird.jpg"
            alt="Birds in nature"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = `<p class="text-gray-400 text-sm">Add your image to /public and update the src</p>`;
            }}
          />
        </div>

      </div>
    </main>
  );
}