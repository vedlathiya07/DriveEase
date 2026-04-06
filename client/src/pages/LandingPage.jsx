import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiClock,
  FiMapPin,
  FiShield,
  FiZap,
} from "react-icons/fi";
import API from "../services/api";
import VehicleCard from "../components/VehicleCard";

const experiencePillars = [
  {
    title: "Quick & Hassle-Free Booking",
    description:
      "Search available cars, select dates, and confirm instantly. Real-time availability ensures smooth reservations without delays or conflicts.",
    icon: <FiClock />,
  },
  {
    title: "Secure Payments & Transparent Pricing",
    description:
      "Pay safely with integrated payment gateways and enjoy clear pricing with no hidden charges. Flexible options make bookings convenient.",
    icon: <FiShield />,
  },
  {
    title: "Smart Map & Nearby Services",
    description:
      "Locate cars on the live map and discover nearby petrol pumps, charging stations, cafes, and car wash services for a smoother journey.",
    icon: <FiMapPin />,
  },
];

const trustStats = [
  { value: "120+", label: "Premium Vehicles" },
  { value: "4.9/5", label: "Client Satisfaction" },
  { value: "10 min", label: "Average Booking Time" },
];

export default function LandingPage() {
  const [featuredCars, setFeaturedCars] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadFeaturedCars = async () => {
      try {
        const response = await API.get("/cars", {
          params: { limit: 3, available: true },
        });

        if (!ignore) {
          setFeaturedCars(response.data);
        }
      } catch {
        if (!ignore) {
          setFeaturedCars([]);
        }
      }
    };

    loadFeaturedCars();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="landing-page">
      <style>{`
        .landing-hero-wrapper {
          position: relative;
          padding: 6rem 0 8rem;
          overflow: hidden;
          background: radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.08), transparent 50%),
                      radial-gradient(circle at 10% 90%, rgba(15, 118, 110, 0.12), transparent 50%);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 40px 100px rgba(15, 23, 42, 0.08);
          border-radius: 40px;
          padding: 4rem;
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }

        .premium-pill {
          background: linear-gradient(135deg, rgba(15, 118, 110, 0.15), rgba(249, 115, 22, 0.15));
          color: #0f766e;
          border: 1px solid rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.6rem 1.2rem;
          margin-bottom: 2rem;
          display: inline-flex;
        }

        .hero-title {
          font-size: clamp(3rem, 5.5vw, 4.5rem) !important;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.05 !important;
          margin: 1.5rem 0 !important;
        }

        .hero-subtitle {
          font-size: 1.35rem;
          line-height: 1.7;
          color: #475569 !important;
          max-width: 90%;
          margin-bottom: 2.5rem !important;
        }

        .premium-stats-group {
          display: flex;
          flex-wrap: wrap;
          column-gap: 2rem;
          row-gap: 1.5rem;
          margin-top: 3.5rem;
          padding-top: 2.5rem;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }

        @media (min-width: 768px) {
          .premium-stats-group {
            column-gap: 3rem;
          }
        }

        .premium-stat h4 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f766e;
          margin-bottom: 0.2rem;
          font-family: "Space Grotesk", sans-serif;
        }

        .premium-stat span {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .visual-showcase {
          position: relative;
          border-radius: 40px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(15, 23, 42, 0.2);
          background: url('https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=2615&auto=format&fit=crop') center/cover no-repeat;
          height: 100%;
          min-height: 500px;
          display: flex;
          align-items: flex-end;
          padding: 3rem;
        }

        .visual-showcase::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,23,42,0) 30%, rgba(15,23,42,0.9) 100%);
        }

        .visual-content {
          position: relative;
          z-index: 10;
          color: white;
        }

        .visual-content h3 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          font-family: "Space Grotesk", sans-serif;
        }

        .visual-content p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 1.15rem;
          margin-bottom: 1.5rem;
        }

        .floating-badge {
          position: absolute;
          top: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          padding: 0.8rem 1.5rem;
          border-radius: 999px;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          z-index: 10;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .feature-elegant {
          padding: 3.5rem 3rem;
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.8);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-elegant:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-12px);
          box-shadow: 0 40px 100px rgba(15, 118, 110, 0.12);
        }

        .feature-elegant .icon-wrap {
          width: 4.5rem;
          height: 4.5rem;
          background: linear-gradient(135deg, #0f766e, #115e59);
          color: white;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin-bottom: 2rem;
          box-shadow: 0 20px 40px rgba(15, 118, 110, 0.25);
        }

        .feature-elegant h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #0f172a;
        }

        .section-premium-label {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-premium-label h2 {
          font-size: 3rem;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        @media (max-width: 768px) {
          .glass-card {
            padding: 2.5rem 1.5rem;
            border-radius: 28px;
          }
          .hero-title {
            font-size: clamp(2.5rem, 8vw, 3rem) !important;
          }
          .feature-elegant {
            padding: 2.5rem 1.5rem;
            border-radius: 24px;
          }
          .visual-showcase {
            min-height: 400px;
            padding: 2rem 1.5rem;
          }
          .section-premium-label h2 {
            font-size: 2.2rem;
          }
        }
      `}</style>

      <section className="landing-hero-wrapper">
        <div className="container">
          <div className="hero-grid" style={{ alignItems: "center" }}>
            <div className="glass-card" data-aos="fade-up">
              {/* <span className="pill premium-pill">Excellence in Motion</span> */}
              <h1 className="hero-title">Elevate your driving experience.</h1>
              <p className="hero-subtitle">
                Discover a seamless car rental experience with real-time
                availability, flexible pickup options, and secure bookings.
              </p>

              <div className="hero-actions" style={{ gap: "1rem" }}>
                <Link
                  to="/cars"
                  className="btn btn-primary btn-lg"
                  style={{ padding: "1.2rem 2rem", fontSize: "1.1rem" }}
                >
                  Explore Collection
                  <FiArrowRight />
                </Link>
                <Link
                  to="/map"
                  className="btn btn-outline-light btn-lg"
                  style={{
                    padding: "1.2rem 2rem",
                    fontSize: "1.1rem",
                    background: "rgba(255,255,255,0.4)",
                    borderColor: "rgba(15,23,42,0.1)",
                  }}
                >
                  View Cars Near You
                </Link>
              </div>

              <div className="premium-stats-group">
                {trustStats.map((stat) => (
                  <div key={stat.label} className="premium-stat">
                    <h4>{stat.value}</h4>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="visual-showcase"
              data-aos="fade-left"
              data-aos-delay="200"
            >
              <div className="floating-badge">
                <FiZap style={{ color: "#fbbf24" }} /> Immediate Availability
              </div>
              <div className="visual-content">
                <h3>Porsche 911 GT3</h3>
                <p>Pure performance, delivered directly to you.</p>
                <Link
                  to="/cars"
                  className="btn btn-ghost"
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    borderColor: "rgba(255,255,255,0.4)",
                  }}
                >
                  View Vehicle <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="content-section"
        style={{ padding: "6rem 0", background: "rgba(255,255,255,0.4)" }}
      >
        <div className="container">
          <div className="section-premium-label" data-aos="fade-up">
            <span
              className="pill"
              style={{
                background: "rgba(15,118,110,0.1)",
                color: "#0f766e",
                padding: "0.5rem 1rem",
                marginBottom: "1rem",
                fontSize: "1.2rem",
              }}
            >
              Why Choose DriveEase
            </span>
            <h2>Redefining the standard.</h2>
          </div>

          <div className="feature-grid">
            {experiencePillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className="feature-elegant"
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <div className="icon-wrap">{pillar.icon}</div>
                <h3>{pillar.title}</h3>
                <p style={{ color: "#475569", lineHeight: "1.7" }}>
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="content-section featured-section"
        style={{ padding: "6rem 0 8rem" }}
      >
        <div className="container">
          <div className="section-premium-label" data-aos="fade-up">
            <span
              className="pill"
              style={{
                background: "rgba(15,118,110,0.1)",
                color: "#0f766e",
                padding: "0.5rem 1rem",
                marginBottom: "1rem",
                fontSize: "1.2rem",
              }}
            >
              Curated Selection
            </span>
            <h2>Featured masterpieces.</h2>
          </div>

          <div className="vehicle-grid">
            {featuredCars.map((car, index) => (
              <div
                key={car._id}
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <VehicleCard car={car} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
