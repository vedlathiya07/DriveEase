import { useEffect, useState } from "react";
import { FiRefreshCcw, FiSearch, FiMapPin } from "react-icons/fi";
import API from "../services/api";
import VehicleCard from "../components/VehicleCard";

const initialFilters = {
  search: "",
  location: "",
  fuelType: "",
  category: "",
  maxPrice: "",
};

export default function FleetPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("");

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await response.json();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.state ||
              "Surat";

            const nextFilters = { ...filters, location: city };
            setFilters(nextFilters);
            fetchCars(nextFilters);
          } catch (error) {
            console.error("Error fetching location", error);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
        },
      );
    }
  };

  const getSortedCars = () => {
    return [...cars].sort((a, b) => {
      if (sortBy === "price-asc")
        return (a.pricePerDay || 0) - (b.pricePerDay || 0);
      if (sortBy === "price-desc")
        return (b.pricePerDay || 0) - (a.pricePerDay || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "availability") {
        const aAvail =
          a.availabilityStatus === "Available" || a.isAvailable ? 1 : 0;
        const bAvail =
          b.availabilityStatus === "Available" || b.isAvailable ? 1 : 0;
        return bAvail - aAvail;
      }
      return 0;
    });
  };

  const sortedCarsList = getSortedCars();

  const requestCars = async (activeFilters) => {
    const response = await API.get("/cars", {
      params: activeFilters,
    });

    return response.data;
  };

  const fetchCars = async (activeFilters = filters) => {
    try {
      setLoading(true);
      const nextCars = await requestCars(activeFilters);
      setCars(nextCars);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialCars = async () => {
      try {
        const nextCars = await requestCars(initialFilters);

        if (!ignore) {
          setCars(nextCars);
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

    loadInitialCars();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (event) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchCars(filters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    fetchCars(initialFilters);
  };

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Find Your Perfect Ride
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
            Search, filter, and compare cars based on your needs — from daily
            commutes to premium experiences, all with real-time availability.
          </p>
        </div>

        <form className="filter-panel" onSubmit={handleSubmit}>
          <div className="filter-grid">
            <label>
              Search Cars
              <input
                name="search"
                value={filters.search}
                onChange={handleChange}
                placeholder="Try “SUV”, “Electric”, “Luxury”, or car name…"
              />
            </label>
            <label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <span>Pickup Location</span>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  title="Auto-fetch user location"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand-primary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.85rem",
                    padding: 0,
                  }}
                >
                  <FiMapPin /> Use My Location
                </button>
              </div>
              <input
                name="location"
                value={filters.location}
                onChange={handleChange}
                placeholder="Enter city or area (e.g., Surat, Ahmedabad)"
              />
            </label>
            <label>
              Fuel Preference
              <select
                name="fuelType"
                value={filters.fuelType}
                onChange={handleChange}
              >
                <option value="">All</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </label>
            <label>
              Car Category
              <input
                name="category"
                value={filters.category}
                onChange={handleChange}
                placeholder="Select category (Premium, Family, Budget…)"
              />
            </label>
            <label>
              Maximum Daily Budget (₹)
              <input
                name="maxPrice"
                type="number"
                value={filters.maxPrice}
                onChange={handleChange}
                placeholder="3500"
              />
            </label>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              <FiSearch />
              Search Available Cars
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={resetFilters}
            >
              <FiRefreshCcw />
              Clear Filters
            </button>
          </div>
        </form>

        <div
          className="results-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <strong>Showing {sortedCarsList.length} available cars</strong>
            <span
              style={{
                display: "block",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Real-time availability, wishlist support, and seamless booking
              experience across all devices.
            </span>
          </div>

          <div
            className="sort-panel"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <label
              style={{
                margin: 0,
                fontWeight: 500,
                color: "var(--text-color)",
                whiteSpace: "nowrap",
                fontWeight: "500",
              }}
            >
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--surface-color)",
                color: "var(--text-color)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Recommended</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Rating</option>
              <option value="availability">Availability</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="loader-orbit"></div>
            <p>Loading available cars...</p>
          </div>
        ) : sortedCarsList.length === 0 ? (
          <div className="empty-panel">
            <span className="pill">No match</span>
            <h2>No cars matched your current filters.</h2>
            <p>Try broadening the search to see more listings.</p>
          </div>
        ) : (
          <div className="vehicle-grid">
            {sortedCarsList.map((car) => (
              <VehicleCard key={car._id} car={car} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
