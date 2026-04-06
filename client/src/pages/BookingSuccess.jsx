import { Link } from "react-router-dom";

export default function BookingSuccess() {
  return (
    <div className="container text-center mt-5">
      <div className="card p-5">
        <h2 className="text-success">🎉 Booking Confirmed!</h2>

        <p className="mt-3">Your car has been successfully booked.</p>

        <Link to="/my-bookings" className="btn btn-primary mt-3">
          View My Bookings
        </Link>
      </div>
    </div>
  );
}
