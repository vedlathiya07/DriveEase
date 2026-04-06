const axios = require('axios');

async function test() {
  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"="fuel"](around:3000,19.08,72.88);
    );
    out center;
  `;
  try {
    const res = await axios.post("https://overpass-api.de/api/interpreter", query, {
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": "DriveEase/1.0 (Testing Map Service)"
      }
    });
    console.log("Success! places count:", res.data.elements.length);
  } catch (e) {
    if (e.response) {
      console.log("Failed with status:", e.response.status, e.response.data);
    } else {
      console.log("Failed with message:", e.message);
    }
  }
}
test();
