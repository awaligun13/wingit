export async function searchBirds(query) {
  const res = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&iconic_taxa=Aves&rank=species&per_page=10`
  );
  const data = await res.json();
  return data.results.map((bird) => ({
    id: bird.id,
    name: bird.name,
    commonName: bird.preferred_common_name || bird.name,
    photoUrl: bird.default_photo?.medium_url || null,
    wikipediaUrl: bird.wikipedia_url || null,
  }));
}