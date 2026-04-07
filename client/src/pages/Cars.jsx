import { encodeId } from "../utils/idEncoder";
// =====================================
// CARS PAGE (MODERN UI)
// =====================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const API2 = import.meta.env.VITE_API_URL;

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({
    location: "",
    fuelType: "",
    maxPrice: "",
  });

  const [loading, setLoading] = useState(true);

  // FETCH ALL CARS
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await API.get("/cars");
      setCars(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // SEARCH
  const handleSearch = async () => {
    try {
      const res = await API.get("/cars/search/filter", {
        params: filters,
      });
      setCars(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      {/* TITLE */}
      <h2 className="text-center mb-4">🚗 Available Cars</h2>

      {/* FILTER SECTION */}
      <div className="card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Location"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.fuelType}
              onChange={(e) =>
                setFilters({ ...filters, fuelType: e.target.value })
              }
            >
              <option value="">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value })
              }
            />
          </div>

          <div className="col-md-3">
            <button className="btn btn-primary w-100" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border"></div>
        </div>
      ) : cars.length === 0 ? (
        <p className="text-center text-muted">No cars found</p>
      ) : (
        <div className="row">
          {cars.map((car) => (
            <div className="col-md-4 mb-4" key={car._id}>
              <div className="card h-100">
                {/* IMAGE */}
                <a href={`/car/${encodeId(car._id)}`}>
                  <img
                    src={`{API2}/uploads/cars/${car.images?.[0]}`}
                    alt="car"
                    style={{
                      height: "200px",
                      objectFit: "cover",
                      borderTopLeftRadius: "18px",
                      borderTopRightRadius: "18px",
                    }}
                  />
                </a>

                {/* BODY */}
                <div className="card-body d-flex flex-column">
                  <h5 className="fw-bold">{car.title}</h5>

                  <p className="text-muted mb-1">📍 {car.location}</p>

                  <p className="mb-2">⛽ {car.fuelType}</p>

                  <h6 className="text-primary mb-3">
                    ₹{car.pricePerDay} / day
                  </h6>

                  {/* BUTTONS */}
                  <div className="mt-auto">
                    <Link
                      to={`/car/${encodeId(car._id)}`}
                      className="btn btn-outline-dark w-100 mb-2"
                    >
                      View Details
                    </Link>

                    <Link
                      to={`/booking/${encodeId(car._id)}`}
                      className="btn btn-success w-100"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
