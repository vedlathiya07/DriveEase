import { useEffect, useState } from "react";
import API from "../services/api";
import "./MyBookings.css";

const API2 = import.meta.env.VITE_API_URL;

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH BOOKINGS
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/bookings/my-bookings");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // CANCEL BOOKING
  const cancelBooking = async (id) => {
    try {
      await API.put(`/bookings/${id}/cancel`);
      alert("Booking cancelled ❌");
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border"></div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">📅 My Bookings</h2>

      {bookings.length === 0 ? (
        <p className="text-center text-muted">No bookings yet 🚗</p>
      ) : (
        <div className="row">
          {bookings.map((b) => (
            <div className="col-md-6 mb-4" key={b._id}>
              <div className="card booking-card p-3">
                {/* CAR IMAGE */}
                <img
                  src={`${API2}/uploads/cars/${b.car?.images?.[0]}`}
                  alt="car"
                  className="booking-img"
                />

                <div className="mt-3">
                  <h5 className="fw-bold">{b.car?.title}</h5>

                  <p className="text-muted mb-1">📍 {b.car?.location}</p>

                  <p>
                    📅 {new Date(b.startDate).toDateString()} →{" "}
                    {new Date(b.endDate).toDateString()}
                  </p>

                  <p>💰 ₹{b.totalPrice}</p>

                  {/* STATUS */}
                  <span
                    className={`badge ${
                      b.status === "Booked"
                        ? "bg-success"
                        : b.status === "Cancelled"
                          ? "bg-danger"
                          : "bg-secondary"
                    }`}
                  >
                    {b.status}
                  </span>

                  {/* CANCEL BUTTON */}
                  {b.status === "Booked" && (
                    <button
                      className="btn btn-outline-danger mt-2 w-100"
                      onClick={() => cancelBooking(b._id)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
