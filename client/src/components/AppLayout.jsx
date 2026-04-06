import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import ScrollToTop from "./ScrollToTop";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
