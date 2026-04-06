import { encodeId, decodeId } from "../utils/idEncoder";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { FiCoffee, FiMapPin, FiTruck } from "react-icons/fi";
import API from "../services/api";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import { formatCurrency } from "../utils/format";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultPosition = [21.1702, 72.8311];
const serviceTypes = [
  { id: "gas_station", label: "Fuel Stations" },
  { id: "cafe", label: "Cafes" },
  { id: "car_wash", label: "Car wash" },
  { id: "charging_station", label: "EV Charging" },
  { id: "hotel", label: "Stay Options" },
];

function MapViewportController({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 12, {
      animate: true,
    });
  }, [map, position]);

  useEffect(() => {
    const refreshMapSize = () => map.invalidateSize();
    const timeoutId = window.setTimeout(refreshMapSize, 180);

    window.addEventListener("resize", refreshMapSize);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", refreshMapSize);
    };
  }, [map]);

  return null;
}

const getCarPosition = (car) => [
  Number(car.locationCoords?.lat) || defaultPosition[0],
  Number(car.locationCoords?.lng) || defaultPosition[1],
];

const userIcon = new L.DivIcon({
  className: "user-location-marker",
  html: `<div style="width: 16px; height: 16px; background-color: #0ea5e9; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const serviceTheme = {
  gas_station: "⛽",
  cafe: "☕",
  car_wash: "🫧",
  charging_station: "⚡",
  hotel: "🏨",
};

const getServiceIcon = (type) =>
  new L.DivIcon({
    className: "service-marker",
    html: `<div style="font-size: 18px; background: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); line-height: 1; text-align: center; border: 1px solid rgba(17,32,51,0.08);">${serviceTheme[type] || "📍"}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export default function ExploreMapPage() {
  const [searchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => console.warn("Location error:", error),
        { enableHighAccuracy: true },
      );
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadCars = async () => {
      try {
        const response = await API.get("/cars");

        if (!ignore) {
          const loadedCars = response.data;
          const requestedCarId = decodeId(searchParams.get("car"));
          const nextSelectedCar =
            loadedCars.find((car) => car._id === requestedCarId) || null;

          setCars(loadedCars);
          setSelectedCar(nextSelectedCar);
        }
      } catch {
        if (!ignore) {
          setCars([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCars();

    return () => {
      ignore = true;
    };
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    const loadServices = async () => {
      let lat, lng;
      if (selectedCar) {
        [lat, lng] = getCarPosition(selectedCar);
      } else if (userLocation) {
        [lat, lng] = userLocation;
      } else {
        setServices([]);
        return;
      }

      try {
        const response = await API.get("/services/nearby", {
          params: { lat, lng, type: "all" },
        });

        const allPlaces = response.data.places || [];

        // Remove potential duplicates
        const uniquePlaces = Array.from(
          new Map(
            allPlaces.map((p) => [`${p.name}-${p.latitude}`, p]),
          ).values(),
        );

        if (!ignore) {
          setServices(uniquePlaces);
        }
      } catch {
        if (!ignore) {
          setServices([]);
        }
      }
    };

    loadServices();

    return () => {
      ignore = true;
    };
  }, [selectedCar, userLocation]);

  if (loading) {
    return <Loader fullHeight label="Loading the live map..." />;
  }

  if (cars.length === 0) {
    return (
      <section className="page-shell">
        <div className="container">
          <EmptyState
            title="No cars to map yet"
            message="Add a few vehicles with city names first and they will appear here automatically."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Explore Cars & Nearby Services
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
            View available cars on a live map, discover nearby essentials like
            fuel stations, charging points, cafes, and more — all in real time.
          </p>
        </div>

        <div className="map-layout">
          <div className="map-surface">
            <MapContainer
              center={
                selectedCar
                  ? getCarPosition(selectedCar)
                  : userLocation || defaultPosition
              }
              zoom={12}
              className="fleet-map"
            >
              <MapViewportController
                position={
                  selectedCar
                    ? getCarPosition(selectedCar)
                    : userLocation || defaultPosition
                }
              />
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={userIcon}
                  eventHandlers={{
                    click: () => setSelectedCar(null),
                  }}
                >
                  <Popup>
                    <strong>Your Location</strong>
                  </Popup>
                </Marker>
              )}
              {services.map((service) => (
                <Marker
                  key={`${service.name}-${service.latitude}`}
                  position={[service.latitude, service.longitude]}
                  icon={getServiceIcon(service.type)}
                >
                  <Popup>
                    <strong>{service.name}</strong>
                  </Popup>
                </Marker>
              ))}
              {cars.map((car) => (
                <Marker
                  key={car._id}
                  position={getCarPosition(car)}
                  eventHandlers={{
                    click: () => setSelectedCar(car),
                  }}
                >
                  <Popup>
                    <strong>{car.title}</strong>
                    <p>{formatCurrency(car.pricePerDay)} / day</p>
                    <p>{car.availabilityStatus || "Available"}</p>
                    <Link to={`/car/${encodeId(car._id)}`}>View details</Link>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <aside className="detail-card map-sidebar">
            <h2>
              {selectedCar
                ? selectedCar.title
                : userLocation
                  ? "What's Around You"
                  : "Select a car"}
            </h2>
            {selectedCar ? (
              <>
                <div className="map-meta">
                  <span
                    className={
                      selectedCar.availabilityStatus === "Available"
                        ? "status-chip available"
                        : selectedCar.availabilityStatus === "Booked"
                          ? "status-chip booked"
                          : "status-chip"
                    }
                  >
                    {selectedCar.availabilityStatus || "Available"}
                  </span>
                  <span className="small-chip">
                    {formatCurrency(selectedCar.pricePerDay)} / day
                  </span>
                </div>
                <p className="muted-line">{selectedCar.location}</p>
              </>
            ) : userLocation ? (
              <p className="muted-line">
                Access nearby facilities and services based on your current
                location. Select any map marker to view car details or explore
                nearby amenities.
              </p>
            ) : (
              <p className="muted-line">
                Tap a marker to inspect the vehicle and nearby services.
              </p>
            )}

            <div className="choice-grid" style={{ pointerEvents: "none" }}>
              {serviceTypes.map((item) => (
                <button key={item.id} type="button" className="choice-chip">
                  {serviceTheme[item.id]} {item.label}
                </button>
              ))}
            </div>

            <div className="stack-list">
              {services.map((service) => (
                <div
                  key={`${service.name}-${service.latitude}`}
                  className="list-row stacked-row"
                >
                  <strong>
                    {serviceTheme[service.type] || "📍"} {service.name}
                  </strong>
                  <span>
                    <FiMapPin /> {service.latitude.toFixed(4)},{" "}
                    {service.longitude.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>

            {selectedCar ? (
              <div className="hero-actions">
                <Link
                  to={`/car/${encodeId(selectedCar._id)}`}
                  className="btn btn-primary"
                >
                  <FiTruck />
                  Open vehicle page
                </Link>
                {selectedCar.canBook !== false ? (
                  <Link
                    to={`/booking/${encodeId(selectedCar._id)}`}
                    className="btn btn-outline-light"
                  >
                    <FiCoffee />
                    {selectedCar.availabilityStatus === "Booked"
                      ? "Check dates"
                      : "Start booking"}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
