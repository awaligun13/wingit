import { ethers } from "ethers";
import WingItABI from "./WingItABI.json";

const CONTRACT_ADDRESS = "0xYourDeployedAddressHere";

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
    await window.ethereum.request({ method: "eth_requestAccounts" });
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