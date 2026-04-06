import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCompass, FiLayers, FiUsers } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../components/Toast";

const roleDescriptions = {
  user: "Browse cars, book rentals, manage trips, and upload condition reports.",
  owner:
    "Add your own fleet, configure add-ons and delivery options, and manage listings.",
};

export default function AuthSignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await API.post("/users/signup", form);

      showToast({
        title: "Account created",
        message: "You can now sign in and explore the full platform.",
        tone: "success",
      });

      navigate("/login");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="container auth-grid">
        <div className="auth-panel auth-panel-brand" data-aos="fade-right">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Start Your Journey with DriveEase
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-muted)",
              marginBottom: "2rem",
            }}
          >
            Create an account to discover cars, manage bookings, and access
            smart rental features — all in one place.
          </p>

          <div className="feature-grid compact-grid">
            <article className="feature-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "6px",
                }}
              >
                <div
                  className="feature-icon"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <FiCompass />
                </div>
                <h3>Smart exploration</h3>
              </div>
              <p>
                Browse polished listings and discover services around each car.
              </p>
            </article>

            <article className="feature-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "6px",
                }}
              >
                <div
                  className="feature-icon"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <FiLayers />
                </div>
                <h3>Owner tooling</h3>
              </div>
              <p>
                Create listings with delivery options, add-ons, and image
                galleries.
              </p>
            </article>
            <article className="feature-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "6px",
                }}
              >
                <div
                  className="feature-icon"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <FiUsers />
                </div>
                <h3>Role-aware access</h3>
              </div>
              <p>
                Different experiences for customers, fleet owners, and admins.
              </p>
            </article>
          </div>
        </div>

        <div className="auth-panel auth-panel-form" data-aos="fade-left">
          <div className="auth-card-shell">
            <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
              Create Your Account
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Join DriveEase and start exploring cars, booking trips, and
              managing everything in one seamless platform.
            </p>

            {error ? <div className="form-alert">{error}</div> : null}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                />
              </label>

              <label>
                Register as
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="user">Customer</option>
                  <option value="owner">Fleet owner</option>
                </select>
              </label>

              <p className="muted-line">{roleDescriptions[form.role]}</p>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
                <FiArrowRight />
              </button>
            </form>

            <p className="auth-helper">
              Already have an account?{" "}
              <b>
                <Link to="/login">Login here</Link>
              </b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
