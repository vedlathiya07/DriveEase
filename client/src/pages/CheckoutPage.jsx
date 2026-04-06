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

const paymentMethods = [
  { id: "upi", label: "Demo UPI" },
  { id: "card", label: "Demo Card" },
  { id: "wallet", label: "Demo Wallet" },
  { id: "netbanking", label: "Demo Net Banking" },
];

const addDays = (date, count) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + count);
  return nextDate;
};

const toDateInputValue = (date) => {
  if (!date) {
    return "";
  }

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

  if (car?.deliveryOptions?.homeDelivery) {
    choices.push("homeDelivery");
  }

  if (car?.deliveryOptions?.meetUpPoint) {
    choices.push("meetUpPoint");
  }

  if (car?.deliveryOptions?.selfPickup || choices.length === 0) {
    choices.push("selfPickup");
  }

  return choices;
};

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
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [payerName, setPayerName] = useState(user?.name || "");
  const minimumReturnDate = startDate ? addDays(startDate, 1) : addDays(new Date(), 1);

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
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCheckout();

    return () => {
      ignore = true;
    };
  }, [id, navigate, showToast]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setQuote(null);
      return;
    }

    let ignore = false;

    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);

        const response = await API.post(
          "/bookings/quote",
          buildBookingPayload(
            id,
            startDate,
            endDate,
            selectedAddons,
            deliveryMethod,
          ),
        );

        if (!ignore) {
          setQuote(response.data.summary);
        }
      } catch {
        if (!ignore) {
          setQuote(null);
        }
      } finally {
        if (!ignore) {
          setQuoteLoading(false);
        }
      }
    };

    fetchQuote();

    return () => {
      ignore = true;
    };
  }, [deliveryMethod, endDate, id, selectedAddons, startDate]);

  useEffect(() => {
    if (car?.title) {
      document.title = `Checkout - ${car.title} | DriveEase`;
    }
  }, [car?.title]);

  useEffect(() => {
    if (!showPaymentSheet) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showPaymentSheet]);

  const toggleAddon = (addonName) => {
    setSelectedAddons((currentAddons) =>
      currentAddons.includes(addonName)
        ? currentAddons.filter((item) => item !== addonName)
        : [...currentAddons, addonName],
    );
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);

    if (date && endDate && endDate <= date) {
      setEndDate(addDays(date, 1));
    }
  };

  const handleCreateOrder = async () => {
    if (!startDate || !endDate) {
      showToast({
        title: "Select dates first",
        message: "Choose your rental period before opening checkout.",
        tone: "warning",
      });
      return;
    }

    try {
      setPaymentLoading(true);

      const response = await API.post(
        "/payment/create-order",
        buildBookingPayload(
          id,
          startDate,
          endDate,
          selectedAddons,
          deliveryMethod,
        ),
      );

      setCheckoutSession(response.data.session);
      setShowPaymentSheet(true);
    } catch (error) {
      showToast({
        title: "Checkout unavailable",
        message:
          error.response?.data?.message || "Unable to start the demo checkout.",
        tone: "warning",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!checkoutSession) {
      return;
    }

    try {
      setPaymentLoading(true);

      const response = await API.post("/payment/verify", {
        sessionId: checkoutSession.sessionId,
        orderId: checkoutSession.orderId,
        paymentMethod,
        payerName,
      });

      showToast({
        title: "Payment approved",
        message: "Your demo payment and booking were completed successfully.",
        tone: "success",
      });

      navigate(`/booking-success/${encodeId(response.data.booking._id)}`);
    } catch (error) {
      showToast({
        title: "Payment failed",
        message:
          error.response?.data?.message || "Unable to verify this demo payment.",
        tone: "warning",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

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
          <p>
            Book {car.title} through a polished demo-ready payment journey.
          </p>
        </div>

        <div className="checkout-grid">
          <div className="checkout-main-card" data-aos="fade-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="checkout-car-card detail-card" style={{ marginBottom: 0 }}>
              <SafeImage
                src={previewImage}
                fallback={CAR_IMAGE_FALLBACK}
                alt={car.title}
              />
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

            <div className="detail-card" style={{ position: 'relative', zIndex: 10 }}>
              <h3 style={{ marginBottom: '1rem' }}>Rental Dates</h3>
              <div className="booking-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
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

            <div className="detail-card">
              <h3>Choose delivery</h3>
              <div className="choice-grid">
                {getDeliveryChoices(car).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={
                      deliveryMethod === choice ? "choice-chip active" : "choice-chip"
                    }
                    onClick={() => setDeliveryMethod(choice)}
                  >
                    <FiTruck />
                    {formatDeliveryMethod(choice)}
                  </button>
                ))}
              </div>
              {deliveryMethod === "meetUpPoint" && car.deliveryOptions?.meetUpPoint ? (
                <p className="muted-line">
                  Meet-up point: {car.deliveryOptions.meetUpPoint}
                </p>
              ) : null}
            </div>

            <div className="detail-card">
              <h3>Add-ons</h3>
              {car.addons?.length ? (
                <div className="choice-grid">
                  {car.addons.map((addon) => (
                    <button
                      key={addon.name}
                      type="button"
                      className={
                        selectedAddons.includes(addon.name)
                          ? "choice-chip active"
                          : "choice-chip"
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

          <aside className="checkout-summary-card" data-aos="fade-left">
            <h2 style={{ fontSize: '1.8rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(15,23,42,0.1)', marginBottom: '1.5rem' }}>Booking Summary</h2>

            <div className="summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0' }}>
              <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Daily rate</span>
                <strong>{formatCurrency(car.pricePerDay)}</strong>
              </div>
              <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Delivery</span>
                <strong>{formatDeliveryMethod(deliveryMethod)}</strong>
              </div>
              <div className="list-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Add-ons</span>
                <strong>{selectedAddons.length}</strong>
              </div>
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
                  ? `${quote.days} day rental with server-calculated pricing`
                  : "Select dates to generate an accurate quote"}
              </span>
            </div>

            <div className="payment-note">
              <FiShield />
              <p>
                This checkout uses a dummy payment gateway so you can demo the
                complete flow safely.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg w-100"
                onClick={handleCreateOrder}
                disabled={!startDate || !endDate || paymentLoading || car.canBook === false}
              >
                {paymentLoading ? "Preparing checkout..." : "Continue to payment"}
              </button>

              <Link to={`/car/${encodeId(car._id)}`} className="btn btn-ghost w-100">
                Back to vehicle details
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {showPaymentSheet && checkoutSession ? (
        <div className="modal-backdrop">
          <div className="checkout-modal-card" data-aos="zoom-in">
            <div className="checkout-modal-header">
              <div>
                <span className="pill">Demo payment</span>
                <h3>Complete your presentation checkout</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close payment dialog"
                onClick={() => setShowPaymentSheet(false)}
              >
                &times;
              </button>
            </div>

            <div className="detail-card">
              <div className="list-row checkout-payment-row">
                <span>Order ID</span>
                <strong>{checkoutSession.orderId}</strong>
              </div>
              <div className="list-row checkout-payment-row">
                <span>Amount</span>
                <strong>{formatCurrency(checkoutSession.amount)}</strong>
              </div>
            </div>

            <label>
              Payer name
              <input
                className="app-input"
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
                placeholder="Enter payer name"
              />
            </label>

            <div className="detail-card">
              <h3>Select a demo method</h3>
              <div className="choice-grid">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={
                      paymentMethod === method.id
                        ? "choice-chip active"
                        : "choice-chip"
                    }
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <FiCreditCard />
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="payment-note">
              <FiShield />
              <p>
                This step does not charge real money. It only simulates the full
                checkout experience and then creates a paid booking.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg w-100"
              disabled={paymentLoading}
              onClick={handleVerifyPayment}
            >
              {paymentLoading ? "Processing payment..." : "Confirm demo payment"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
