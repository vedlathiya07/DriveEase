import { useEffect, useState } from "react";
import { FiImage, FiUploadCloud, FiXCircle } from "react-icons/fi";
import API from "../services/api";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import SafeImage from "../components/SafeImage";
import { useToast } from "../components/Toast";
import { formatCurrency, formatDateRange } from "../utils/format";
import {
  CAR_IMAGE_FALLBACK,
  REPORT_IMAGE_FALLBACK,
  getStoredImageUrl,
} from "../utils/media";

const getBookingStatusClass = (status) =>
  status === "Booked"
    ? "status-chip booked"
    : status === "Completed"
      ? "status-chip available"
      : "status-chip";

export default function BookingsPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileState, setFileState] = useState({});
  const [activeRequest, setActiveRequest] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchBookings = async () => {
      try {
        const response = await API.get("/bookings/my-bookings");

        if (!ignore) {
          setBookings(response.data);
        }
      } catch {
        if (!ignore) {
          setBookings([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshBookings = async () => {
    const response = await API.get("/bookings/my-bookings");
    setBookings(response.data);
  };

  const handleCancel = async (bookingId) => {
    try {
      setActiveRequest(`cancel-${bookingId}`);
      await API.put(`/bookings/${bookingId}/cancel`);
      await refreshBookings();
      showToast({
        title: "Booking cancelled",
        message: "Your booking status was updated successfully.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to cancel",
        message: error.response?.data?.error || "Please try again later.",
        tone: "warning",
      });
    } finally {
      setActiveRequest("");
    }
  };

  const handleFileChange = (bookingId, type, files) => {
    if (!files || files.length === 0) return;
    const key = `${bookingId}-${type}`;
    setFileState((currentState) => {
      const existing = currentState[key] || [];
      return {
        ...currentState,
        [key]: [...existing, ...Array.from(files)],
      };
    });
  };

  const removeFile = (bookingId, type, index) => {
    const key = `${bookingId}-${type}`;
    setFileState((currentState) => {
      const existing = currentState[key] || [];
      return {
        ...currentState,
        [key]: existing.filter((_, i) => i !== index),
      };
    });
  };

  const handleUpload = async (bookingId, type) => {
    const key = `${bookingId}-${type}`;
    const files = fileState[key];

    if (!files?.length) {
      showToast({
        title: "No files selected",
        message: "Please choose at least one image to upload.",
        tone: "warning",
      });
      return;
    }

    try {
      setActiveRequest(key);

      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      await API.post(`/bookings/${bookingId}/${type}`, formData);
      await refreshBookings();
      setFileState((currentState) => {
        const nextState = { ...currentState };
        delete nextState[key];
        return nextState;
      });
      showToast({
        title: "Condition report updated",
        message:
          type === "before"
            ? "Pickup images uploaded successfully."
            : "Return images uploaded successfully.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Upload failed",
        message:
          error.response?.data?.error || "Please try again with valid images.",
        tone: "warning",
      });
    } finally {
      setActiveRequest("");
    }
  };

  if (loading) {
    return <Loader fullHeight label="Loading your bookings..." />;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Your Bookings
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
            Manage your trips, track booking status, and upload car condition
            reports — all in one place.
          </p>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            message="Once you reserve a vehicle, the full trip summary will appear here."
          />
        ) : (
          <div className="booking-grid">
            {bookings.map((booking) => {
              const beforeKey = `${booking._id}-before`;
              const afterKey = `${booking._id}-after`;

              return (
                <article
                  key={booking._id}
                  className="booking-card-shell"
                  data-aos="fade-up"
                >
                  <div className="booking-card-top">
                    <SafeImage
                      src={getStoredImageUrl(booking.car?.images?.[0], "cars")}
                      fallback={CAR_IMAGE_FALLBACK}
                      alt={booking.car?.title}
                    />
                    <div className="booking-card-summary">
                      <div className="booking-status-copy">
                        <span className="pill">
                          BookingID: {booking.bookingCode || booking.status}
                        </span>
                        <span className={getBookingStatusClass(booking.status)}>
                          {booking.status}
                        </span>
                      </div>
                      <h2>{booking.car?.title}</h2>
                      <p>
                        {formatDateRange(booking.startDate, booking.endDate)}
                      </p>
                      <strong>
                        Total Paid: {formatCurrency(booking.totalPrice)}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "1.2rem",
                      background: "rgba(255,255,255,0.5)",
                      borderRadius: "16px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1rem",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginTop: "1rem",
                    }}
                  >
                    <div style={{ flex: "1 1 auto", minWidth: "120px" }}>
                      <small
                        className="muted-line"
                        style={{ display: "block" }}
                      >
                        Delivery Method
                      </small>
                      <strong>
                        {booking.deliveryMethod.charAt(0).toUpperCase() +
                          booking.deliveryMethod.slice(1) || "Flexible"}
                      </strong>
                    </div>
                    <div
                      style={{
                        textAlign: "left",
                        flex: "1 1 auto",
                        minWidth: "120px",
                        maxWidth: "100%",
                      }}
                    >
                      <small
                        className="muted-line"
                        style={{ display: "block" }}
                      >
                        Payment
                      </small>
                      <strong style={{ wordBreak: "break-all" }}>
                        {booking.payment?.transactionId
                          ? "Paid Successfully"
                          : "Awaiting update"}
                      </strong>
                    </div>
                  </div>

                  {booking.addons?.length ? (
                    <div style={{ marginTop: "0.5rem" }}>
                      <p
                        className="muted-line"
                        style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}
                      >
                        Selected add-ons
                      </p>
                      <div className="chip-row">
                        {booking.addons.map((addon) => (
                          <span key={addon.name} className="small-chip">
                            {addon.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1.5rem",
                      borderTop: "1px solid rgba(17,32,51,0.08)",
                      display: "grid",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        borderRadius: "16px",
                        padding: "16px",
                        background: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        marginTop: "20px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.1rem",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiImage /> Pickup Inspection
                      </h3>

                      <p
                        style={{
                          marginBottom: "12px",
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
                        Upload clear images of the car before your trip for
                        transparency.
                      </p>

                      {/* Upload Box */}
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          border: "2px dashed #d1d5db",
                          borderRadius: "12px",
                          padding: "20px",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "center",
                          minHeight: "120px",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          onChange={(event) =>
                            handleFileChange(
                              booking._id,
                              "before",
                              event.target.files,
                            )
                          }
                        />

                        <span style={{ fontSize: "14px", color: "#374151" }}>
                          Click to upload pickup images
                        </span>

                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                          JPG, PNG up to 5MB
                        </span>
                      </label>

                      {/* Upload Button */}
                      {fileState[beforeKey]?.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                          disabled={
                            activeRequest === beforeKey ||
                            !fileState[beforeKey]?.length
                          }
                          onClick={() => handleUpload(booking._id, "before")}
                        >
                          <FiUploadCloud />
                          {activeRequest === beforeKey
                            ? "Uploading..."
                            : "Upload Images"}
                        </button>
                      )}

                      {/* Preview Grid */}
                      {fileState[beforeKey]?.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(100px, 1fr))",
                            gap: "10px",
                          }}
                        >
                          {fileState[beforeKey].map((file, index) => (
                            <div
                              key={index}
                              style={{
                                position: "relative",
                                borderRadius: "10px",
                                overflow: "hidden",
                                border: "1px solid rgba(17,32,51,0.08)",
                              }}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Pickup Preview ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  objectFit: "cover",
                                }}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeFile(booking._id, "before", index)
                                }
                                style={{
                                  position: "absolute",
                                  top: "5px",
                                  right: "5px",
                                  width: "22px",
                                  height: "22px",
                                  background: "rgba(220,38,38,0.9)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Uploaded Images from Backend */}
                      {booking.conditionReport?.beforeImages?.length > 0 && (
                        <div
                          style={{
                            marginTop: "14px",
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(100px, 1fr))",
                            gap: "10px",
                          }}
                        >
                          {booking.conditionReport.beforeImages.map(
                            (imagePath) => (
                              <SafeImage
                                key={imagePath}
                                src={getStoredImageUrl(imagePath)}
                                fallback={REPORT_IMAGE_FALLBACK}
                                alt="Pickup condition"
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        width: "100%",
                        borderRadius: "16px",
                        padding: "16px",
                        background: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        marginTop: "20px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.1rem",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FiImage /> Return Inspection
                      </h3>

                      <p
                        style={{
                          marginBottom: "12px",
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
                        Upload images after the trip to verify vehicle
                        condition.
                      </p>

                      {/* Upload Box */}
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          border: "2px dashed #d1d5db",
                          borderRadius: "12px",
                          padding: "20px",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "center",
                          minHeight: "120px",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          onChange={(event) =>
                            handleFileChange(
                              booking._id,
                              "after",
                              event.target.files,
                            )
                          }
                        />

                        <span style={{ fontSize: "14px", color: "#374151" }}>
                          Click to upload return images
                        </span>

                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                          JPG, PNG up to 5MB
                        </span>
                      </label>

                      {/* Upload Button */}
                      {fileState[afterKey]?.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                          disabled={
                            activeRequest === afterKey ||
                            !fileState[afterKey]?.length
                          }
                          onClick={() => handleUpload(booking._id, "after")}
                        >
                          <FiUploadCloud />
                          {activeRequest === afterKey
                            ? "Uploading..."
                            : "Upload Images"}
                        </button>
                      )}

                      {/* Preview Grid */}
                      {fileState[afterKey]?.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(100px, 1fr))",
                            gap: "10px",
                          }}
                        >
                          {fileState[afterKey].map((file, index) => (
                            <div
                              key={index}
                              style={{
                                position: "relative",
                                borderRadius: "10px",
                                overflow: "hidden",
                                border: "1px solid rgba(17,32,51,0.08)",
                              }}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Return Preview ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  objectFit: "cover",
                                }}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeFile(booking._id, "after", index)
                                }
                                style={{
                                  position: "absolute",
                                  top: "5px",
                                  right: "5px",
                                  width: "22px",
                                  height: "22px",
                                  background: "rgba(220,38,38,0.9)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Uploaded Images */}
                      {booking.conditionReport?.afterImages?.length > 0 && (
                        <div
                          style={{
                            marginTop: "14px",
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(100px, 1fr))",
                            gap: "10px",
                          }}
                        >
                          {booking.conditionReport.afterImages.map(
                            (imagePath) => (
                              <SafeImage
                                key={imagePath}
                                src={getStoredImageUrl(imagePath)}
                                fallback={REPORT_IMAGE_FALLBACK}
                                alt="Return condition"
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.damageReport?.notes ? (
                    <div className="detail-card compact-card">
                      <h3>Damage review</h3>
                      <p>{booking.damageReport.notes}</p>
                    </div>
                  ) : null}

                  {booking.status === "Booked" ? (
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      disabled={activeRequest === `cancel-${booking._id}`}
                      onClick={() => handleCancel(booking._id)}
                    >
                      <FiXCircle />
                      {activeRequest === `cancel-${booking._id}`
                        ? "Cancelling..."
                        : "Cancel booking"}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
