import { encodeId } from "../utils/idEncoder";
/* eslint-disable */
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import API from "../services/api";
import "leaflet/dist/leaflet.css";
import "./CarMap.css";

export default function CarMap() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await API.get("/cars");
      setCars(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="map-page">
      <MapContainer center={[21.1702, 72.8311]} zoom={12} className="map">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {cars.map((car) => (
          <Marker
            key={car._id}
            position={[
              car.locationCoords?.lat || 21.17,
              car.locationCoords?.lng || 72.83,
            ]}
          >
            <Popup>
              <h6>{car.title}</h6>
              <p>₹{car.pricePerDay}/day</p>
              <Link to={`/car/${encodeId(car._id)}`} className="btn btn-sm btn-primary">
                View
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
