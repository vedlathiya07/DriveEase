// =====================================
// NEARBY SERVICES (MAP FEATURE - GEOAPIFY)
// =====================================

const express = require("express");
const router = express.Router();
const axios = require("axios");

// Demo fallback names
const demoServiceNames = {
  gas_station: [
    "DriveEase Fuel Point",
    "Highway Energy Hub",
    "City Petrol Station",
    "Rapid Refuel Center",
  ],
  cafe: [
    "Roadside Brew Cafe",
    "Pitstop Coffee House",
    "DriveEase Lounge Cafe",
    "Highway Beans",
  ],
  car_wash: [
    "Spark Auto Spa",
    "Quick Wash Bay",
    "Gloss Garage",
    "Shine and Roll",
  ],
  charging_station: [
    "ChargePoint Hub",
    "VoltStop Station",
    "Rapid EV Dock",
    "GreenRoute Charging",
  ],
  hotel: [
    "Grand Horizon Inn",
    "Comfort Suites DriveEase",
    "Highway Rest Motel",
    "Voyager Luxury Stay",
  ],
};

// Demo generator
const buildDemoPlaces = (lat, lng, type) => {
  const offsets = [
    { latOffset: 0.0082, lngOffset: 0.0043 },
    { latOffset: -0.0061, lngOffset: 0.0058 },
    { latOffset: 0.0049, lngOffset: -0.0074 },
    { latOffset: -0.0053, lngOffset: -0.0062 },
  ];

  return (demoServiceNames[type] || demoServiceNames.gas_station).map(
    (name, index) => ({
      name,
      latitude: Number((lat + offsets[index].latOffset).toFixed(6)),
      longitude: Number((lng + offsets[index].lngOffset).toFixed(6)),
      type,
      demo: true,
    }),
  );
};

// =====================================
// GET NEARBY SERVICES (GEOAPIFY)
// =====================================
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, type } = req.query;

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (!lat || !lng || !type) {
      return res.status(400).json({
        success: false,
        message: "lat, lng and type are required",
      });
    }

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      return res.status(400).json({
        success: false,
        message: "lat and lng must be valid coordinates",
      });
    }

    // Geoapify category mapping
    const categoryMap = {
      gas_station: "service.vehicle.fuel",
      cafe: "catering.cafe",
      car_wash: "service.vehicle.car_wash",
      charging_station: "service.vehicle.charging_station",
      hotel: "accommodation.hotel",
    };

    let categories =
      type === "all" ? Object.values(categoryMap).join(",") : categoryMap[type];

    if (!categories) {
      return res.status(400).json({
        success: false,
        message: "Unsupported type",
      });
    }

    const API_KEY = process.env.GEOAPIFY_API_KEY;

    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${parsedLng},${parsedLat},3000&limit=20&apiKey=${API_KEY}`;

    let results = [];

    try {
      const response = await axios.get(url);

      results = (response.data.features || []).map((place) => {
        const props = place.properties;

        let detectedType = "other";

        if (props.categories?.some((c) => c.includes("fuel")))
          detectedType = "gas_station";
        else if (props.categories?.some((c) => c.includes("cafe")))
          detectedType = "cafe";
        else if (props.categories?.some((c) => c.includes("car_wash")))
          detectedType = "car_wash";
        else if (props.categories?.some((c) => c.includes("charging")))
          detectedType = "charging_station";
        else if (props.categories?.some((c) => c.includes("hotel")))
          detectedType = "hotel";

        return {
          name: props.name || "Unnamed Place",
          latitude: place.geometry.coordinates[1],
          longitude: place.geometry.coordinates[0],
          type: detectedType,
        };
      });
    } catch (error) {
      console.warn("Geoapify failed, using demo fallback:", error.message);

      if (type === "all") {
        results = [
          ...buildDemoPlaces(parsedLat, parsedLng, "gas_station"),
          ...buildDemoPlaces(parsedLat, parsedLng, "cafe"),
          ...buildDemoPlaces(parsedLat, parsedLng, "car_wash"),
          ...buildDemoPlaces(parsedLat, parsedLng, "charging_station"),
          ...buildDemoPlaces(parsedLat, parsedLng, "hotel"),
        ];
      } else {
        results = buildDemoPlaces(parsedLat, parsedLng, type);
      }
    }

    if (results.length === 0) {
      if (type === "all") {
        results = [
          ...buildDemoPlaces(parsedLat, parsedLng, "gas_station"),
          ...buildDemoPlaces(parsedLat, parsedLng, "cafe"),
          ...buildDemoPlaces(parsedLat, parsedLng, "car_wash"),
          ...buildDemoPlaces(parsedLat, parsedLng, "charging_station"),
          ...buildDemoPlaces(parsedLat, parsedLng, "hotel"),
        ];
      } else {
        results = buildDemoPlaces(parsedLat, parsedLng, type);
      }
    }

    res.json({
      success: true,
      count: results.length,
      places: results,
      source: results.some((p) => p.demo) ? "demo-fallback" : "geoapify",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
