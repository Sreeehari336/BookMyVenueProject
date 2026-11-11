
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelMyBooking, getMyBookings } from "../services/bookingService";
import { getVenueById } from "../services/venueService";
import LogoutButton from "../components/LogoutButton";
import type { BookingResponse } from "../types/booking.types";
import "./MyBookingsPage.css";

function MyBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [venueNames, setVenueNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setError("");

        const data = await getMyBookings();
        setBookings(data);

        const uniqueVenueIds = [
          ...new Set(data.map((booking) => booking.venue_id)),
        ];

        const venueResults = await Promise.all(
          uniqueVenueIds.map(async (venueId) => {
            try {
              const venue = await getVenueById(venueId);
              return [venueId, venue.title] as const;
            } catch {
              return [venueId, `Venue #${venueId}`] as const;
            }
          })
        );

        setVenueNames(Object.fromEntries(venueResults));
      } catch (err: unknown) {
        const detail = (
          err as { response?: { data?: { detail?: unknown } } }
        )?.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load your bookings. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const handleCancelBooking = async (booking: BookingResponse) => {
    const confirmed = window.confirm(
      `Cancel booking #${booking.booking_id}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setCancellationError("");
    setCancellingBookingId(booking.booking_id);

    try {
      const updatedBooking = await cancelMyBooking(booking.booking_id);
      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.booking_id === updatedBooking.booking_id
            ? updatedBooking
            : currentBooking
        )
      );
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setCancellationError(
        typeof detail === "string"
          ? detail
          : "Unable to cancel this booking. Please try again."
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <main className="my-bookings-page">
      <header className="my-bookings-navbar">
        <button
          className="my-bookings-brand"
          onClick={() => navigate("/home")}
        >
          BookMyVenue
        </button>

        <button
          className="my-bookings-back"
          onClick={() => navigate("/home")}
        >
          ← Back to Home
        </button>
        <LogoutButton />
      </header>

      <section className="my-bookings-content">
        <p className="my-bookings-eyebrow">YOUR RESERVATIONS</p>
        <h1>My Bookings</h1>
        <p className="my-bookings-subtitle">
          View and manage your venue reservations.
        </p>

        {loading && (
          <p className="my-bookings-message">Loading your bookings...</p>
        )}

        {!loading && error && (
          <div className="my-bookings-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="my-bookings-empty">
            <h2>You have no bookings yet</h2>
            <p>
              Once you book a venue, your reservation will appear here.
            </p>
            <button onClick={() => navigate("/home")}>
              Explore Venues
            </button>
          </div>
        )}

        {!loading && !error && cancellationError && (
          <div className="my-bookings-error" role="alert">
            <p>{cancellationError}</p>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="my-bookings-list">
            {bookings.map((booking) => (
              <article
                className="my-booking-card"
                key={booking.booking_id}
              >
                <div className="my-booking-header">
                  <div>
                    <p className="my-booking-label">BOOKING ID</p>
                    <h2>#{booking.booking_id}</h2>
                  </div>

                  <span
                    className={`my-booking-status ${booking.status.toLowerCase()}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="my-booking-details">
                  <div>
                    <span>Venue</span>
                    <strong>
                      {venueNames[booking.venue_id] ??
                        `Venue #${booking.venue_id}`}
                    </strong>
                  </div>

                  <div>
                    <span>Check-in</span>
                    <strong>
                      {booking.check_in_date} at {booking.start_time}
                    </strong>
                  </div>

                  <div>
                    <span>Check-out</span>
                    <strong>
                      {booking.check_out_date} at {booking.end_time}
                    </strong>
                  </div>

                  <div>
                    <span>Total price</span>
                    <strong>
                      ₹{booking.total_price.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="my-booking-actions">
                  <button
                    onClick={() =>
                      navigate(`/venues/${booking.venue_id}`)
                    }
                  >
                    View Venue
                  </button>
                  {booking.status.toLowerCase() !== "cancelled" && (
                    <button
                      className="my-booking-cancel"
                      disabled={cancellingBookingId !== null}
                      onClick={() => void handleCancelBooking(booking)}
                    >
                      {cancellingBookingId === booking.booking_id
                        ? "Cancelling..."
                        : "Cancel Booking"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyBookingsPage;
