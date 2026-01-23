export function getBandsintownArtistFromUrl(url?: string | null) {
  if (!url) return null;

  try {
    const u = new URL(url);

    const path = u.pathname.replace(/^\/+/, "");
    if (!path) return null;

    const parts = path.split("/").filter(Boolean);

    // supports: /a/1234567
    if (parts[0] === "a" && parts[1]) {
      return `a/${parts[1]}`;
    }

    // supports: /Coldplay
    return decodeURIComponent(parts[0]);
  } catch {
    // if user stored only "Coldplay"
    return url.trim();
  }
}
