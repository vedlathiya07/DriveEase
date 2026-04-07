import { encodeId } from "../utils/idEncoder";
import { Link } from "react-router-dom";
import WishlistButton from "./WishlistButton";
const API = import.meta.env.VITE_API_URL;

export default function CarCard({ car }) {
  return (
    <div className="card h-100">
      {/* <a href=`/car/${encodeId(car._id)}`> */}
      <img
        src={`${API}/uploads/cars/${car.images?.[0]}`}
        alt="car"
        style={{
          height: "200px",
          objectFit: "cover",
          borderTopLeftRadius: "18px",
          borderTopRightRadius: "18px",
        }}
      />
      {/* </a> */}

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between">
          <h5 className="fw-bold">{car.title}</h5>
          <WishlistButton carId={car._id} />
        </div>

        <p className="text-muted mb-1">📍 {car.location}</p>
        <p>⛽ {car.fuelType}</p>

        <h6 className="text-primary mb-3">₹{car.pricePerDay} / day</h6>

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
  );
}
