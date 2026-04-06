import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      {/* HERO SECTION */}
      <div className="hero text-white text-center">
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">
            Rent Cars Anytime, Anywhere 🚗
          </h1>
          <p className="mb-4">
            Choose from a wide range of cars with flexible booking and secure
            payments.
          </p>

          <Link to="/cars" className="btn btn-primary btn-lg px-4">
            Explore Cars
          </Link>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="container py-5">
        <h2 className="text-center mb-5">Why Choose DriveEase?</h2>

        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="card p-4 h-100">
              <h5>🚗 Wide Range of Cars</h5>
              <p className="text-muted">
                Choose from economy to luxury cars for every need.
              </p>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card p-4 h-100">
              <h5>💳 Secure Payments</h5>
              <p className="text-muted">
                Pay easily with Razorpay integration.
              </p>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card p-4 h-100">
              <h5>📍 Nearby Services</h5>
              <p className="text-muted">
                Find petrol pumps, cafes, and charging stations nearby.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
