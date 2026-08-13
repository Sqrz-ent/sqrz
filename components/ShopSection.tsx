// Shop — provider-aware rendering, resolved by profiles.shop_provider.
// soundee: the existing single-link/embed widget, unchanged. gumroad/shopify:
// a small grid of shop_products cards, plain link-out only (no embed script/
// iframe — avoids the multi-script-tag conflict risk flagged for Gumroad's
// own overlay embed). beatstars: display-only addition, plain link-out card
// reusing the soundee_url column (no dedicated input/picker changes — the DB
// value is already there). null/unset: nothing, same convention as every
// other optional widget on this page. Shared by the profile page and private
// link pages (show_shop_widget).
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
      <a
        href={soundeeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={beatstarsCardStyle}
      >
        <BeatStarsIcon />
        <span style={beatstarsLabelStyle}>Shop on BeatStars</span>
      </a>
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

// No official BeatStars logo asset in this repo — a generic play/beat glyph
// stands in as the icon, matching the plain-glyph treatment TikTok's social
// icon already gets above (app/page.tsx) rather than pulling in a brand SVG.
function BeatStarsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/* styles — mirrors Services.tsx's card language (accent color, muted card bg) */

const beatstarsCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  borderRadius: 14,
  background: "#dedede19",
  border: "1px solid #dedede3e",
  color: "rgba(255,255,255,0.92)",
  textDecoration: "none",
  width: "fit-content",
};

const beatstarsLabelStyle = {
  fontSize: 14,
  fontWeight: 600,
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
