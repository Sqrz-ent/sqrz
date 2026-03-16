export type Service = {
  id: string;
  title: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  price_label?: string;
  currency?: string;
};
