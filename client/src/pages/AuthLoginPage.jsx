import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiShield, FiStar } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useToast } from "../components/Toast";

const highlights = [
  "Secure login with role-based access",
  "Real-time booking and payment tracking",
  "Smooth and responsive user experience",
];

export default function AuthLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: "",
    password: "",
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

    if (!form.email || !form.password) {
      setError("Please enter both your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.post("/users/login", form);
      login(response.data.token, response.data.user);
      showToast({
        title: "Welcome back",
        message: "You are now signed in to DriveEase.",
        tone: "success",
      });

      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="container auth-grid">
        <div className="auth-panel auth-panel-brand" data-aos="fade-right">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            DriveEase Access
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-muted)",
              marginBottom: "1rem",
            }}
          >
            Login to manage bookings, explore cars, and continue your journey
            with a seamless experience.
          </p>

          <div className="auth-highlight-card">
            <div>
              <FiShield />
              <strong>Seamless & Secure Experience</strong>
            </div>
            <p>
              Enjoy secure login, real-time booking updates, and a smooth,
              responsive platform experience.
            </p>
          </div>

          <div className="auth-list">
            {highlights.map((item) => (
              <div key={item} className="list-row">
                <FiStar />
                <span style={{ transform: " translateY(-0.27rem)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-panel auth-panel-form" data-aos="fade-left">
          <div className="auth-card-shell">
            <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
              Welcome Back!
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Login to continue your journey, manage bookings, and access your
              dashboard
            </p>

            {error ? <div className="form-alert">{error}</div> : null}

            <form className="auth-form" onSubmit={handleSubmit}>
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
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
                <FiArrowRight />
              </button>
            </form>

            <p className="auth-helper">
              New to DriveEase?{" "}
              <b>
                <Link to="/signup">Create an account</Link>
              </b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
