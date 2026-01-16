import type { Service } from "@/types/service";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getServicePriceLabel(service: Service) {
  const currency = service.currency || "EUR";

  // Instant booking (fixed price preferred)
  if (service.instant_booking) {
    if (service.fixedPrice != null) {
      return `${formatMoney(service.fixedPrice, currency)} • Fixed price • Instant booking`;
    }
    return "Instant booking";
  }

  // Range pricing
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
