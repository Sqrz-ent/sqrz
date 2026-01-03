export function getSpotifyEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts.length < 2) return null;

    const [type, id] = parts;

    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    return null;
  }
}

