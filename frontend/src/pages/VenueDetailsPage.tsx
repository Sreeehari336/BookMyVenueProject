import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVenueById } from "../services/venueService";
import {
  createVenueReview,
  getVenueReviews,
} from "../services/reviewService";
import type { VenueReview } from "../services/reviewService";
import type { Venue } from "../types/venue.types";
import "./VenueDetailsPage.css";
import { getVenueImage } from "../utils/venueImages";
import LogoutButton from "../components/LogoutButton";

function VenueDetailsPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadVenue = async () => {
      if (!venueId || !Number.isInteger(Number(venueId)) ||
          Number(venueId) <= 0) {
        setError("Invalid venue ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getVenueById(Number(venueId));
        setVenue(data);
      } catch {
        setError("Unable to load venue details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [venueId]);

  useEffect(() => {
    const id = Number(venueId);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    let active = true;
    const loadReviews = async () => {
      try {
        const data = await getVenueReviews(id);
        if (active) {
          setReviews(data.reviews);
          setCanReview(data.can_review);
          setReviewsError("");
        }
      } catch (err: unknown) {
        if (active) {
          const statusCode = (
            err as { response?: { status?: number } }
          )?.response?.status;
          setReviewsError(
            statusCode === 401
              ? "Sign in as a customer to read and write reviews."
              : "Unable to load venue reviews."
          );
        }
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
  }, [venueId]);

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!venue) {
      return;
    }

    setSubmittingReview(true);
    setReviewsError("");
    setReviewMessage("");

    try {
      const newReview = await createVenueReview(venue.venue_id, {
        rating,
        comment: comment.trim(),
      });
      setReviews((currentReviews) => [newReview, ...currentReviews]);
      setComment("");
      setReviewMessage("Your review was submitted.");
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;
      setReviewsError(
        typeof detail === "string"
          ? detail
          : "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const ratedReviews = reviews.filter(
    (review): review is VenueReview & { rating: number } =>
      review.rating !== null
  );
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((total, review) => total + review.rating, 0) /
        ratedReviews.length
      : null;

  if (loading) {
    return (
      <div className="venue-details-status">
        Loading venue details...
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="venue-details-status">
        <p>{error || "Venue not found."}</p>
        <button onClick={() => navigate("/home")}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="venue-details-page">
      <header className="details-navbar">
        <button
          className="details-brand"
          onClick={() => navigate("/home")}
        >
          BookMyVenue
        </button>

        <button
          className="details-back-button"
          onClick={() => navigate("/home")}
        >
          ← Back to venues
        </button>
        <LogoutButton />
      </header>

      <main className="venue-details-container">
        <div className="details-heading">
          <p className="details-eyebrow">EXPLORE VENUE</p>
          <h1>{venue.title}</h1>
          <p className="details-location">
            {venue.city}
          </p>
        </div>

        <div className="details-image">
          <img
            src={getVenueImage(venue.venue_id)}
            alt={venue.title}
            />
        </div>

        <section className="details-information">
          <div className="details-main-info">
            <h2>About this venue</h2>
            <p>
              Explore this venue and review its pricing and
              capacity before proceeding with your booking.
            </p>
          </div>

          <aside className="details-price-card">
            <p className="details-price-label">Venue pricing</p>
            <p className="details-price">
              ₹{venue.price_per_hour.toLocaleString("en-IN")}
              <span> / hour</span>
            </p>

            <div className="details-divider" />

            <p className="details-capacity">
              <strong>Capacity</strong>
              <span>
                {venue.capacity != null
                  ? `${venue.capacity} people`
                  : "Not specified"}
              </span>
            </p>

            <button
              className="details-book-button"
              // onClick={() =>
              //   navigate(`/bookings/create?venueId=${venue.venue_id}`)
              // }
                 onClick={() =>
                   navigate(`/bookings/create?venueId=${venue.venue_id}`)
                }
              
            >
              Proceed to Booking
            </button>

            <p className="details-book-note">
              Review the venue details before booking.
            </p>
          </aside>
        </section>

        <section className="venue-reviews">
          <div className="venue-reviews-heading">
            <h2>Customer Reviews</h2>
            <p>Ratings and feedback from customers who booked this venue.</p>
            {!reviewsLoading && !reviewsError && averageRating !== null && (
              <div
                className="venue-review-summary"
                aria-label={`Average rating ${averageRating.toFixed(1)} out of 5 from ${ratedReviews.length} reviews`}
              >
                <strong>{averageRating.toFixed(1)}</strong>
                <span aria-hidden="true">
                  {"★".repeat(Math.round(averageRating))}
                  {"☆".repeat(5 - Math.round(averageRating))}
                </span>
                <small>
                  from {ratedReviews.length}{" "}
                  {ratedReviews.length === 1 ? "review" : "reviews"}
                </small>
              </div>
            )}
          </div>

          {reviewsLoading && <p>Loading reviews...</p>}

          {!reviewsLoading && reviewsError && (
            <p className="venue-review-error" role="alert">
              {reviewsError}
            </p>
          )}

          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <p className="venue-reviews-empty">
              No reviews yet for this venue.
            </p>
          )}

          {!reviewsLoading && !reviewsError && reviews.length > 0 && (
            <div className="venue-review-list">
              {reviews.map((review) => (
                <article className="venue-review-card" key={review.review_id}>
                  <div className="venue-review-card-heading">
                    <strong>{review.username}</strong>
                    <span>
                      {review.rating === null
                        ? "Not rated"
                        : `${"★".repeat(review.rating)}${"☆".repeat(
                            5 - review.rating
                          )} (${review.rating}/5)`}
                    </span>
                  </div>
                  <p>{review.comment || "No written comment."}</p>
                </article>
              ))}
            </div>
          )}

          {canReview && (
            <form className="venue-review-form" onSubmit={handleReviewSubmit}>
              <h3>Write a review</h3>
              <label htmlFor="venue-review-rating">Rating</label>
              <select
                id="venue-review-rating"
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very good</option>
                <option value={3}>3 - Good</option>
                <option value={2}>2 - Fair</option>
                <option value={1}>1 - Poor</option>
              </select>

              <label htmlFor="venue-review-comment">Your comment</label>
              <textarea
                id="venue-review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                rows={4}
              />
              <button
                type="submit"
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}

          {reviewMessage && (
            <p className="venue-review-success" role="status">
              {reviewMessage}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default VenueDetailsPage;
