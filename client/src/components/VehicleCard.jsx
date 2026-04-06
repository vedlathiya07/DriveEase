import { encodeId } from "../utils/idEncoder";
import { Link } from "react-router-dom";
import {
  FiHeart,
  FiMapPin,
  FiSettings,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import { formatCurrency } from "../utils/format";
import { CAR_IMAGE_FALLBACK, getCarImageUrl } from "../utils/media";
import SafeImage from "./SafeImage";

export default function VehicleCard({ car }) {
  const { isAuthenticated, user, toggleWishlist } = useAuth();
  const { showToast } = useToast();
  const availabilityStatus =
    car.availabilityStatus || (car.isAvailable ? "Available" : "Unavailable");
  const canBook = car.canBook !== false;
  const statusClassName =
    availabilityStatus === "Available"
      ? "status-chip available"
      : availabilityStatus === "Booked"
        ? "status-chip booked"
        : "status-chip";

  const isWishlisted = user?.wishlist?.some((item) => {
    const wishlistId = typeof item === "string" ? item : item?._id;
    return wishlistId === car._id;
  });

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      showToast({
        title: "Login required",
        message: "Please login to save cars to your wishlist.",
        tone: "warning",
      });
      return;
    }

    const nextState = await toggleWishlist(car._id);
    showToast({
      title: nextState ? "Saved" : "Removed",
      message: nextState
        ? `${car.title} was added to your wishlist.`
        : `${car.title} was removed from your wishlist.`,
      tone: nextState ? "success" : "neutral",
    });
  };

  return (
    <article className="vehicle-card" data-aos="fade-up">
      <div className="vehicle-media">
        <SafeImage
          src={getCarImageUrl(car)}
          fallback={CAR_IMAGE_FALLBACK}
          alt={car.title}
        />
        <button
          type="button"
          className={isWishlisted ? "wishlist-btn active" : "wishlist-btn"}
          onClick={handleWishlistClick}
          aria-label="Toggle wishlist"
        >
          <FiHeart />
        </button>
      </div>

      <div className="vehicle-body">
        <div className="vehicle-heading">
          <div>
            <p className="vehicle-category">
              {car.category || car.brand || "Premium"} collection
            </p>
            <h3>{car.title}</h3>
          </div>
          <span className={statusClassName}>
            {availabilityStatus}
          </span>
        </div>

        <p className="vehicle-copy">
          {car.description ||
            "A polished rental experience with comfort-focused features, dependable performance, and flexible delivery options."}
        </p>

        <div className="vehicle-meta">
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

        <div className="vehicle-footer">
          <div>
            <p className="vehicle-price-label">Starting from</p>
            <strong>{formatCurrency(car.pricePerDay)} / day</strong>
          </div>
          <div className="vehicle-actions">
            <Link to={`/car/${encodeId(car._id)}`} className="btn btn-ghost">
              View details
            </Link>
            {canBook ? (
              <Link to={`/booking/${encodeId(car._id)}`} className="btn btn-primary">
                {availabilityStatus === "Booked" ? "Check dates" : "Book now"}
              </Link>
            ) : (
              <Link to={`/car/${encodeId(car._id)}`} className="btn btn-outline-light">
                Not available
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
