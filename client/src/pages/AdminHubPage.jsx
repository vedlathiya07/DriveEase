import { useEffect, useState } from "react";
import { FiBarChart2, FiTrash2, FiUsers } from "react-icons/fi";
import API from "../services/api";
import Loader from "../components/Loader";
import { useToast } from "../components/Toast";
import { formatCurrency, formatDateRange } from "../utils/format";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "cars", label: "Cars" },
  { id: "bookings", label: "Bookings" },
];

export default function AdminHubPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let ignore = false;

    const fetchAdminData = async () => {
      try {
        const [analyticsResponse, usersResponse, carsResponse, bookingsResponse] =
          await Promise.all([
            API.get("/admin/analytics"),
            API.get("/admin/users"),
            API.get("/admin/cars"),
            API.get("/admin/bookings"),
          ]);

        if (!ignore) {
          setStats(analyticsResponse.data.stats);
          setUsers(usersResponse.data.users);
          setCars(carsResponse.data.cars);
          setBookings(bookingsResponse.data.bookings);
        }
      } catch {
        if (!ignore) {
          setStats(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAdminData();

    return () => {
      ignore = true;
    };
  }, []);

  const reloadSection = async () => {
    setLoading(true);

    const [analyticsResponse, usersResponse, carsResponse, bookingsResponse] =
      await Promise.all([
        API.get("/admin/analytics"),
        API.get("/admin/users"),
        API.get("/admin/cars"),
        API.get("/admin/bookings"),
      ]);

    setStats(analyticsResponse.data.stats);
    setUsers(usersResponse.data.users);
    setCars(carsResponse.data.cars);
    setBookings(bookingsResponse.data.bookings);
    setLoading(false);
  };

  const handleDelete = async (type, id) => {
    const endpointMap = {
      user: `/admin/user/${id}`,
      booking: `/admin/booking/${id}`,
      car: `/cars/${id}`,
    };

    try {
      await API.delete(endpointMap[type]);
      await reloadSection();
      showToast({
        title: "Record removed",
        message: `The selected ${type} was deleted successfully.`,
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: error.response?.data?.error || "Please try again later.",
        tone: "warning",
      });
    }
  };

  if (loading) {
    return <Loader fullHeight label="Loading admin analytics..." />;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-hero compact">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Hub</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            Review platform performance and manage operational data.
          </p>
        </div>

        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "choice-chip active" : "choice-chip"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && stats ? (
          <div className="dashboard-layout">
            <div className="stats-grid">
              <article className="stat-card">
                <span>Total users</span>
                <strong>{stats.totalUsers}</strong>
              </article>
              <article className="stat-card">
                <span>Total cars</span>
                <strong>{stats.totalCars}</strong>
              </article>
              <article className="stat-card">
                <span>Total bookings</span>
                <strong>{stats.totalBookings}</strong>
              </article>
              <article className="stat-card">
                <span>Total revenue</span>
                <strong>{formatCurrency(stats.totalRevenue)}</strong>
              </article>
            </div>

            <div className="dashboard-grid">
              <article className="detail-card">
                <h3>
                  <FiBarChart2 /> Popular cars
                </h3>
                <div className="table-card">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.popularCars?.map((car) => (
                        <tr key={car._id}>
                          <td>{car.title || "Untitled vehicle"}</td>
                          <td>{car.bookingsCount}</td>
                          <td>{formatCurrency(car.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="detail-card">
                <h3>
                  <FiUsers /> Recent bookings
                </h3>
                <div className="stack-list">
                  {stats.recentBookings?.map((booking) => (
                    <div key={booking._id} className="list-row stacked-row">
                      <strong>{booking.car?.title}</strong>
                      <span>
                        {booking.user?.name} - {formatDateRange(booking.startDate, booking.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div className="table-card">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete("user", user._id)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "cars" ? (
          <div className="table-card">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Price/day</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car._id}>
                    <td>{car.title}</td>
                    <td>{car.owner?.name || "Unassigned"}</td>
                    <td>{formatCurrency(car.pricePerDay)}</td>
                    <td>{car.availabilityStatus || "Available"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete("car", car._id)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "bookings" ? (
          <div className="table-card">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Car</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.user?.name}</td>
                    <td>{booking.car?.title}</td>
                    <td>{formatDateRange(booking.startDate, booking.endDate)}</td>
                    <td>{booking.status}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete("booking", booking._id)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
