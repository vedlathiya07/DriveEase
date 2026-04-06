const axios = require('axios');

async function test() {
  const query = `
    [out:json];
    (
      node["amenity"="fuel"](around:3000,19.08,72.88);
      node["amenity"="cafe"](around:3000,19.08,72.88);
      node["amenity"="car_wash"](around:3000,19.08,72.88);
      node["amenity"="charging_station"](around:3000,19.08,72.88);
    );
    out;
  `;
  try {
    const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    console.log("Success! places:", res.data.elements.length);
  } catch (e) {
    console.log("Failed:", e.message);
  }
}
test();
