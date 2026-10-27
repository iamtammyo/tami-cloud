// Turns reverse-geocoder responses into "Neighbourhood, City".
// Falls back to just the city, then to an empty string the user fills in.

export function roundKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function join(neighbourhood?: string, city?: string) {
  const parts = [neighbourhood, city].map((s) => s?.trim()).filter(Boolean) as string[];
  if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) return parts[1];
  return parts.join(", ");
}

type NominatimAddress = Partial<
  Record<"neighbourhood" | "suburb" | "quarter" | "city_district" | "village" | "hamlet" | "city" | "town" | "municipality" | "county" | "state", string>
>;

export function formatNominatim(json: { address?: NominatimAddress } | null | undefined): string {
  const a = json?.address;
  if (!a) return "";
  const city = a.city ?? a.town ?? a.municipality ?? a.village ?? a.county ?? a.state;
  const neighbourhood = a.neighbourhood ?? a.quarter ?? a.suburb ?? a.city_district ?? a.hamlet;
  return join(neighbourhood !== city ? neighbourhood : undefined, city);
}

export function formatBigDataCloud(
  json: { locality?: string; city?: string; principalSubdivision?: string } | null | undefined,
): string {
  if (!json) return "";
  const city = json.city || json.principalSubdivision || "";
  const neighbourhood = json.locality && json.locality !== city ? json.locality : undefined;
  return join(neighbourhood, city);
}
