"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet check error:", err);
      }
    };

    checkWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWalletAddress(accounts[0]);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    router.push("/");
  };

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", background: "#fffdfd", color: "white",  }}>
      <Link href = "/" style = {{ fontWeight: "bold", color: "black" }}>Wingit</Link>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link href="/" style={{ color: "black" }}>Home</Link>
        <Link href="/gallery" style={{ color: "black" }}>Gallery</Link>
        


        {walletAddress ? (
          <>
            <Link href="/addbird" style={{ color: "black" }}>Add Bird</Link>
            <span style={{ fontSize: "12px", color: "black"}}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <button  style={{ color: "black" }} onClick={disconnectWallet}>Disconnect</button>
          </>
        ) : (
          <button  style={{ color: "black" }} onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
    </nav>
  );
}