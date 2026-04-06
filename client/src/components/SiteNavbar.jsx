import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiLogOut, FiMapPin, FiMenu } from "react-icons/fi";
import { RiSteering2Line } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { getUserAvatarUrl, getUserInitials } from "../utils/media";

const linkClassName = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export default function SiteNavbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user?.name || "DriveEase");

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="site-header">
      <div className="container">
        <nav className="top-nav">
          <Link
            className="brand-mark app-logo-link nav-logo"
            to="/"
            onClick={() => setMenuOpen(false)}
          >
            <img src="/logo.png" alt="DriveEase" className="app-logo-img-nav" />
          </Link>

          <button
            type="button"
            className="nav-toggle"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            aria-label="Toggle navigation"
          >
            <FiMenu />
          </button>

          <div className={menuOpen ? "nav-panel nav-panel-open" : "nav-panel"}>
            <div className="nav-links">
              <NavLink
                to="/cars"
                className={linkClassName}
                onClick={() => setMenuOpen(false)}
              >
                <RiSteering2Line />
                Fleet
              </NavLink>
              <NavLink
                to="/map"
                className={linkClassName}
                onClick={() => setMenuOpen(false)}
              >
                <FiMapPin />
                Map
              </NavLink>
              {isAuthenticated ? (
                <NavLink
                  to="/my-bookings"
                  className={linkClassName}
                  onClick={() => setMenuOpen(false)}
                >
                  <FiGrid />
                  Bookings
                </NavLink>
              ) : null}
              {user?.role === "owner" || user?.role === "admin" ? (
                <NavLink
                  to="/owner/fleet"
                  className={linkClassName}
                  onClick={() => setMenuOpen(false)}
                >
                  <FiGrid />
                  Manage Fleet
                </NavLink>
              ) : null}
              {user?.role === "admin" ? (
                <NavLink
                  to="/admin"
                  className={linkClassName}
                  onClick={() => setMenuOpen(false)}
                >
                  <FiGrid />
                  Admin
                </NavLink>
              ) : null}
            </div>

            <div className="nav-actions">
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link-active" : "nav-link"
                    }
                    onClick={() => setMenuOpen(false)}
                    title="View Profile"
                  >
                    <span
                      className="nav-avatar"
                      style={{ transform: "scale(0.8)", marginLeft: "-0.2rem" }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={user?.name || "Profile"} />
                      ) : (
                        <span className="nav-avatar-fallback">{initials}</span>
                      )}
                    </span>
                    Hi, {user?.name?.split(" ")[0] || "Profile"}
                  </NavLink>
                  <button
                    type="button"
                    className="nav-link"
                    style={{ background: "transparent", border: "none" }}
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-ghost"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
