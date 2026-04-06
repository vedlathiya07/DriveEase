import { useEffect, useState } from "react";
import { FiPlusCircle, FiTrash2, FiUploadCloud } from "react-icons/fi";
import API from "../services/api";
import Loader from "../components/Loader";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../utils/format";

const emptyAddon = { name: "", price: "" };

const initialForm = {
  title: "",
  brand: "",
  category: "Premium",
  year: "",
  description: "",
  pricePerDay: "",
  location: "",
  fuelType: "Petrol",
  seats: "4",
  transmission: "Automatic",
  mileage: "",
  homeDelivery: false,
  selfPickup: true,
  meetUpPoint: "",
};

export default function FleetManagerPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [addons, setAddons] = useState([emptyAddon]);
  const [images, setImages] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchListings = async () => {
      try {
        const response = await API.get("/cars/mine/listings");

        if (!ignore) {
          setListings(response.data);
        }
      } catch {
        if (!ignore) {
          setListings([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchListings();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshListings = async () => {
    const response = await API.get("/cars/mine/listings");
    setListings(response.data);
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddonChange = (index, field, value) => {
    setAddons((currentAddons) =>
      currentAddons.map((addon, addonIndex) =>
        addonIndex === index ? { ...addon, [field]: value } : addon,
      ),
    );
  };

  const addAddon = () => {
    setAddons((currentAddons) => [...currentAddons, emptyAddon]);
  };

  const removeAddon = (index) => {
    setAddons((currentAddons) =>
      currentAddons.filter((_, addonIndex) => addonIndex !== index),
    );
  };

  const resetForm = () => {
    setForm(initialForm);
    setAddons([emptyAddon]);
    setImages([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append(
        "addons",
        JSON.stringify(
          addons
            .filter((addon) => addon.name)
            .map((addon) => ({
              name: addon.name,
              price: Number(addon.price) || 0,
            })),
        ),
      );

      Array.from(images).forEach((image) => {
        formData.append("images", image);
      });

      await API.post("/cars", formData);
      await refreshListings();
      resetForm();

      showToast({
        title: "Car added",
        message: "Your listing is now live in the DriveEase fleet.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save listing",
        message:
          error.response?.data?.error ||
          "Please review the form and try again.",
        tone: "warning",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (carId) => {
    try {
      await API.delete(`/cars/${carId}`);
      await refreshListings();
      showToast({
        title: "Listing removed",
        message: "The selected vehicle was deleted from your fleet.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: error.response?.data?.error || "Please try again later.",
        tone: "warning",
      });
    }
  };

  if (loading) {
    return <Loader fullHeight label="Loading your fleet workspace..." />;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Manage Your Fleet
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
            Add new cars, manage listings, and track bookings — all in one
            place.
          </p>
        </div>

        <div className="dashboard-grid owner-grid">
          <form className="detail-card listing-form" onSubmit={handleSubmit}>
            <h2>Add a New Vehicle</h2>
            <div className="form-two-column">
              <label>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </label>
              <label>
                Brand
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                />
              </label>
              <label>
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                />
              </label>
              <label>
                Year
                <input name="year" value={form.year} onChange={handleChange} />
              </label>
              <label>
                Daily price
                <input
                  name="pricePerDay"
                  type="number"
                  value={form.pricePerDay}
                  onChange={handleChange}
                />
              </label>
              <label>
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />
              </label>
              <label>
                Fuel type
                <select
                  name="fuelType"
                  value={form.fuelType}
                  onChange={handleChange}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                </select>
              </label>
              <label>
                Seats
                <input
                  name="seats"
                  value={form.seats}
                  onChange={handleChange}
                />
              </label>
              <label>
                Transmission
                <input
                  name="transmission"
                  value={form.transmission}
                  onChange={handleChange}
                />
              </label>
              <label>
                Mileage
                <input
                  name="mileage"
                  value={form.mileage}
                  onChange={handleChange}
                />
              </label>
            </div>

            <p className="muted-line">
              Coordinates are detected automatically from the location you type,
              so you do not need to enter latitude or longitude manually.
            </p>

            <label>
              Description
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <div className="detail-card compact-card">
              <h3>Pickup & Delivery Options</h3>
              <div className="toggle-row">
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    name="homeDelivery"
                    checked={form.homeDelivery}
                    onChange={handleChange}
                  />
                  Home delivery
                </label>
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    name="selfPickup"
                    checked={form.selfPickup}
                    onChange={handleChange}
                  />
                  Self pickup
                </label>
              </div>
              <label>
                Meet-up point
                <input
                  name="meetUpPoint"
                  value={form.meetUpPoint}
                  onChange={handleChange}
                  placeholder="Enter a preferred pickup point (e.g., Railway Station, Mall)"
                />
              </label>
            </div>

            <div className="detail-card compact-card">
              <div className="list-row">
                <h3>Add-ons</h3>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={addAddon}
                >
                  <FiPlusCircle />
                  Add Another Add-on
                </button>
              </div>
              <p className="muted-line">
                Offer extra services to enhance customer experience and increase
                earnings.
              </p>

              <div className="addon-editor">
                {addons.map((addon, index) => (
                  <div key={`${index}-${addon.name}`} className="addon-row">
                    <input
                      placeholder="Add-on name"
                      value={addon.name}
                      onChange={(event) =>
                        handleAddonChange(index, "name", event.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Price(₹)"
                      value={addon.price}
                      onChange={(event) =>
                        handleAddonChange(index, "price", event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeAddon(index)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="detail-card compact-card"
              style={{
                width: "100%",
                borderRadius: "16px",
                padding: "16px",
                background: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                marginTop: "20px",
              }}
            >
              <h3 style={{ marginBottom: "6px" }}>Upload Car Images</h3>

              <p
                style={{
                  marginBottom: "12px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Add clear images of your car to attract more bookings.
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
                  onChange={(event) => {
                    const filesList = event.target.files;
                    if (filesList && filesList.length > 0) {
                      const newFiles = Array.from(filesList);
                      setImages((prev) => {
                        const existing = Array.isArray(prev)
                          ? prev
                          : Array.from(prev || []);
                        return [...existing, ...newFiles];
                      });
                    }
                  }}
                />

                <span style={{ fontSize: "14px", color: "#374151" }}>
                  Click to upload images
                </span>

                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  JPG, PNG up to 5MB
                </span>
              </label>

              {/* Preview Grid */}
              {images?.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {Array.from(images).map((file, index) => (
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
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) =>
                            Array.from(prev).filter((_, i) => i !== index),
                          )
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
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              <FiUploadCloud />
              {submitting ? "Saving listing..." : "Publish Vehicle"}
            </button>
          </form>

          <div className="detail-card">
            <h2>Your Active Listings</h2>
            {listings.length ? (
              <div className="stack-list">
                {listings.map((car) => (
                  <div key={car._id} className="owner-listing-row">
                    <div>
                      <strong>
                        {car.title.charAt(0).toUpperCase() + car.title.slice(1)}
                      </strong>
                      <span>
                        {car.location} - {formatCurrency(car.pricePerDay)} / day
                      </span>
                      <p className="muted-line">
                        {car.activeBookingCount
                          ? `${car.activeBookingCount} active booking${car.activeBookingCount > 1 ? "s" : ""}`
                          : "No active bookings right now"}
                      </p>
                    </div>
                    <div className="owner-listing-actions">
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
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(car._id)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline-state">
                Your fleet is empty right now. Publish your first car to start
                the owner demo flow.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
