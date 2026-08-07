// Soundee storefront widget — plain per-profile URL field (profiles.soundee_url),
// same pattern as the SoundCloud/Spotify widget inputs. Renders only when the
// artist has set one, same conditional convention as every other widget.
export default function SoundeeEmbed({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <iframe
      src={url}
      width="100%"
      height="550"
      title="Soundee storefront"
    />
  );
}
