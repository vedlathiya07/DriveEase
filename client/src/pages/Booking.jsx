/* eslint-disable */
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "./Booking.css";

export default function Booking() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [total, setTotal] = useState(0);

  // FETCH CAR
  useEffect(() => {
    fetchCar();
  }, []);

  const fetchCar = async () => {
    try {
      const res = await API.get(`/cars/${id}`);
      setCar(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // HANDLE ADDON TOGGLE
  const toggleAddon = (addon) => {
    const exists = selectedAddons.find((a) => a.name === addon.name);

    if (exists) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // CALCULATE TOTAL
  useEffect(() => {
    if (startDate && endDate && car) {
      const days =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

      const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);

      setTotal(days * car.pricePerDay + addonsPrice);
    }
  }, [startDate, endDate, selectedAddons, car]);

  // HANDLE PAYMENT
  const handlePayment = async () => {
    try {
      const orderRes = await API.post("/payment/create-order", {
        amount: total,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_xxx",
        amount: orderRes.data.order.amount,
        currency: "INR",
        name: "DriveEase",
        description: "Car Booking Payment",
        order_id: orderRes.data.order.id,
        handler: async function (response) {
          // VERIFY PAYMENT
          await API.post("/payment/verify", response);

          // CREATE BOOKING
          await API.post("/bookings", {
            carId: id,
            startDate,
            endDate,
            addons: selectedAddons,
          });

          alert("Booking Successful 🚗");
          window.location.href = "/my-bookings";
        },
        theme: {
          color: "#0d6efd",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    }
  };

  if (!car) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4 booking-page">
      <h2 className="mb-4">Book {car.title}</h2>

      <div className="row">
        {/* LEFT */}
        <div className="col-md-8">
          {/* DATE SELECTION */}
          <div className="card p-3 mb-3">
            <h5>Select Dates</h5>

            <div className="d-flex gap-3">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholderText="Start Date"
                className="form-control"
              />

              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholderText="End Date"
                className="form-control"
              />
            </div>
          </div>

          {/* ADDONS */}
          <div className="card p-3">
            <h5>Add-ons</h5>

            {car.addons?.length ? (
              car.addons.map((addon, i) => (
                <div key={i} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    onChange={() => toggleAddon(addon)}
                  />
                  <label className="form-check-label">
                    {addon.name} (₹{addon.price})
                  </label>
                </div>
              ))
            ) : (
              <p className="text-muted">No add-ons available</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-md-4">
          <div className="card p-4 text-center">
            <h5>Total Price</h5>
            <h3 className="text-primary">₹{total}</h3>

            <button
              className="btn btn-success mt-3 w-100"
              onClick={handlePayment}
              disabled={!startDate || !endDate}
            >
              Pay & Book 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
