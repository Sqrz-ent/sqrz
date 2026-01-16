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

  if (service.instant_booking) {
    if (service.fixedPrice != null) {
      return `${formatMoney(service.fixedPrice, currency)} • Fixed price • Instant booking`;
    }
    return "Instant booking";
  }

  if (service.priceFrom != null) {
    if (service.priceTo != null) {
      return `${formatMoney(service.priceFrom, currency)} – ${formatMoney(
        service.priceTo,
        currency
      )}`;
    }
    return `from ${formatMoney(service.priceFrom, currency)}`;
  }

  return "Price on request";
}
