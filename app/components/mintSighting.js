// components/MintSighting.jsx
import { useState } from "react";
import { useWingIt } from "../lib/useWingIt";

export default function MintSighting() {
  const { connectWallet, mintSighting } = useWingIt();
  const [wallet, setWallet] = useState(null);
  const [status, setStatus] = useState("");

  const handleConnect = async () => {
    const address = await connectWallet();
    setWallet(address);
  };

  const handleMint = async () => {
    setStatus("Minting...");
    try {
      await mintSighting("American Robin", "Central Park", "https://yourmetadata.com/1.json");
      setStatus("Minted successfully!");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  return (
    <div>
      {!wallet ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <>
          <p>Connected: {wallet}</p>
          <button onClick={handleMint}>Mint Sighting</button>
          <p>{status}</p>
        </>
      )}
    </div>
  );
}