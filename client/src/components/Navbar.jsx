/* eslint-disable */
// =====================================
// NAVBAR COMPONENT (FIXED + SAFE)
// =====================================

import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  // LOAD USER FROM LOCAL STORAGE (SAFE VERSION)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("User parse error:", error);
      setUser(null);
    }
  }, []);

  // LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null); // update UI instantly
    navigate("/login");
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow sticky-top"
      style={{
        background: "rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        zIndex: 1030,
      }}
    >
      <div className="container">
        {/* LOGO */}
        <Link className="navbar-brand fw-bold" to="/">
          🚗 DriveEase
        </Link>

        {/* MOBILE TOGGLE */}
        <button
          className="navbar-toggler"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav ms-auto align-items-center">
            {/* NAV LINKS */}
            <li className="nav-item">
              <Link className="nav-link" to="/cars">
                Cars
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/map">
                Map
              </Link>
            </li>

            {/* AUTH LINKS */}
            {!user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="btn btn-primary ms-2 px-3" to="/signup">
                    Signup
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/my-bookings">
                    My Bookings
                  </Link>
                </li>

                {/* ADMIN */}
                {user?.role === "admin" && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">
                      Admin
                    </Link>
                  </li>
                )}

                {/* USER NAME */}
                <li className="nav-item">
                  <span className="nav-link text-warning fw-bold">
                    {user?.name}
                  </span>
                </li>

                {/* LOGOUT */}
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light ms-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}

            {/* DARK MODE */}
            <li className="nav-item ms-3">
              <button
                className="btn btn-outline-light"
                onClick={() => document.body.classList.toggle("dark")}
              >
                🌙
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
