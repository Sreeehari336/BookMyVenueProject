
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOwnerBookings } from "../services/ownerBookingService";
import { getMyVenues } from "../services/ownerService";
import type { OwnerBooking } from "../types/ownerBooking.types";
import type { Venue } from "../types/venue.types";
import LogoutButton from "../components/LogoutButton";
import "./OwnerBookingsPage.css";


function OwnerBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedVenue, setSelectedVenue] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        setError("");

        const [bookingData, venueData] = await Promise.all([
          getOwnerBookings(),
          getMyVenues(),
        ]);

        setBookings(bookingData);
        setVenues(venueData);
      } catch (err: unknown) {
  console.error("Owner bookings loading error:", err);

      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const venueMap = useMemo(() => {
    return new Map(venues.map((venue) => [venue.venue_id, venue.title]));
  }, [venues]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const venueMatches =
        selectedVenue === "all" ||
        booking.venue_id.toString() === selectedVenue;

      const statusMatches =
        selectedStatus === "all" ||
        booking.status.toLowerCase() === selectedStatus;

      return venueMatches && statusMatches;
    });
  }, [bookings, selectedVenue, selectedStatus]);

  const confirmedBookings = bookings.filter(
    (booking) => booking.status.toLowerCase() === "confirmed"
  );

  const cancelledBookings = bookings.filter(
    (booking) => booking.status.toLowerCase() === "cancelled"
  );

  const totalRevenue = confirmedBookings.reduce(
    (total, booking) => total + booking.total_price,
    0
  );

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  return (
    <main className="owner-bookings-page">
      <header className="owner-bookings-navbar">
        <button
          className="owner-bookings-brand"
          onClick={() => navigate("/home")}
        >
          BookMyVenue
        </button>

        <div className="owner-bookings-nav-actions">
          <button onClick={() => navigate("/owner/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => navigate("/home")}>
            Customer Home
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="owner-bookings-content">
        <div className="owner-bookings-heading">
          <div>
            <p className="owner-bookings-eyebrow">OWNER PORTAL</p>
            <h1>Bookings</h1>
            <p>Track and manage reservations across your venues.</p>
          </div>
        </div>

        {loading && (
          <div className="owner-bookings-message">
            Loading booking information...
          </div>
        )}

        {!loading && error && (
          <div className="owner-bookings-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="owner-booking-stats">
              <article className="owner-booking-stat">
                <span>Total Bookings</span>
                <strong>{bookings.length}</strong>
              </article>

              <article className="owner-booking-stat">
                <span>Confirmed</span>
                <strong>{confirmedBookings.length}</strong>
              </article>

              <article className="owner-booking-stat">
                <span>Cancelled</span>
                <strong>{cancelledBookings.length}</strong>
              </article>

              <article className="owner-booking-stat">
                <span>Confirmed Revenue</span>
                <strong>{formatCurrency(totalRevenue)}</strong>
              </article>
            </section>

            <section className="owner-booking-history">
              <div className="owner-booking-history-heading">
                <div>
                  <h2>Booking History</h2>
                  <p>Reservations made at your venues.</p>
                </div>

                <div className="owner-booking-filters">
                  <select
                    value={selectedVenue}
                    onChange={(event) => setSelectedVenue(event.target.value)}
                  >
                    <option value="all">All Venues</option>
                    {venues.map((venue) => (
                      <option
                        key={venue.venue_id}
                        value={venue.venue_id.toString()}
                      >
                        {venue.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="owner-booking-empty">
                  <h3>No bookings found</h3>
                  <p>
                    {bookings.length === 0
                      ? "Your venues haven't received any bookings yet."
                      : "No bookings match the selected filters."}
                  </p>
                </div>
              ) : (
                <div className="owner-booking-table-wrapper">
                  <table className="owner-booking-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Venue</th>
                        <th>Customer</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Time</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.booking_id}>
                          <td>#{booking.booking_id}</td>

                          <td>
                            {venueMap.get(booking.venue_id) ??
                              `Venue #${booking.venue_title}`}
                          </td>

                          <td>
                            <div className="customer-info">
                              <strong>{booking.customer_name}</strong>
                              <small>{booking.customer_email}</small>
                              </div>
                          </td>

                          <td>{formatDate(booking.check_in_date)}</td>

                          <td>{formatDate(booking.check_out_date)}</td>

                          <td>
                            {formatTime(booking.start_time)} -{" "}
                            {formatTime(booking.end_time)}
                          </td>

                          <td className="owner-booking-amount">
                            {formatCurrency(booking.total_price)}
                          </td>

                          <td>
                            <span
                              className={`owner-booking-status ${
                                booking.status.toLowerCase() === "confirmed"
                                  ? "confirmed"
                                  : "cancelled"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="owner-booking-results">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default OwnerBookingsPage;
