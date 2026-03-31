export function getBandsintownArtistFromUrl(url?: string | null) {
  if (!url) return null;
  if (url.includes("bandsintown.com/a/")) {
    return url.split("/a/")[1].split("?")[0].split("/")[0];
  }
  return url.trim();
}
