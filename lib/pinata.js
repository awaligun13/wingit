export const uploadMetadataToPinata = async (metadata) => {
  const res = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Metadata upload failed: " + err);
  }

  const data = await res.json();
  return data.IpfsHash;
};