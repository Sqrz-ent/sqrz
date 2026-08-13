// Shop — provider-aware rendering, resolved by profiles.shop_provider.
// soundee: the existing single-link/embed widget, unchanged. gumroad/shopify:
// a small grid of shop_products cards, plain link-out only (no embed script/
// iframe — avoids the multi-script-tag conflict risk flagged for Gumroad's
// own overlay embed). beatstars: reuses the soundee_url column, same as
// soundee — but note that column must hold BeatStars' *player embed* URL
// (https://player.beatstars.com/?storeId=<id>, from the artist's Studio →
// Players embed-code generator), not the storefront homepage URL
// (username.beatstars.com) — BeatStars has no documented way to derive one
// from the other, confirmed against their own docs before implementing.
// null/unset: nothing, same convention as every other optional widget on
// this page. Shared by the profile page and private link pages
// (show_shop_widget).
import SoundeeEmbed from "./SoundeeEmbed";

export type ShopProduct = {
  id: string;
  title: string;
  image_url: string | null;
  price: number | string | null;
  currency: string | null;
  buy_url: string;
};

function formatPrice(price: number | string | null, currency: string | null): string | null {
  if (price == null) return null;
  const amount = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(amount)) return null;
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount} ${currency.toUpperCase()}`;
    }
  }
  return amount.toFixed(2);
}

function ProductCard({ product }: { product: ShopProduct }) {
  const price = formatPrice(product.price, product.currency);

  return (
    <div style={cardStyle}>
      {product.image_url ? (
        <img src={product.image_url} alt={product.title} style={imageStyle} />
      ) : (
        <div style={imagePlaceholderStyle} />
      )}
      <div style={cardBodyStyle}>
        <span style={titleStyle}>{product.title}</span>
        {price && <span style={priceStyle}>{price}</span>}
        <a
          href={product.buy_url}
          target="_blank"
          rel="noopener noreferrer"
          style={buyButtonStyle}
        >
          Buy Now
        </a>
      </div>
    </div>
  );
}

export default function ShopSection({
  provider,
  soundeeUrl,
  products,
}: {
  provider: string | null;
  soundeeUrl: string | null;
  products: ShopProduct[];
}) {
  if (!provider) return null;

  if (provider === "soundee") {
    return <SoundeeEmbed url={soundeeUrl} />;
  }

  if (provider === "beatstars") {
    if (!soundeeUrl) return null;
    return (
      <iframe
        src={soundeeUrl}
        title="BeatStars store"
        width="100%"
        height="500"
        style={embedStyle}
      />
    );
  }

  if (provider === "gumroad" || provider === "shopify") {
    if (!products.length) return null;
    return (
      <div style={gridStyle}>
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }

  return null;
}

/* styles — mirrors Services.tsx's card language (accent color, muted card bg) */

// Matches MusicEmbeds.tsx's iframe treatment (no frame border, same
// borderRadius as its Mixcloud embed) for visual consistency across the
// profile's embedded-media sections.
const embedStyle = {
  border: "none",
  borderRadius: 8,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 14,
};

const cardStyle = {
  background: "#dedede19",
  border: "1px solid #dedede3e",
  borderRadius: 14,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
};

const imageStyle = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover" as const,
  display: "block",
};

const imagePlaceholderStyle = {
  width: "100%",
  aspectRatio: "1 / 1",
  background: "#dedede0f",
};

const cardBodyStyle = {
  padding: 12,
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
};

const titleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "rgba(255,255,255,0.92)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const priceStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--accent-color, #F5A623)",
};

const buyButtonStyle = {
  marginTop: 4,
  padding: "8px 12px",
  borderRadius: 20,
  border: "none",
  background: "var(--accent-color, #F5A623)",
  color: "#000",
  fontWeight: 600,
  fontSize: 13,
  textAlign: "center" as const,
  textDecoration: "none",
  cursor: "pointer",
};
