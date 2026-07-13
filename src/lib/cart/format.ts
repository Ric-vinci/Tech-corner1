export function formatGbp(amount: number) {
  return `£${amount.toFixed(2)}`;
}

export function formatGbpCompact(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `£${rounded}` : `£${rounded.toFixed(2)}`;
}

export function formatGbpTotal(amount: number) {
  return `£${amount.toFixed(2)}`;
}

export function itemLineTotal(unitPrice: number, quantity: number) {
  return unitPrice * quantity;
}
