import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found-page">
      <div className="container">
        <div className="not-found-card" data-aos="zoom-in">
          <p className="section-label">Page not found</p>
          <h1>That route is off the map.</h1>
          <p className="section-copy">
            The page you requested does not exist, or the URL may have changed
            during the project upgrade.
          </p>
          <div className="hero-actions">
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
            <Link to="/cars" className="btn btn-outline-light">
              Browse Cars
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
