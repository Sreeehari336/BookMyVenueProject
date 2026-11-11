
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createBooking } from "../services/bookingService";
import { getVenueById } from "../services/venueService";
import type { Venue } from "../types/venue.types";
import type { BookingResponse } from "../types/booking.types";
import { getVenueImage } from "../utils/venueImages";
import LogoutButton from "../components/LogoutButton";
import "./BookingPage.css";

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const venueId = Number(searchParams.get("venueId"));
  const today = getLocalDateString();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loadingVenue, setLoadingVenue] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<BookingResponse | null>(null);

  useEffect(() => {
    const loadVenue = async () => {
      if (!Number.isInteger(venueId) || venueId <= 0) {
        setError("Invalid venue. Please select a venue first.");
        setLoadingVenue(false);
        return;
      }

      try {
        const data = await getVenueById(venueId);
        setVenue(data);
      } catch {
        setError("Unable to load this venue. Please try again.");
      } finally {
        setLoadingVenue(false);
      }
    };

    loadVenue();
  }, [venueId]);

  const checkInDateTime =
    checkInDate && startTime
      ? new Date(`${checkInDate}T${startTime}:00`)
      : null;

  const checkOutDateTime =
    checkOutDate && endTime
      ? new Date(`${checkOutDate}T${endTime}:00`)
      : null;

  const durationHours =
    checkInDateTime &&
    checkOutDateTime &&
    checkOutDateTime > checkInDateTime
      ? (checkOutDateTime.getTime() - checkInDateTime.getTime()) /
        3600000
      : 0;

  const estimatedPrice =
    venue && durationHours > 0
      ? Math.floor(durationHours * venue.price_per_hour)
      : 0;

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!venue) {
      setError("Venue details are not available.");
      return;
    }

    if (
      !checkInDate ||
      !checkOutDate ||
      !startTime ||
      !endTime
    ) {
      setError("Please complete all booking fields.");
      return;
    }

    if (checkInDate < today) {
      setError("Check-in date cannot be in the past.");
      return;
    }

    const start = new Date(`${checkInDate}T${startTime}:00`);
    const end = new Date(`${checkOutDate}T${endTime}:00`);

    if (end <= start) {
      setError(
        "Check-out date and time must be later than check-in date and time."
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await createBooking({
        venue_id: venue.venue_id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        start_time: startTime,
        end_time: endTime,
      });

      setSuccess(result);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: unknown } } })
          ?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Booking failed. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVenue) {
    return <div className="booking-status">Loading venue details...</div>;
  }

  if (!venue) {
    return (
      <div className="booking-status">
        <p>{error || "Venue not found."}</p>
        <button onClick={() => navigate("/home")}>
          Back to Home
        </button>
        <LogoutButton />
      </div>
    );
  }

  if (success) {
    return (
      <main className="booking-status">
        <div className="booking-success">
          <h1>Booking successful!</h1>
          <p>Your booking has been created.</p>
          <p><strong>Venue:</strong> {venue.title}</p>
          <p><strong>Booking ID:</strong> {success.booking_id}</p>
          <p>
            <strong>Check-in:</strong>{" "}
            {success.check_in_date} at {success.start_time}
          </p>
          <p>
            <strong>Check-out:</strong>{" "}
            {success.check_out_date} at {success.end_time}
          </p>
          <p><strong>Status:</strong> {success.status}</p>
          <p>
            <strong>Total price:</strong>{" "}
            ₹{success.total_price.toLocaleString("en-IN")}
          </p>

          <button onClick={() => navigate("/bookings")}>
            View My Bookings
          </button>
          <button onClick={() => navigate("/home")}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <header className="booking-navbar">
        <button
          className="booking-brand"
          onClick={() => navigate("/home")}
        >
          BookMyVenue
        </button>
        <button
          className="booking-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <LogoutButton />
      </header>

      <div className="booking-layout">
        <section className="booking-form-section">
          <p className="booking-eyebrow">RESERVE YOUR VENUE</p>
          <h1>Complete your booking</h1>
          <p className="booking-subtitle">
            Choose your check-in and check-out dates and times.
          </p>

          {error && <div className="booking-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="checkInDate">Check-in date</label>
            <input
              id="checkInDate"
              type="date"
              value={checkInDate}
              min={today}
              onChange={(event) => {
                const value = event.target.value;
                setCheckInDate(value);

                if (checkOutDate && checkOutDate < value) {
                  setCheckOutDate("");
                }
              }}
              required
            />

            <div className="booking-time-fields">
              <div>
                <label htmlFor="startTime">Check-in time</label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="checkOutDate">Check-out date</label>
                <input
                  id="checkOutDate"
                  type="date"
                  value={checkOutDate}
                  min={checkInDate || today}
                  onChange={(event) => setCheckOutDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <label htmlFor="endTime">Check-out time</label>
            <input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
            />

            <div className="booking-estimate">
              <span>Estimated total</span>
              <strong>
                ₹{estimatedPrice.toLocaleString("en-IN")}
              </strong>
              {durationHours > 0 && (
                <small>
                  {Number.isInteger(durationHours)
                    ? durationHours
                    : durationHours.toFixed(2)}{" "}
                  hour(s)
                </small>
              )}
              {checkInDate &&
                checkOutDate &&
                startTime &&
                endTime &&
                durationHours <= 0 && (
                  <small>
                    Select a valid check-out date and time to calculate the price.
                  </small>
                )}
            </div>

            <button
              className="booking-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creating booking..." : "Confirm Booking"}
            </button>
          </form>
        </section>

        <aside className="booking-venue-card">
          <img
            src={getVenueImage(venue.venue_id)}
            alt={venue.title}
          />
          <div className="booking-venue-info">
            <p className="booking-venue-label">YOUR SELECTED VENUE</p>
            <h2>{venue.title}</h2>
            <p>{venue.city}</p>
            <div className="booking-rate">
              ₹{venue.price_per_hour.toLocaleString("en-IN")} / hour
            </div>
            {venue.capacity != null && (
              <p>Capacity: {venue.capacity} people</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

export default BookingPage;
