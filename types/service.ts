export type Service = {
  id: string;
  service: string;
  task: string;
  terms?: string;
  priceFrom?: number;
  priceTo?: number;
  currency?: string;
  instant_booking?: boolean;
  priceFixed?: number;
};
