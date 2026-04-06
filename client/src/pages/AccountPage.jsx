import { useEffect, useState } from "react";
import {
  FiCamera,
  FiHeart,
  FiMail,
  FiPhone,
  FiSave,
  FiUploadCloud,
} from "react-icons/fi";
import API from "../services/api";
import Loader from "../components/Loader";
import VehicleCard from "../components/VehicleCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { formatDate, formatRole } from "../utils/formatters";
import { getUserAvatarUrl, getUserInitials } from "../utils/media";

export default function AccountPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [bookingCount, setBookingCount] = useState(0);
  const [ownerCars, setOwnerCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(() =>
    getUserAvatarUrl(user),
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isChanged =
    profileForm.name !== (user?.name || "") ||
    profileForm.phone !== (user?.phone || "");

  useEffect(() => {
    if (avatarPreview?.startsWith("blob:")) {
      return () => {
        URL.revokeObjectURL(avatarPreview);
      };
    }

    return undefined;
  }, [avatarPreview]);

  useEffect(() => {
    let ignore = false;

    const loadProfileData = async () => {
      try {
        const requests = [API.get("/bookings/my-bookings"), refreshUser()];

        if (user?.role === "owner" || user?.role === "admin") {
          requests.push(API.get("/cars/mine/listings"));
        }

        const [bookingsResponse, refreshedUser, ownerCarsResponse] =
          await Promise.all(requests);

        if (!ignore) {
          setBookingCount(bookingsResponse.data.length);
          setProfileForm({
            name: refreshedUser?.name || user?.name || "",
            phone: refreshedUser?.phone || user?.phone || "",
          });
          setOwnerCars(ownerCarsResponse?.data || []);
          setAvatarPreview(getUserAvatarUrl(refreshedUser));
        }
      } catch {
        if (!ignore) {
          setOwnerCars([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      ignore = true;
    };
  }, [refreshUser, user?.avatar, user?.name, user?.phone, user?.role]);

  const handleChange = (event) => {
    setProfileForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAvatarSelection = (event) => {
    const nextFile = event.target.files?.[0];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!nextFile) {
      return;
    }

    if (!allowedTypes.includes(nextFile.type)) {
      showToast({
        title: "Unsupported image format",
        message: "Please choose a JPG, PNG, or WebP image.",
        tone: "warning",
      });
      event.target.value = "";
      return;
    }

    if (nextFile.size > 5 * 1024 * 1024) {
      showToast({
        title: "Image is too large",
        message: "Please upload a profile photo smaller than 5 MB.",
        tone: "warning",
      });
      event.target.value = "";
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(nextFile);
    setAvatarPreview(URL.createObjectURL(nextFile));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      showToast({
        title: "Choose a photo first",
        message: "Select a JPG, PNG, or WebP image before uploading.",
        tone: "warning",
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await API.post("/users/me/avatar", formData);
      updateUser(response.data.user);
      setAvatarFile(null);
      setAvatarPreview(getUserAvatarUrl(response.data.user));
      showToast({
        title: "Profile photo updated",
        message: "Your new profile image is now live across the platform.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Photo upload failed",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload the selected image.",
        tone: "warning",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const response = await API.put("/users/me", profileForm);
      updateUser(response.data.user);
      showToast({
        title: "Profile updated",
        message: "Your account details were saved successfully.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Save failed",
        message: error.response?.data?.message || "Unable to update profile.",
        tone: "warning",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullHeight label="Loading your account..." />;
  }

  const joinedOn = user?.createdAt ? formatDate(user.createdAt) : "Recently";
  const ownerRole = user?.role === "owner" || user?.role === "admin";
  const avatarUrl = avatarPreview || getUserAvatarUrl(user);
  const initials = getUserInitials(
    profileForm.name || user?.name || "DriveEase",
  );

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Account Dashboard
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
            Manage your profile, track activity, and access your saved cars —
            all in one place.
          </p>
        </div>

        <div className="dashboard-grid profile-dashboard">
          <form className="detail-card profile-card" onSubmit={handleSave}>
            <div className="profile-card-header">
              <div className="profile-identity">
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profileForm.name || user?.name}
                      />
                    ) : (
                      <span className="profile-avatar-fallback">
                        {initials}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <label className="avatar-upload">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleAvatarSelection}
                      />
                      <FiCamera />
                      {avatarFile ? "Change photo" : "Upload Photo"}
                    </label>

                    {avatarFile && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={uploadingAvatar}
                        onClick={handleAvatarUpload}
                        style={{
                          width: "100%",
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <FiUploadCloud />
                        {uploadingAvatar ? "Uploading..." : "Upload photo"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="profile-meta">
                  <span className="pill">{formatRole(user?.role)} Account</span>
                  <h2>{profileForm.name || user?.name}</h2>
                  <p className="muted-line">
                    Add a profile photo and keep your information up to date for
                    a smoother booking experience.
                  </p>
                  <div className="profile-inline">
                    <span>
                      <FiMail /> {user?.email}
                    </span>
                    <span>
                      <FiPhone /> {profileForm.phone || "Add a contact number"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-two-column profile-form-grid">
              <label>
                Full name
                <input
                  name="name"
                  value={profileForm.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label>
                Email address
                <input
                  className="input-readonly"
                  value={user?.email || ""}
                  readOnly
                />
              </label>

              <label>
                Member since
                <input className="input-readonly" value={joinedOn} readOnly />
              </label>
            </div>

            <div className="stats-grid compact-stats">
              <article className="stat-card">
                <span>Total Bookings</span>
                <strong>{bookingCount}</strong>
              </article>
              <article className="stat-card">
                <span>Saved Cars</span>
                <strong>{user?.wishlist?.length || 0}</strong>
              </article>
              <article className="stat-card">
                <span>Cars Listed</span>
                <strong>{ownerCars.length}</strong>
              </article>
            </div>

            {isChanged && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <FiSave />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </form>

          <div className="detail-card profile-insights">
            <div
              className="profile-card-title"
              style={{ display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <h2 style={{ margin: 0 }}>Account Insights</h2>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#0f766e",
                  backgroundColor: "rgba(15,118,110,0.1)",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",
                  fontWeight: 600,
                }}
              >
                Real-time Overview
              </span>
            </div>

            <div className="profile-highlight-list">
              <article className="profile-highlight">
                <span>Primary role</span>
                <strong>{formatRole(user?.role)}</strong>
              </article>
              <article className="profile-highlight">
                <span>Member since</span>
                <strong>{joinedOn}</strong>
              </article>
              <article className="profile-highlight">
                <span>Saved cars</span>
                <strong>{user?.wishlist?.length || 0}</strong>
              </article>
            </div>

            {ownerRole ? (
              <div className="detail-card compact-card">
                <div className="profile-card-title">
                  <h3>Fleet snapshot</h3>
                  <span>{ownerCars.length} active listings</span>
                </div>
                {ownerCars.length ? (
                  <div className="profile-owner-list">
                    {ownerCars.slice(0, 4).map((car) => (
                      <div key={car._id} className="list-row stacked-row">
                        <strong>{car.title}</strong>
                        <span>
                          {car.location} • {car.fuelType}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-line">
                    Your fleet listings will appear here once you add vehicles.
                  </p>
                )}
              </div>
            ) : (
              <div className="detail-card compact-card">
                <div className="profile-card-title">
                  <h3>Account summary</h3>
                </div>
                <p className="muted-line">
                  Keep your profile up to date to ensure seamless booking
                  experiences and faster verifications.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="detail-card profile-wishlist-card">
          <div className="profile-card-title">
            <h2>
              <FiHeart /> Your Saved Cars
            </h2>
            <span>{user?.wishlist?.length || 0} saved cars</span>
          </div>

          {user?.wishlist?.length ? (
            <div className="vehicle-grid compact-vehicle-grid">
              {user.wishlist.map((car) => (
                <VehicleCard key={car._id} car={car} />
              ))}
            </div>
          ) : (
            <div className="empty-inline-state">
              <p className="muted-line">
                You have not saved any vehicles yet. Use the heart icon on fleet
                cards to build your shortlist.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
