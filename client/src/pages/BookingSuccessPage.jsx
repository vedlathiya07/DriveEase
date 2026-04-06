import { encodeId, decodeId } from "../utils/idEncoder";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheckCircle, FiCompass, FiFileText } from "react-icons/fi";
import API from "../services/api";
import Loader from "../components/Loader";
import { formatCurrency, formatDateRange } from "../utils/format";

export default function BookingSuccessPage() {
  const { bookingId: rawId } = useParams();
  const bookingId = decodeId(rawId);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchBooking = async () => {
      try {
        const response = await API.get(`/bookings/${bookingId}`);

        if (!ignore) {
          setBooking(response.data.booking);
        }
      } catch {
        if (!ignore) {
          setBooking(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchBooking();

    return () => {
      ignore = true;
    };
  }, [bookingId]);

  if (loading) {
    return <Loader fullHeight label="Loading your confirmed booking..." />;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="success-card" data-aos="zoom-in">
          <div className="success-icon">
            <FiCheckCircle />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Booking Confirmed</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            The demo payment was approved and the reservation has been created
            successfully. You can now review it from your bookings dashboard.
          </p>

          {booking ? (
            <div className="success-summary">
              <div className="list-row">
                <span>Booking code</span>
                <strong>{booking.bookingCode}</strong>
              </div>
              <div className="list-row">
                <span>Vehicle</span>
                <strong>{booking.car?.title}</strong>
              </div>
              <div className="list-row">
                <span>Travel dates</span>
                <strong>{formatDateRange(booking.startDate, booking.endDate)}</strong>
              </div>
              <div className="list-row">
                <span>Total paid</span>
                <strong>{formatCurrency(booking.totalPrice)}</strong>
              </div>
            </div>
          ) : null}

          <div className="hero-actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Link to="/my-bookings" className="btn btn-primary">
              <FiFileText />
              View my bookings
            </Link>
            <Link to="/cars" className="btn btn-outline-light">
              <FiCompass />
              Explore more cars
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
