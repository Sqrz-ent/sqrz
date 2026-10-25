// Spotify link helpers. profiles.widget_spotify holds whatever the artist
// pasted, so accept every common shape:
//   https://open.spotify.com/artist/<id>?si=…
//   https://open.spotify.com/intl-de/track/<id>      (localized share links)
//   https://open.spotify.com/embed/playlist/<id>     (already an embed URL)
//   spotify:album:<id>                               (app "Copy Spotify URI")
const SPOTIFY_TYPES = new Set(["track", "album", "playlist", "artist", "episode", "show"]);

export function parseSpotifyUrl(url: string): { type: string; id: string } | null {
  const trimmed = url.trim();

  const uri = trimmed.match(/^spotify:([a-z]+):([A-Za-z0-9]+)$/);
  if (uri) return SPOTIFY_TYPES.has(uri[1]) ? { type: uri[1], id: uri[2] } : null;

  try {
    const parts = new URL(trimmed).pathname
      .split("/")
      .filter(Boolean)
      .filter((p) => p !== "embed" && !p.startsWith("intl-"));
    if (parts.length < 2) return null;
    const [type, id] = parts;
    return SPOTIFY_TYPES.has(type) ? { type, id } : null;
  } catch {
    return null;
  }
}

export function getSpotifyEmbedUrl(url: string) {
  const parsed = parseSpotifyUrl(url);
  return parsed ? `https://open.spotify.com/embed/${parsed.type}/${parsed.id}` : null;
}

// spotify:<type>:<id> — what the Spotify iFrame API's createController takes.
export function getSpotifyUri(url: string) {
  const parsed = parseSpotifyUrl(url);
  return parsed ? `spotify:${parsed.type}:${parsed.id}` : null;
}
