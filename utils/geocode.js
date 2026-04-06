const axios = require("axios");

const LOCATION_CATALOG = [
  { aliases: ["vadodara", "vadodra", "baroda"], lat: 22.3072, lng: 73.1812 },
  { aliases: ["ahmedabad", "amdavad"], lat: 23.0225, lng: 72.5714 },
  { aliases: ["surat"], lat: 21.1702, lng: 72.8311 },
  { aliases: ["rajkot"], lat: 22.3039, lng: 70.8022 },
  { aliases: ["gandhinagar"], lat: 23.2156, lng: 72.6369 },
  { aliases: ["anand"], lat: 22.5645, lng: 72.9289 },
  { aliases: ["bharuch"], lat: 21.7051, lng: 72.9959 },
  { aliases: ["bhavnagar"], lat: 21.7645, lng: 72.1519 },
  { aliases: ["junagadh"], lat: 21.5222, lng: 70.4579 },
  { aliases: ["mumbai", "bombay"], lat: 19.076, lng: 72.8777 },
  { aliases: ["pune"], lat: 18.5204, lng: 73.8567 },
  { aliases: ["delhi", "new delhi"], lat: 28.6139, lng: 77.209 },
  { aliases: ["bangalore", "bengaluru"], lat: 12.9716, lng: 77.5946 },
  { aliases: ["hyderabad"], lat: 17.385, lng: 78.4867 },
  { aliases: ["chennai"], lat: 13.0827, lng: 80.2707 },
  { aliases: ["kolkata", "calcutta"], lat: 22.5726, lng: 88.3639 },
  { aliases: ["jaipur"], lat: 26.9124, lng: 75.7873 },
  { aliases: ["goa", "panaji"], lat: 15.4909, lng: 73.8278 },
];

const normalizeLocation = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const lookupCatalogCoords = (location) => {
  const normalizedLocation = normalizeLocation(location);

  if (!normalizedLocation) {
    return null;
  }

  const match = LOCATION_CATALOG.find((entry) =>
    entry.aliases.some((alias) => normalizedLocation.includes(alias)),
  );

  return match
    ? {
        lat: match.lat,
        lng: match.lng,
        source: "catalog",
      }
    : null;
};

const geocodeWithNominatim = async (location) => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: location,
          format: "jsonv2",
          limit: 1,
          countrycodes: "in",
        },
        headers: {
          "User-Agent": "DriveEase/1.0 (codex geocoding)",
        },
        timeout: 4500,
      },
    );

    const result = response.data?.[0];

    if (!result) {
      return null;
    }

    return {
      lat: Number(result.lat),
      lng: Number(result.lon),
      source: "nominatim",
    };
  } catch (error) {
    return null;
  }
};

const resolveLocationCoords = async (location) => {
  if (!String(location || "").trim()) {
    return null;
  }

  const catalogMatch = lookupCatalogCoords(location);

  if (catalogMatch) {
    return catalogMatch;
  }

  return geocodeWithNominatim(location);
};

module.exports = {
  resolveLocationCoords,
};
