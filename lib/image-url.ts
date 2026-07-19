// Converts a raw image URL to an OG-safe URL.
// Supabase-hosted images → render endpoint (600×314, quality=75, correct Content-Type, under 300 KB).
// All other URLs → returned as-is after normalisation.
export function toOgImageUrl(raw: string | null | undefined): string | null {
  const clean = normalizeImageUrl(raw);
  if (!clean) return null;
  if (clean.includes("supabase.co/storage/v1/object/public/")) {
    return (
      clean.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
      "?width=600&height=314&resize=cover&quality=75"
    );
  }
  return clean;
}

// Display-side transform for visible <img> renders: Supabase object URLs →
// render/image endpoint at a bounded width (WebP is auto-negotiated via the
// browser's Accept header; width-only preserves aspect ratio, which the hero
// transform math depends on). Non-Supabase URLs pass through unchanged.
// Must be the LAST function applied to a URL — normalizeImageUrl strips the
// transform if called afterwards.
export function toDisplayImageUrl(
  raw: string | null | undefined,
  width: number,
  quality = 75
): string | null {
  const clean = normalizeImageUrl(raw); // canonicalize first (sign→public, dropbox, protocol)
  if (!clean) return null;
  if (clean.includes("supabase.co/storage/v1/object/public/")) {
    return (
      clean.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
      `?width=${width}&quality=${quality}`
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
