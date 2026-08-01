// TEMPORARY / TEST-ONLY — trying out whether an embedded Soundee storefront
// reads well on the profile, placed directly under the SoundCloud widget.
// Hardcoded to Will's own storefront on purpose: no dynamic field, no
// dashboard input, no provider/resolver integration — not the final
// commerce-provider pattern, just a quick look at it live. Keep, iterate, or
// delete this file after reviewing.
export default function SoundeeEmbed() {
  return (
    <iframe
      src="https://soundee.com/willvilla/playlists/sqrz-beats"
      width="100%"
      height="550"
      title="Soundee storefront"
    />
  );
}
