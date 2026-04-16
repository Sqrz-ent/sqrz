export type Service = {
  id: string;
  title: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  price_label?: string;
  currency?: string;
  booking_type?: "instant" | "quote";
  instant_price?: number;
  instant_currency?: string;
  instant_tax_rate?: number | null;
};
