export function getSoundCloudEmbedUrl(url: string) {
  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);

  return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23f3b130&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
}
