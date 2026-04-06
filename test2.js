const axios = require('axios');
const fs = require('fs');

async function test() {
  const query = `
    [out:json][timeout:10];
    (
      nwr["amenity"="fuel"](around:2000,21.2546,72.8797);
    );
    out center;
  `;
  try {
    const res = await axios.post("https://overpass-api.de/api/interpreter", "data=" + encodeURIComponent(query), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "DriveEaseApp/1.0"
      }
    });
    fs.writeFileSync('test-output.json', JSON.stringify({ success: true, count: res.data.elements.length, first: res.data.elements[0] }, null, 2));
  } catch (e) {
    fs.writeFileSync('test-output.json', JSON.stringify({ success: false, error: e.message, status: e.response ? e.response.status : null }, null, 2));
  }
}
test();
