import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  cancelAdminBooking,
  getAdminBookings,
  getAdminUsers,
  getAdminVenues,
} from "../services/adminService";
import type { AdminVenue } from "../services/adminService";
import type { UserResponse } from "../types/auth.types";
import type { BookingResponse } from "../types/booking.types";
import LogoutButton from "../components/LogoutButton";

import "./AdminBookingsPage.css";

type BookingFilter = "all" | "active" | "cancelled";

function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (
    error as { response?: { data?: { detail?: unknown } } }
  )?.response?.data?.detail;

  return typeof detail === "string" ? detail : fallback;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(
    null
  );
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchBookings = async () => {
      try {
        const [bookingData, venueData, userData] = await Promise.all([
          getAdminBookings(),
          getAdminVenues(),
          getAdminUsers(),
        ]);
        if (active) {
          setBookings(bookingData);
          setVenues(venueData);
          setUsers(userData);
          setError("");
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            getErrorMessage(
              err,
              "Unable to load bookings. Please try again."
            )
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      active = false;
    };
  }, [reloadCount]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (filter === "all") {
          return true;
        }

        if (filter === "cancelled") {
          return booking.status.toLowerCase() === "cancelled";
        }

        return booking.status.toLowerCase() !== "cancelled";
      }),
    [bookings, filter]
  );

  const venueById = useMemo(
    () => new Map(venues.map((venue) => [venue.venue_id, venue])),
    [venues]
  );

  const userById = useMemo(
    () => new Map(users.map((user) => [user.user_id, user])),
    [users]
  );

  const handleCancelBooking = async (booking: BookingResponse) => {
    const confirmed = window.confirm(
      `Cancel booking #${booking.booking_id}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setCancellingBookingId(booking.booking_id);
    setActionError("");

    try {
      const updatedBooking = await cancelAdminBooking(booking.booking_id);
      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.booking_id === updatedBooking.booking_id
            ? updatedBooking
            : currentBooking
        )
      );
    } catch (err: unknown) {
      setActionError(
        getErrorMessage(err, "Unable to cancel this booking.")
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  const retryLoadingBookings = () => {
    setLoading(true);
    setError("");
    setReloadCount((count) => count + 1);
  };

  return (
    <main className="admin-bookings-page">
      <header className="admin-bookings-navbar">
        <strong>BookMyVenue Admin</strong>
        <nav>
          <button onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => navigate("/admin/users")}>
            Manage Users
          </button>
          <button onClick={() => navigate("/admin/venues")}>
            Manage Venues
          </button>
          <button onClick={() => navigate("/home")}>Customer Home</button>
          <LogoutButton />
        </nav>
      </header>

      <section className="admin-bookings-content">
        <div className="admin-bookings-heading">
          <div>
            <p>ADMIN PORTAL</p>
            <h1>Bookings</h1>
            <span>Review and manage reservations across all venues.</span>
          </div>

          <label>
            Filter by status
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as BookingFilter)
              }
            >
              <option value="all">All bookings</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        {actionError && (
          <div className="admin-bookings-error" role="alert">
            {actionError}
          </div>
        )}

        {loading && (
          <p className="admin-bookings-message">Loading bookings...</p>
        )}

        {!loading && error && (
          <div className="admin-bookings-error" role="alert">
            <p>{error}</p>
            <button onClick={retryLoadingBookings}>Try Again</button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="admin-bookings-message">
            No bookings have been made yet.
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <>
            {filteredBookings.length === 0 ? (
              <div className="admin-bookings-message">
                No bookings match the selected status.
              </div>
            ) : (
              <div className="admin-bookings-table-wrapper">
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>User ID</th>
                      <th>Venue</th>
                      <th>Venue Owner</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => {
                      const venue = venueById.get(booking.venue_id);
                      const owner = venue
                        ? userById.get(venue.owner_id)
                        : undefined;

                      return (
                        <tr key={booking.booking_id}>
                          <td>#{booking.booking_id}</td>
                          <td>#{booking.user_id}</td>
                          <td>{venue?.title ?? `Venue #${booking.venue_id}`}</td>
                          <td>
                            {owner
                              ? `${owner.username} (${owner.email})`
                              : venue
                                ? `Owner #${venue.owner_id}`
                                : "Owner unavailable"}
                          </td>
                          <td>{formatDate(booking.check_in_date)}</td>
                          <td>{formatDate(booking.check_out_date)}</td>
                          <td>
                            {booking.start_time.slice(0, 5)} -{" "}
                            {booking.end_time.slice(0, 5)}
                          </td>
                          <td>
                            ₹{booking.total_price.toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span
                              className={`admin-booking-status ${booking.status.toLowerCase()}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            {booking.status.toLowerCase() !== "cancelled" && (
                              <button
                                className="admin-booking-cancel"
                                disabled={cancellingBookingId !== null}
                                onClick={() => handleCancelBooking(booking)}
                              >
                                {cancellingBookingId === booking.booking_id
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="admin-bookings-results">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminBookingsPage;
