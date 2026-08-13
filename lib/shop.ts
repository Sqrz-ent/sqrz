import { supabase } from "@/lib/supabase";
import type { ShopProduct } from "@/components/ShopSection";

// Shared by app/page.tsx (profile page) and app/[slug]/page.tsx (private link
// pages) — only fetched for gumroad/shopify profiles; beatstars needs no
// separate query (driven by profiles.beatstars_url, already in the main select).
export async function getShopProducts(profileId: string): Promise<ShopProduct[]> {
  const { data } = await supabase
    .from("shop_products")
    .select("id, title, image_url, price, currency, buy_url, position")
    .eq("profile_id", profileId)
    .order("position", { ascending: true })
    .limit(4);

  return (data as ShopProduct[] | null) ?? [];
}
