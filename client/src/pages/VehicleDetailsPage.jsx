import { encodeId, decodeId } from "../utils/idEncoder";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiCheckCircle,
  FiMapPin,
  FiNavigation,
  FiSettings,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import API from "../services/api";
import SafeImage from "../components/SafeImage";
import { formatCurrency, formatDeliveryMethod, formatShortDate } from "../utils/format";
import { CAR_IMAGE_FALLBACK, getStoredImageUrl } from "../utils/media";

export default function VehicleDetailsPage() {
  const { id: rawId } = useParams();
  const id = decodeId(rawId);
  const [car, setCar] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadCar = async () => {
      try {
        const [carResponse, dateResponse] = await Promise.all([
          API.get(`/cars/${id}`),
          API.get(`/bookings/car/${id}/dates`),
        ]);

        if (!ignore) {
          setCar(carResponse.data);
          setBookedDates(dateResponse.data);
          setActiveImage(
            getStoredImageUrl(carResponse.data.images?.[0], "cars") ||
              CAR_IMAGE_FALLBACK,
          );
        }
      } catch {
        if (!ignore) {
          setCar(null);
        }
      }
    };

    loadCar();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (car?.title) {
      document.title = `${car.title} | DriveEase`;
    }
  }, [car?.title]);

  if (!car) {
    return (
      <div className="page-loader">
        <div className="loader-orbit"></div>
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  const gallery = car.images?.length
    ? car.images.map((image) => getStoredImageUrl(image, "cars"))
    : [CAR_IMAGE_FALLBACK];
  const availabilityStatus =
    car.availabilityStatus || (car.isAvailable ? "Available" : "Unavailable");
  const canBook = car.canBook !== false;

  return (
    <section className="page-shell">
      <div className="container">
        <div className="details-layout">
          <div className="details-gallery" data-aos="fade-right">
            <SafeImage
              src={activeImage || gallery[0]}
              fallback={CAR_IMAGE_FALLBACK}
              alt={car.title}
              className="hero-image"
            />
            <div className="thumbnail-row">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={activeImage === image ? "thumb active" : "thumb"}
                  onClick={() => setActiveImage(image)}
                >
                  <SafeImage
                    src={image}
                    fallback={CAR_IMAGE_FALLBACK}
                    alt={car.title}
                  />
                </button>
              ))}
            </div>
          </div>

          <aside className="details-sidebar" data-aos="fade-left">
            <div className="chip-row">
              <span className="pill">{car.category || "Premium collection"}</span>
              <span
                className={
                  availabilityStatus === "Available"
                    ? "status-chip available"
                    : availabilityStatus === "Booked"
                      ? "status-chip booked"
                      : "status-chip"
                }
              >
                {availabilityStatus}
              </span>
            </div>
            <h1>{car.title}</h1>
            <p className="lead-copy">
              {car.description ||
                "A polished rental option designed for comfortable city drives, smooth weekend escapes, and premium on-road presence."}
            </p>

            <div className="spec-grid">
              <span>
                <FiMapPin /> {car.location}
              </span>
              <span>
                <FiZap /> {car.fuelType}
              </span>
              <span>
                <FiUsers /> {car.specs?.seats || 4} seats
              </span>
              <span>
                <FiSettings /> {car.specs?.transmission || "Automatic"}
              </span>
            </div>

            <div className="price-box">
              <p>Daily rate</p>
              <strong>{formatCurrency(car.pricePerDay)}</strong>
              <span>Includes secure booking flow and demo checkout.</span>
            </div>

            <div className="sticky-actions">
              {canBook ? (
                <Link to={`/booking/${encodeId(car._id)}`} className="btn btn-primary btn-lg">
                  {availabilityStatus === "Booked"
                    ? "Check future dates"
                    : "Reserve this car"}
                </Link>
              ) : (
                <button type="button" className="btn btn-outline-light btn-lg" disabled>
                  Currently unavailable
                </button>
              )}
              <Link to={`/map?car=${encodeId(car._id)}`} className="btn btn-outline-light btn-lg">
                <FiNavigation />
                Open live map
              </Link>
            </div>
          </aside>
        </div>

        <div className="details-content">
          <article className="detail-card" data-aos="fade-up">
            <h2>Vehicle overview</h2>
            <p>
              {car.description ||
                "A presentation-ready listing with owner details, delivery flexibility, add-ons, and booking date awareness."}
            </p>
          </article>

          <article className="detail-card" data-aos="fade-up">
            <h2>Delivery options</h2>
            <div className="stack-list">
              {[
                car.deliveryOptions?.homeDelivery ? "homeDelivery" : null,
                car.deliveryOptions?.meetUpPoint ? "meetUpPoint" : null,
                car.deliveryOptions?.selfPickup ? "selfPickup" : null,
              ]
                .filter(Boolean)
                .map((method) => (
                  <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(17,32,51,0.05)' }}>
                    <FiCheckCircle style={{ color: '#0f766e', fontSize: '1.2rem' }} />
                    <span style={{ fontWeight: 500 }}>{formatDeliveryMethod(method)}</span>
                  </div>
                ))}
            </div>
            {car.deliveryOptions?.meetUpPoint ? (
              <p className="muted-line">
                Meet-up location: {car.deliveryOptions.meetUpPoint}
              </p>
            ) : null}
          </article>

          <article className="detail-card" data-aos="fade-up">
            <h2>Available add-ons</h2>
            <div className="addon-list">
              {car.addons?.length ? (
                car.addons.map((addon) => (
                  <div key={addon.name} className="list-row">
                    <span>{addon.name}</span>
                    <strong>{formatCurrency(addon.price)}</strong>
                  </div>
                ))
              ) : (
                <p>No optional add-ons have been configured for this car yet.</p>
              )}
            </div>
          </article>

          <article className="detail-card" data-aos="fade-up">
            <h2>Booked dates</h2>
            {bookedDates.length ? (
              <div className="stack-list">
                {bookedDates.slice(0, 6).map((entry) => (
                  <div key={`${entry.startDate}-${entry.endDate}`} className="list-row">
                    <span>{formatShortDate(entry.startDate)}</span>
                    <span>{formatShortDate(entry.endDate)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No active bookings are blocking this vehicle right now.</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
