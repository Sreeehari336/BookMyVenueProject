import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminDashboardStats,
  getAdminRevenue,
} from "../services/adminService";
import type { AdminDashboardStats } from "../services/adminService";
import LogoutButton from "../components/LogoutButton";

import "./AdminDashboardPage.css";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        const [dashboardStats, revenueData] = await Promise.all([
          getAdminDashboardStats(),
          getAdminRevenue(),
        ]);

        if (active) {
          setStats(dashboardStats);
          setRevenue(revenueData.total_revenue);
          setError("");
        }
      } catch (err: unknown) {
        const detail = (
          err as { response?: { data?: { detail?: unknown } } }
        )?.response?.data?.detail;

        if (active) {
          setError(
            typeof detail === "string"
              ? detail
              : "Unable to load admin dashboard. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [retryCount]);

  const retryDashboard = () => {
    setError("");
    setLoading(true);
    setRetryCount((current) => current + 1);
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-navbar">
        <strong>BookMyVenue Admin</strong>
        <div>
          <button onClick={() => navigate("/admin/users")}>
            Manage Users
          </button>
          <button onClick={() => navigate("/admin/bookings")}>
            Manage Bookings
          </button>
          <button onClick={() => navigate("/admin/venues")}>
            Manage Venues
          </button>
          <button onClick={() => navigate("/home")}>Customer Home</button>
          <LogoutButton />
        </div>
      </header>

      <section className="admin-dashboard-content">
        <div className="admin-dashboard-heading">
          <p>ADMIN PORTAL</p>
          <h1>Admin Dashboard</h1>
          <span>Overview of users, venues, bookings, and revenue.</span>
        </div>

        {loading && (
          <p className="admin-dashboard-message">
            Loading admin statistics...
          </p>
        )}

        {!loading && error && (
          <div className="admin-dashboard-error" role="alert">
            <p>{error}</p>
            <button onClick={retryDashboard}>Try Again</button>
          </div>
        )}

        {!loading && !error && stats && revenue !== null && (
          <section className="admin-dashboard-stats">
            <article>
              <span>Total Users</span>
              <strong>{stats.total_users}</strong>
            </article>
            <article>
              <span>Total Owners</span>
              <strong>{stats.total_owners}</strong>
            </article>
            <article>
              <span>Total Venues</span>
              <strong>{stats.total_venues}</strong>
            </article>
            <article>
              <span>Total Bookings</span>
              <strong>{stats.total_bookings}</strong>
            </article>
            <article>
              <span>Active Bookings</span>
              <strong>{stats.active_bookings}</strong>
            </article>
            <article>
              <span>Cancelled Bookings</span>
              <strong>{stats.cancelled_bookings}</strong>
            </article>
            <article>
              <span>Booking Revenue</span>
              <strong>{formatCurrency(revenue)}</strong>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}

export default AdminDashboardPage;
