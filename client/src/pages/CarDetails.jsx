import { encodeId } from "../utils/idEncoder";
/* eslint-disable */
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import Slider from "react-slick";

import "./CarDetails.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      const res = await API.get(`/cars/${id}`);
      setCar(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // LOADING
  if (!car) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border"></div>
      </div>
    );
  }

  // SLIDER SETTINGS
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    arrows: true,
    autoplay: true,
  };

  return (
    <div className="container mt-4 car-details">
      {/* TITLE */}
      <h2 className="car-title">{car.title}</h2>

      {/* IMAGE SLIDER */}
      <div className="slider-wrapper">
        <Slider {...settings}>
          {car.images?.length ? (
            car.images.map((img, i) => (
              <img
                key={i}
                src={`{API}/uploads/cars/${img}`}
                className="car-image"
                alt="car"
              />
            ))
          ) : (
            <img
              src="https://via.placeholder.com/800x300"
              className="car-image"
              alt="no car"
            />
          )}
        </Slider>
      </div>

      <div className="row mt-4">
        {/* LEFT SIDE */}
        <div className="col-md-8">
          {/* SPECS */}
          <div className="card-box">
            <h4>Specifications</h4>
            <p>📍 {car.location}</p>
            <p>⛽ {car.fuelType}</p>
            <p>👥 Seats: {car.specs?.seats}</p>
            <p>⚙️ Transmission: {car.specs?.transmission}</p>
            <p>🛣 Mileage: {car.specs?.mileage}</p>
          </div>

          {/* ADDONS */}
          <div className="card-box mt-3">
            <h4>Available Add-ons</h4>
            {car.addons?.length ? (
              car.addons.map((a, i) => (
                <p key={i}>
                  ✔ {a.name} — ₹{a.price}
                </p>
              ))
            ) : (
              <p className="text-muted">No add-ons available</p>
            )}
          </div>

          {/* DELIVERY OPTIONS */}
          <div className="card-box mt-3">
            <h4>Delivery Options</h4>
            <p>
              {car.deliveryOptions?.homeDelivery && "🚗 Home Delivery "}
              {car.deliveryOptions?.selfPickup && "🔐 Self Pickup "}
              {car.deliveryOptions?.meetUpPoint &&
                `📍 Meet at ${car.deliveryOptions.meetUpPoint}`}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-md-4">
          <div className="price-box">
            <h5>Price</h5>
            <h3>₹{car.pricePerDay} / day</h3>

            <Link
              to={`/booking/${encodeId(car._id)}`}
              className="btn btn-success w-100 mt-3"
            >
              Book Now 🚀
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
