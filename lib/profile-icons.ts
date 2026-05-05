const DEFAULT_FAVICON = "/brand/sqrz_logo.png";

export function getProfileIconUrl(avatarUrl: string | null | undefined): string {
  if (
    avatarUrl &&
    avatarUrl.startsWith("https") &&
    !avatarUrl.includes("placeholder.") &&
    !avatarUrl.includes("placeholder.sqrz")
  ) {
    return avatarUrl;
  }

  return DEFAULT_FAVICON;
}
