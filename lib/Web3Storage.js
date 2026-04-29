export async function uploadMetadata({
  species,
  commonName,
  location,
  imageFile,
  iNatData,
}) {
  const metadata = {
    name: `${commonName} Sighting`,
    description: `A WingIt sighting of ${commonName} (${species}) at ${location}`,
    attributes: [
      { trait_type: "Species", value: species },
      { trait_type: "Common Name", value: commonName },
      { trait_type: "Location", value: location },
      { trait_type: "Timestamp", value: new Date().toISOString() },
      { trait_type: "iNaturalist ID", value: String(iNatData.id) },
    ],
  };

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("metadata", JSON.stringify(metadata));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data.uri;
}