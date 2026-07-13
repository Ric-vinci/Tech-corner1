/** Bank-transfer payment details for buy orders (manual / offline). */
export function bankDetails() {
  return {
    accountName: process.env.BUY_BANK_ACCOUNT_NAME ?? "MTR Group Limited",
    sortCode: process.env.BUY_BANK_SORT_CODE ?? "04-00-04",
    accountNumber: process.env.BUY_BANK_ACCOUNT_NUMBER ?? "00000000",
  };
}

/** A short human reference to quote on the transfer (from the order id). */
export function bankReference(orderId: string): string {
  return "4G-" + orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
}
