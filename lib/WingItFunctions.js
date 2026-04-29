import { ethers } from "ethers";
import WingItABI from "./WingItABI.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export function useWingIt() {
  const getContract = async (withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, WingItABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, WingItABI, provider);
  };

  const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const BSC_TESTNET = {
    chainId: "0x61",
    chainName: "BSC Testnet",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"],
  };

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_TESTNET.chainId }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BSC_TESTNET],
      });
    } else {
      throw err;
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer.getAddress();
};
  const mintSighting = async (species, location, metadataURI) => {
    const contract = await getContract(true);
    const tx = await contract.mintSighting(species, location, metadataURI);
    await tx.wait(); // waits for confirmation
    return tx;
  };

  const getSighting = async (tokenId) => {
    const contract = await getContract();
    return contract.getSighting(tokenId);
  };

  const getSightingsByBirder = async (address) => {
    const contract = await getContract();
    return contract.getSightingsbyBirder(address);
  };

  const totalSightings = async () => {
    const contract = await getContract();
    return contract.totalSightings();
  };

  return { connectWallet, mintSighting, getSighting, getSightingsByBirder, totalSightings };
}