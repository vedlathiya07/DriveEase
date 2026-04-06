import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import SiteNavbar from "./components/SiteNavbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/LandingPage"));
const Cars = lazy(() => import("./pages/FleetPage"));
const CarDetails = lazy(() => import("./pages/VehicleDetailsPage"));
const CarMap = lazy(() => import("./pages/ExploreMapPage"));
const Login = lazy(() => import("./pages/AuthLoginPage"));
const Signup = lazy(() => import("./pages/AuthSignupPage"));
const Booking = lazy(() => import("./pages/CheckoutPage"));
const MyBookings = lazy(() => import("./pages/BookingsPage"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccessPage"));
const AdminDashboard = lazy(() => import("./pages/AdminHubPage"));
const AddCar = lazy(() => import("./pages/FleetManagerPage"));
const Profile = lazy(() => import("./pages/AccountPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        document.title = 'Home | DriveEase';
        break;
      case '/cars':
        document.title = 'Fleet | DriveEase';
        break;
      case '/map':
        document.title = 'Map | DriveEase';
        break;
      case '/login':
        document.title = 'Login | DriveEase';
        break;
      case '/signup':
        document.title = 'Sign Up | DriveEase';
        break;
      case '/my-bookings':
        document.title = 'My Bookings | DriveEase';
        break;
      case '/profile':
        document.title = 'Profile | DriveEase';
        break;
      case '/owner/fleet':
        document.title = 'Fleet Management | DriveEase';
        break;
      case '/admin':
        document.title = 'Admin Dashboard | DriveEase';
        break;
      default:
        if (location.pathname.startsWith('/car/')) {
          document.title = 'Vehicle Details | DriveEase';
        } else if (location.pathname.startsWith('/booking-success/')) {
          document.title = 'Booking Success | DriveEase';
        } else if (location.pathname.startsWith('/booking/')) {
          document.title = 'Checkout | DriveEase';
        } else {
          document.title = 'DriveEase';
        }
        break;
    }
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <SiteNavbar />
      <main className="app-main">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/car/:id" element={<CarDetails />} />
            <Route path="/map" element={<CarMap />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/booking/:id"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-success/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/fleet"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <AddCar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
