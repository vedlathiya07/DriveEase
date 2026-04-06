import { Link } from "react-router-dom";
import { FiCompass, FiPhoneCall, FiShield, FiStar } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link
              to="/"
              className="app-logo-link"
              style={{ marginBottom: "0.5rem" }}
            >
              <img src="/logo.png" alt="DriveEase" className="app-logo-img" />
            </Link>
            <h3 className="footer-title" style={{ marginBottom: "0.5rem" }}>
              Smart Car Rentals Made Simple
            </h3>
            <p className="footer-copy">
              Manage bookings, explore nearby vehicles, upload condition
              reports, and enjoy a complete car rental experience — all in one
              modern platform designed for users, owners, and administrators.
            </p>
          </div>

          <div>
            <p
              className="footer-label"
              style={{ marginLeft: "2rem", marginTop: "1.8rem" }}
            >
              Explore
            </p>
            <div
              className="footer-links"
              style={{ marginLeft: "2rem", marginTop: "0.5rem" }}
            >
              <Link to="/cars">Browse Cars</Link>
              <Link to="/map">Fleet Map</Link>
              <Link to="/my-bookings">My Bookings</Link>
              <Link to="/profile">Profile</Link>
            </div>
          </div>

          <div>
            <p
              className="footer-label"
              style={{ marginLeft: "2rem", marginTop: "1.8rem" }}
            >
              Highlights
            </p>
            <div
              className="footer-badges"
              style={{ marginLeft: "2rem", marginTop: "0.5rem" }}
            >
              <span>
                <FiShield />
                Car Condition Reports
              </span>
              <span>
                <FiCompass />
                Nearby Services Integration
              </span>
              <span>
                <FiStar />
                Owner Add-ons
              </span>
              <span>
                <FiPhoneCall />
                Pickup & Drop Options
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
