/* eslint-disable */
import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/analytics");
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Admin Dashboard 📊</h2>

      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <h5>Users</h5>
            <h3>{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <h5>Cars</h5>
            <h3>{stats.totalCars}</h3>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <h5>Bookings</h5>
            <h3>{stats.totalBookings}</h3>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <h5>Revenue</h5>
            <h3>₹{stats.totalRevenue}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
