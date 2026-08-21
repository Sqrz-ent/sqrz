// Converts a raw image URL to an OG-safe URL.
// Supabase-hosted images → render endpoint (600×314, quality=75, correct Content-Type, under 300 KB).
// All other URLs → returned as-is after normalisation.
//
// TEMPORARY (2026-08-21): Supabase Image Transformations is disabled on the
// current (Free tier) plan — the render endpoint 403s "FeatureNotEnabled" for
// every request, tenant-wide. og:image has no onError/retry mechanism (a
// crawler either fetches the declared URL or it doesn't — there's no runtime
// signal to fall back on), so this skips the render-endpoint rewrite entirely
// and always returns the raw, untransformed object URL. Full-size images cost
// more bandwidth egress in the meantime. REVERT to the render-endpoint rewrite
// below once Pro is reactivated — do not delete it, just re-enable it.
export function toOgImageUrl(raw: string | null | undefined): string | null {
  const clean = normalizeImageUrl(raw);
  if (!clean) return null;
  return clean;
  // Original behavior, restore once Image Transformations is back:
  // if (clean.includes("supabase.co/storage/v1/object/public/")) {
  //   return (
  //     clean.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
  //     "?width=600&height=314&resize=cover&quality=75"
  //   );
  // }
  // return clean;
}

// Display-side transform for visible <img> renders: Supabase object URLs →
// render/image endpoint. Non-Supabase URLs pass through unchanged. Must be the
// LAST function applied to a URL — normalizeImageUrl strips the transform if
// called afterwards.
//
// ⚠️ Supabase's render endpoint does NOT proportionally scale from `width`
// alone. Given only `width`, it pins the width and KEEPS THE SOURCE HEIGHT,
// horizontally crushing any image whose natural width exceeds `width` (measured:
// a 949×626 source at `width=64` comes back 64×626, not 64×42 — resizing_type
// silently defaults to `fill`). A bare-width request only looked "aspect-safe"
// when width ≥ source width, which made it a no-op; every real downscale was
// distorted. So we ALWAYS send an explicit height + resize mode:
//   resize=contain (default) → fit within width×height, aspect preserved, no
//                              upscale, no crop (letterboxed to the fitted size)
//   resize=cover             → fill width×height exactly, center-cropped
// Square-ish UI (avatars, thumbnails) wants { height, resize: "cover" }; large
// display surfaces (heroes, covers) want the default contain so their own
// object-fit / transform math receives an aspect-correct image.
export function toDisplayImageUrl(
  raw: string | null | undefined,
  width: number,
  opts: { height?: number; resize?: "cover" | "contain"; quality?: number } = {}
): string | null {
  const { height = width, resize = "contain", quality = 75 } = opts;
  const clean = normalizeImageUrl(raw); // canonicalize first (sign→public, dropbox, protocol)
  if (!clean) return null;
  if (clean.includes("supabase.co/storage/v1/object/public/")) {
    return (
      clean.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
      `?width=${width}&height=${height}&resize=${resize}&quality=${quality}`
    );
  }
  return clean;
}

export function normalizeImageUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;

  let value = raw.startsWith("//") ? `https:${raw}` : raw;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;

    if (parsed.hostname.includes("dropbox.com")) {
      parsed.hostname = "dl.dropboxusercontent.com";
      parsed.searchParams.delete("dl");
      parsed.searchParams.set("raw", "1");
      return parsed.toString();
    }

    if (parsed.pathname.includes("/storage/v1/object/sign/")) {
      parsed.pathname = parsed.pathname.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    }

    if (parsed.pathname.includes("/storage/v1/render/image/public/")) {
      parsed.pathname = parsed.pathname.replace("/storage/v1/render/image/public/", "/storage/v1/object/public/");
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
