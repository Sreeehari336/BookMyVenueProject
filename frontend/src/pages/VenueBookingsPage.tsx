import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  cancelOwnerBooking,
  getVenueBookings,
} from "../services/ownerBookingService.ts";
import type { OwnerBooking } from "../types/ownerBooking.types";
import LogoutButton from "../components/LogoutButton";

import "./VenueBookingsPage.css";

function VenueBookingsPage() {
  const { venueId } = useParams();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(
    null
  );

  const loadBookings = async () => {
    if (!venueId) {
      setError("Invalid venue ID.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);

      const data = await getVenueBookings(Number(venueId));
      setBookings(data);
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to load venue bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [venueId]);

  const handleCancelBooking = async (booking: OwnerBooking) => {
    const confirmed = window.confirm(
      `Cancel booking #${booking.booking_id} for ${booking.customer_name}?`
    );

    if (!confirmed) {
      return;
    }

    setCancelError("");
    setCancellingBookingId(booking.booking_id);

    try {
      await cancelOwnerBooking(booking.booking_id);
      await loadBookings();
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setCancelError(
        typeof detail === "string"
          ? detail
          : "Unable to cancel this booking. Please try again."
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  const confirmedCount = bookings.filter(
    (booking) => booking.status.toLowerCase() === "confirmed"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status.toLowerCase() === "cancelled"
  ).length;

  const revenue = bookings
    .filter((booking) => booking.status.toLowerCase() === "confirmed")
    .reduce((total, booking) => total + booking.total_price, 0);

  return (
    <main className="venue-bookings-page">
      <header className="venue-bookings-navbar">
        <button onClick={() => navigate("/owner/dashboard")}>
          ← Owner Dashboard
        </button>

        <strong>BookMyVenue</strong>
        <LogoutButton />
      </header>

      <section className="venue-bookings-content">
        <div className="venue-bookings-heading">
          <div>
            <p>OWNER PORTAL</p>
            <h1>Venue Bookings</h1>
            <span>Venue ID: {venueId}</span>
          </div>

          <button onClick={() => navigate("/owner/bookings")}>
            View All Bookings
          </button>
        </div>

        {!loading && !error && (
          <section className="venue-bookings-stats">
            <article>
              <span>Total Bookings</span>
              <strong>{bookings.length}</strong>
            </article>

            <article>
              <span>Confirmed</span>
              <strong>{confirmedCount}</strong>
            </article>

            <article>
              <span>Cancelled</span>
              <strong>{cancelledCount}</strong>
            </article>

            <article>
              <span>Confirmed Revenue</span>
              <strong>₹{revenue.toLocaleString("en-IN")}</strong>
            </article>
          </section>
        )}

        {loading && <p>Loading bookings...</p>}

        {!loading && error && (
          <div className="venue-bookings-error">
            <p>{error}</p>
            <button onClick={loadBookings}>Try Again</button>
          </div>
        )}

        {!loading && !error && cancelError && (
          <div className="venue-bookings-error" role="alert">
            <p>{cancelError}</p>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="venue-bookings-empty">
            <h3>No bookings yet</h3>
            <p>This venue doesn't have any bookings.</p>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="venue-bookings-table-wrapper">
            <table className="venue-bookings-table">
              <thead>
                <tr>
                  <th>BOOKING ID</th>
                  <th>CUSTOMER</th>
                  <th>CHECK-IN</th>
                  <th>CHECK-OUT</th>
                  <th>TIME</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td>#{booking.booking_id}</td>

                    <td>
                      <div className="venue-booking-customer">
                        <strong>{booking.customer_name}</strong>
                        <small>{booking.customer_email}</small>
                      </div>
                    </td>

                    <td>{booking.check_in_date}</td>
                    <td>{booking.check_out_date}</td>

                    <td>
                      {booking.start_time.slice(0, 5)} -{" "}
                      {booking.end_time.slice(0, 5)}
                    </td>

                    <td>₹{booking.total_price.toLocaleString("en-IN")}</td>

                    <td>
                      <span
                        className={`venue-booking-status ${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td>
                      {booking.status.toLowerCase() !== "cancelled" && (
                        <button
                          className="venue-booking-cancel-button"
                          disabled={cancellingBookingId !== null}
                          onClick={() => handleCancelBooking(booking)}
                        >
                          {cancellingBookingId === booking.booking_id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default VenueBookingsPage;