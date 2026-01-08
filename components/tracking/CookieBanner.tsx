if (!consentExists) {
  showBanner()
}

onAcceptAll() {
  setConsent({
    analytics: true,
    marketing: true,
  })
}

onReject() {
  setConsent({
    analytics: false,
    marketing: false,
  })
}
