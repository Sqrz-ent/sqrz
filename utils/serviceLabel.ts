import type { Service } from "@/types/service";

function safeCurrency(input?: string) {
  const c = (input || "EUR").toUpperCase().trim();

  // only allow real ISO codes (basic protection)
  if (!/^[A-Z]{3}$/.test(c)) return "EUR";

  return c;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // fallback (never crash the page)
    return `${amount} ${currency}`;
  }
}

export function getServicePriceLabel(service: Service) {
  const currency = safeCurrency(service.currency);

  if (service.price_label) return service.price_label;

  if (service.price_min != null) {
    if (service.price_max != null) {
      return `${formatMoney(service.price_min, currency)} – ${formatMoney(
        service.price_max,
        currency
      )}`;
    }
    return `from ${formatMoney(service.price_min, currency)}`;
  }

  return "Price on request";
}
