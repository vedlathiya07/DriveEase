import { encodeId, decodeId } from "../utils/idEncoder";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiMapPin,
  FiShield,
  FiTruck,
  FiZap,
} from "react-icons/fi";
import API from "../services/api";
import Loader from "../components/Loader";
import SafeImage from "../components/SafeImage";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  formatCurrency,
  formatDateRange,
  formatDeliveryMethod,
} from "../utils/format";
import { CAR_IMAGE_FALLBACK, getStoredImageUrl } from "../utils/media";

import "react-datepicker/dist/react-datepicker.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

const addDays = (date, count) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + count);
  return nextDate;
};

const toDateInputValue = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDisabledDates = (bookedRanges) => {
  const blockedDates = [];
  bookedRanges.forEach((range) => {
    const cursor = new Date(range.startDate);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(range.endDate);
    endDate.setHours(0, 0, 0, 0);
    while (cursor < endDate) {
      blockedDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  return blockedDates;
};

const buildBookingPayload = (carId, startDate, endDate, addons, deliveryMethod) => ({
  carId,
  startDate: toDateInputValue(startDate),
  endDate: toDateInputValue(endDate),
  addons,
  deliveryMethod,
});

const getDeliveryChoices = (car) => {
  const choices = [];
  if (car?.deliveryOptions?.homeDelivery) choices.push("homeDelivery");
  if (car?.deliveryOptions?.meetUpPoint) choices.push("meetUpPoint");
  if (car?.deliveryOptions?.selfPickup || choices.length === 0) choices.push("selfPickup");
  return choices;
};

// ─── Razorpay SDK loader ────────────────────────────────────────────────────

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { id: rawId } = useParams();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [car, setCar] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState("selfPickup");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const minimumReturnDate = startDate ? addDays(startDate, 1) : addDays(new Date(), 1);

  // Load car + booked dates
  useEffect(() => {
    let ignore = false;
    const loadCheckout = async () => {
      try {
        const [carResponse, rangesResponse] = await Promise.all([
          API.get(`/cars/${id}`),
          API.get(`/bookings/car/${id}/dates`),
        ]);
        if (!ignore) {
          const nextCar = carResponse.data;
          setCar(nextCar);
          setBookedDates(rangesResponse.data);
          setDeliveryMethod(getDeliveryChoices(nextCar)[0]);
        }
      } catch {
        if (!ignore) {
          showToast({
            title: "Unable to load booking details",
            message: "Please try again from the fleet page.",
            tone: "warning",
          });
          navigate("/cars");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadCheckout();
    return () => { ignore = true; };
  }, [id, navigate, showToast]);

  // Live price quote
  useEffect(() => {
    if (!startDate || !endDate) { setQuote(null); return; }
    let ignore = false;
    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        const response = await API.post(
          "/bookings/quote",
          buildBookingPayload(id, startDate, endDate, selectedAddons, deliveryMethod),
        );
        if (!ignore) setQuote(response.data.summary);
      } catch {
        if (!ignore) setQuote(null);
      } finally {
        if (!ignore) setQuoteLoading(false);
      }
    };
    fetchQuote();
    return () => { ignore = true; };
  }, [deliveryMethod, endDate, id, selectedAddons, startDate]);

  // Page title
  useEffect(() => {
    if (car?.title) document.title = `Checkout - ${car.title} | DriveEase`;
  }, [car?.title]);

  const toggleAddon = (addonName) => {
    setSelectedAddons((prev) =>
      prev.includes(addonName) ? prev.filter((i) => i !== addonName) : [...prev, addonName],
    );
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date && endDate && endDate <= date) setEndDate(addDays(date, 1));
  };

  // ─── Main payment handler ────────────────────────────────────────────────

  const handlePayWithRazorpay = async () => {
    if (!startDate || !endDate) {
      showToast({
        title: "Select dates first",
        message: "Choose your rental period before proceeding to payment.",
        tone: "warning",
      });
      return;
    }

    try {
      setPaymentLoading(true);

      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        showToast({
          title: "Payment unavailable",
          message: "Could not load Razorpay. Please check your connection and try again.",
          tone: "warning",
        });
        return;
      }

      // 2. Create server-side Razorpay order
      const orderResponse = await API.post(
        "/payment/create-order",
        buildBookingPayload(id, startDate, endDate, selectedAddons, deliveryMethod),
      );

      const { session, razorpayKeyId } = orderResponse.data;

      // 3. Open Razorpay checkout modal
      const rzpOptions = {
        key: razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: session.amountInPaise,
        currency: session.currency || "INR",
        name: "DriveEase",
        description: `Car rental — ${car.title}`,
        image: "https://res.cloudinary.com/drbeqb6zk/image/upload/v1/driveease-logo", // optional logo
        order_id: session.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#6366f1", // indigo — matches DriveEase brand
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            showToast({
              title: "Payment cancelled",
              message: "You closed the payment window. Your booking was not confirmed.",
              tone: "warning",
            });
          },
        },
        // 4. On payment success, verify server-side
        handler: async (razorpayResponse) => {
          try {
            const verifyResponse = await API.post("/payment/verify", {
              sessionId: session.sessionId,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            showToast({
              title: "Payment successful! 🎉",
              message: "Your booking has been confirmed.",
              tone: "success",
            });

            navigate(`/booking-success/${encodeId(verifyResponse.data.booking._id)}`);
          } catch (verifyError) {
            showToast({
              title: "Verification failed",
              message:
                verifyError.response?.data?.message ||
                "Payment was made but verification failed. Please contact support.",
              tone: "warning",
            });
          } finally {
            setPaymentLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(rzpOptions);

      rzp.on("payment.failed", (response) => {
        setPaymentLoading(false);
        showToast({
          title: "Payment failed",
          message: response.error?.description || "Your payment could not be processed.",
          tone: "warning",
        });
      });

      rzp.open();
    } catch (error) {
      setPaymentLoading(false);
      showToast({
        title: "Checkout unavailable",
        message: error.response?.data?.message || "Unable to start the checkout process.",
        tone: "warning",
      });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <Loader fullHeight label="Preparing your booking workspace..." />;
  }

  const blockedDates = buildDisabledDates(bookedDates);
  const previewImage = getStoredImageUrl(car.images?.[0], "cars");

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1>Secure Checkout</h1>
          <p>Book {car.title} — powered by Razorpay test mode.</p>
        </div>

        <div className="checkout-grid">
          {/* ── Left column ── */}
          <div
            className="checkout-main-card"
            data-aos="fade-right"
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Car preview */}
            <div className="checkout-car-card detail-card" style={{ marginBottom: 0 }}>
              <SafeImage src={previewImage} fallback={CAR_IMAGE_FALLBACK} alt={car.title} />
              <div>
                <div className="chip-row">
                  <span className="pill">{car.category || "Premium"}</span>
                  <span
                    className={
                      car.availabilityStatus === "Available"
                        ? "status-chip available"
                        : car.availabilityStatus === "Booked"
                        ? "status-chip booked"
                        : "status-chip"
                    }
                  >
                    {car.availabilityStatus || "Available"}
                  </span>
                </div>
                <h2>{car.title}</h2>
                <p>
                  <FiMapPin /> {car.location}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="detail-card" style={{ position: "relative", zIndex: 10 }}>
              <h3 style={{ marginBottom: "1rem" }}>Rental Dates</h3>
              <div
                className="booking-form-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <label>
                  Pick-up date
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    minDate={new Date()}
                    excludeDates={blockedDates}
                    placeholderText="Select start date"
                    className="app-input"
                  />
                </label>
                <label>
                  Return date
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={minimumReturnDate}
                    excludeDates={blockedDates}
                    placeholderText="Select end date"
                    className="app-input"
                  />
                </label>
              </div>
            </div>

            {/* Delivery */}
            <div className="detail-card">
              <h3>Choose delivery</h3>
              <div className="choice-grid">
                {getDeliveryChoices(car).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={deliveryMethod === choice ? "choice-chip active" : "choice-chip"}
                    onClick={() => setDeliveryMethod(choice)}
                  >
                    <FiTruck />
                    {formatDeliveryMethod(choice)}
                  </button>
                ))}
              </div>
              {deliveryMethod === "meetUpPoint" && car.deliveryOptions?.meetUpPoint ? (
                <p className="muted-line">Meet-up point: {car.deliveryOptions.meetUpPoint}</p>
              ) : null}
            </div>

            {/* Add-ons */}
            <div className="detail-card">
              <h3>Add-ons</h3>
              {car.addons?.length ? (
                <div className="choice-grid">
                  {car.addons.map((addon) => (
                    <button
                      key={addon.name}
                      type="button"
                      className={
                        selectedAddons.includes(addon.name) ? "choice-chip active" : "choice-chip"
                      }
                      onClick={() => toggleAddon(addon.name)}
                    >
                      <FiCheckCircle />
                      {addon.name} ({formatCurrency(addon.price)})
                    </button>
                  ))}
                </div>
              ) : (
                <p>No add-ons have been configured for this car yet.</p>
              )}
            </div>

            {/* Blocked dates reference */}
            {bookedDates.length ? (
              <div className="detail-card">
                <h3>Currently blocked dates</h3>
                <div className="chip-row">
                  {bookedDates.slice(0, 6).map((range) => (
                    <span
                      key={`${range.startDate}-${range.endDate}`}
                      className="small-chip"
                    >
                      <FiCalendar />
                      {formatDateRange(range.startDate, range.endDate)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Right column — Booking summary ── */}
          <aside className="checkout-summary-card" data-aos="fade-left">
            <h2
              style={{
                fontSize: "1.8rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(15,23,42,0.1)",
                marginBottom: "1.5rem",
              }}
            >
              Booking Summary
            </h2>

            <div
              className="summary-list"
              style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.5rem 0" }}
            >
              <div className="list-row" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>Daily rate</span>
                <strong>{formatCurrency(car.pricePerDay)}</strong>
              </div>
              <div className="list-row" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>Delivery</span>
                <strong>{formatDeliveryMethod(deliveryMethod)}</strong>
              </div>
              <div className="list-row" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>Add-ons</span>
                <strong>{selectedAddons.length}</strong>
              </div>
              {quote?.days ? (
                <div
                  className="list-row"
                  style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
                >
                  <span>Rental days</span>
                  <strong>{quote.days} days</strong>
                </div>
              ) : null}
            </div>

            <div className="price-box">
              <p>Total payable</p>
              <strong>
                {quoteLoading
                  ? "Calculating..."
                  : formatCurrency(quote?.totalPrice || car.pricePerDay)}
              </strong>
              <span>
                {quote?.days
                  ? `${quote.days} day rental — server-verified pricing`
                  : "Select dates to get an accurate quote"}
              </span>
            </div>

            {/* Razorpay trust badge */}
            <div className="payment-note" style={{ gap: "0.6rem" }}>
              <FiShield />
              <p>
                Payments are secured by{" "}
                <strong style={{ color: "var(--color-primary)" }}>Razorpay</strong>{" "}
                (test mode). No real money is charged.
              </p>
            </div>

            {/* Accepted methods row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              {["UPI", "Cards", "Net Banking", "Wallets"].map((m) => (
                <span key={m} className="small-chip" style={{ fontSize: "0.72rem" }}>
                  <FiCreditCard style={{ width: 11 }} /> {m}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                id="razorpay-pay-btn"
                type="button"
                className="btn btn-primary btn-lg w-100"
                onClick={handlePayWithRazorpay}
                disabled={!startDate || !endDate || paymentLoading || car.canBook === false}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <FiZap />
                {paymentLoading ? "Preparing payment..." : "Pay with Razorpay"}
              </button>

              <Link to={`/car/${encodeId(car._id)}`} className="btn btn-ghost w-100">
                Back to vehicle details
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
