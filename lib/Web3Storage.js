import { create } from "@web3-storage/w3up-client";

let client = null;

export async function getClient(){
    if (client){
        return client;
    }
    client = await create();
    return client;
}

export async function uploadMetadata({ species, commonName, location, imageFile, iNatData }) {
  const client = await getClient();

  const imageUpload = await client.uploadFile(imageFile);
  const imageURI = `https://w3s.link/ipfs/${imageUpload}/`;

  const metadata = {
    name: `${commonName} Sighting`,
    description: `A WingIt sighting of ${commonName} (${species}) at ${location}`,
    image: imageURI,
    attributes: [
      { trait_type: "Species", value: species },
      { trait_type: "Common Name", value: commonName },
      { trait_type: "Location", value: location },
      { trait_type: "Timestamp", value: new Date().toISOString() },
      { trait_type: "iNaturalist ID", value: String(iNatData.id) },
    ],
  };
const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  const metadataFile = new File([metadataBlob], "metadata.json");
  const metadataUpload = await client.uploadFile(metadataFile);

  return `https://w3s.link/ipfs/${metadataUpload}/`;
}