"use client";

type BandsintownWidgetProps = { bandsintownUrl: string; };

export default function BandsintownWidget({ bandsintownUrl }: BandsintownWidgetProps) {
  if (!bandsintownUrl) return null;

  const html = `
    <a class="bit-widget-initializer"
      data-artist-name="${bandsintownUrl}"
      data-display-local-dates="false"
      data-display-past-dates="false"
      data-auto-style="true"
      data-language="en"
      data-widget-width="100%"
      data-background-color="transparent">
    </a>
    <script src="https://widget.bandsintown.com/main.min.js" charset="utf-8" async><\/script>
  `;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
