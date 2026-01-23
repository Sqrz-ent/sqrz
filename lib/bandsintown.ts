export function getBandsintownArtistFromUrl(url?: string | null) {
  if (!url) return null;

  try {
    const u = new URL(url);

    // Example paths:
    // /Coldplay
    // /a/1234567
    const path = u.pathname.replace(/^\/+/, ""); // remove leading "/"

    if (!path) return null;

    const parts = path.split("/").filter(Boolean);

    // If URL is /a/1234567 => return "a/1234567"
    if (parts[0] === "a" && parts[1]) {
      return `a/${parts[1]}`;
    }

    // Otherwise assume it's /ArtistName => return "ArtistName"
    return decodeURIComponent(parts[0]);
  } catch (e) {
    // If it's not a valid URL, maybe user saved just "Coldplay"
    return url.trim();
  }
}
