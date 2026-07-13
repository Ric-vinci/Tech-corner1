export type ShippingAddress = {
  firstName: string;
  lastName: string;
  company?: string;
  street: string[];
  city: string;
  region: string;
  postcode: string;
  countryId: string;
  countryName: string;
  telephone: string;
};

const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom",
  IE: "Ireland",
};

export function countryName(countryId: string): string {
  return COUNTRY_NAMES[countryId] ?? countryId;
}

export function formatShippingAddressLines(address: ShippingAddress): string[] {
  const lines: string[] = [];
  const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
  if (name) lines.push(name);
  if (address.company) lines.push(address.company);
  const street = address.street.filter(Boolean).join(", ");
  if (street) lines.push(street);
  const cityLine = [address.city, address.region, address.postcode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  lines.push(address.countryName);
  if (address.telephone) lines.push(address.telephone);
  return lines;
}

export function validateShippingAddress(input: Partial<ShippingAddress>): string | null {
  if (!input.firstName?.trim()) return "First name is required";
  if (!input.lastName?.trim()) return "Last name is required";
  if (!input.street?.[0]?.trim()) return "Street address is required";
  if (!input.city?.trim()) return "City is required";
  if (!input.region?.trim()) return "County / province is required";
  if (!input.postcode?.trim()) return "Postcode is required";
  if (!input.countryId?.trim()) return "Country is required";
  if (!input.telephone?.trim()) return "Phone number is required";
  const digits = input.telephone.replace(/\D/g, "");
  if (digits.length < 10) return "Please enter a valid phone number";
  return null;
}

export function normalizeShippingAddress(input: Partial<ShippingAddress>): ShippingAddress {
  const countryId = (input.countryId ?? "GB").trim().toUpperCase();
  return {
    firstName: input.firstName?.trim() ?? "",
    lastName: input.lastName?.trim() ?? "",
    company: input.company?.trim() || undefined,
    street: [input.street?.[0]?.trim() ?? "", input.street?.[1]?.trim() ?? ""].filter((line, i) => i === 0 || line),
    city: input.city?.trim() ?? "",
    region: input.region?.trim() ?? "",
    postcode: input.postcode?.trim() ?? "",
    countryId,
    countryName: countryName(countryId),
    telephone: input.telephone?.trim() ?? "",
  };
}
