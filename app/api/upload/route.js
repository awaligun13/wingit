import { NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY; // e.g. "https://amber-casual-sole-573.mypinata.cloud"

export async function POST(req) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image");
    const metadata = JSON.parse(formData.get("metadata"));

    // 1. Upload image to Pinata
    const imageForm = new FormData();
    imageForm.append("file", imageFile);
    imageForm.append("pinataMetadata", JSON.stringify({ name: `${metadata.name} - image` }));

    const imageRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: imageForm,
    });

    if (!imageRes.ok) {
      const err = await imageRes.text();
      throw new Error(`Image upload failed: ${err}`);
    }

    const { IpfsHash: imageCID } = await imageRes.json();
    const imageURI = `ipfs://${imageCID}`;

    // 2. Upload metadata JSON to Pinata
    const metadataWithImage = {
      ...metadata,
      image: imageURI,
    };

    const metaRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataMetadata: { name: metadata.name },
        pinataContent: metadataWithImage,
      }),
    });

    if (!metaRes.ok) {
      const err = await metaRes.text();
      throw new Error(`Metadata upload failed: ${err}`);
    }

    const { IpfsHash: metadataCID } = await metaRes.json();

    return NextResponse.json({ uri: `ipfs://${metadataCID}` });
  } catch (err) {
    console.error("[api/upload]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}