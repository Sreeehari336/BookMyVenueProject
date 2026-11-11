import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LogoutButton from "../components/LogoutButton";
import { removeFavourite, getMyFavourites } from "../services/favouritesService";
import type { Venue } from "../types/venue.types";
import { getVenueImage } from "../utils/venueImages";

import "./FavouritesPage.css";

function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (
    error as { response?: { data?: { detail?: unknown } } }
  )?.response?.data?.detail;

  return typeof detail === "string" ? detail : fallback;
}

function FavouritesPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingVenueId, setRemovingVenueId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadFavourites = async () => {
      try {
        const favourites = await getMyFavourites();
        if (active) {
          setVenues(favourites);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load favourites. Please try again.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadFavourites();
    return () => {
      active = false;
    };
  }, []);

  const handleRemoveFavourite = async (venue: Venue) => {
    setRemovingVenueId(venue.venue_id);
    setError("");

    try {
      await removeFavourite(venue.venue_id);
      setVenues((currentVenues) =>
        currentVenues.filter(
          (currentVenue) => currentVenue.venue_id !== venue.venue_id
        )
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Unable to remove this favourite.")
      );
    } finally {
      setRemovingVenueId(null);
    }
  };

  return (
    <main className="favourites-page">
      <header className="favourites-navbar">
        <button
          className="favourites-brand"
          onClick={() => navigate("/home")}
        >
          BookMyVenue
        </button>
        <div>
          <button onClick={() => navigate("/home")}>Explore Venues</button>
          <LogoutButton />
        </div>
      </header>

      <section className="favourites-content">
        <p className="favourites-eyebrow">YOUR SAVED VENUES</p>
        <h1>Favourites</h1>
        <p className="favourites-subtitle">
          Keep the venues you like in one place.
        </p>

        {loading && <p>Loading your favourites...</p>}

        {!loading && error && (
          <div className="favourites-error" role="alert">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && venues.length === 0 && (
          <div className="favourites-empty">
            <h2>No favourite venues yet</h2>
            <p>Use the heart on a venue card to save it here.</p>
            <button onClick={() => navigate("/home")}>Explore Venues</button>
          </div>
        )}

        {!loading && venues.length > 0 && (
          <div className="favourites-grid">
            {venues.map((venue) => (
              <article className="favourite-card" key={venue.venue_id}>
                <button
                  className="favourite-card-image"
                  onClick={() => navigate(`/venues/${venue.venue_id}`)}
                  aria-label={`View ${venue.title}`}
                >
                  <img src={getVenueImage(venue.venue_id)} alt={venue.title} />
                </button>
                <div className="favourite-card-info">
                  <h2>{venue.title}</h2>
                  <p>{venue.city}</p>
                  <p>{venue.description}</p>
                  <strong>
                    ₹{venue.price_per_hour.toLocaleString("en-IN")} / hour
                  </strong>
                  <div className="favourite-card-actions">
                    <button
                      onClick={() => navigate(`/venues/${venue.venue_id}`)}
                    >
                      View Venue
                    </button>
                    <button
                      className="favourite-remove-button"
                      disabled={removingVenueId === venue.venue_id}
                      onClick={() => void handleRemoveFavourite(venue)}
                    >
                      {removingVenueId === venue.venue_id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default FavouritesPage;
