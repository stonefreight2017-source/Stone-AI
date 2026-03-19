/**
 * ZIP Code Lookup — Stone AI
 *
 * Thin wrapper around zipcodes-us for resolving ZIP codes to city/state/coordinates.
 * Used by the chat route to enhance location-based search queries.
 */

import zipcodes from "zipcodes-us";

export interface ZipInfo {
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
}

/**
 * Look up a US ZIP code and return city, state, and coordinates.
 * Returns null if the ZIP code is invalid or not found.
 */
export function lookupZip(zip: string): ZipInfo | null {
  const result = zipcodes.find(zip);
  if (!result.isValid) return null;

  return {
    city: result.city,
    state: result.state,
    stateCode: result.stateCode,
    lat: result.latitude,
    lng: result.longitude,
  };
}
