import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./HomePage.css";
import { getVenueImage } from "../utils/venueImages";
import LogoutButton from "../components/LogoutButton";
import { getToken } from "../utils/token";
import { getCurrentUser } from "../services/authService";
import {
  addFavourite,
  getMyFavourites,
  removeFavourite,
} from "../services/favouritesService";
import type { UserRole } from "../types/auth.types";

import {
  getAllVenues,
  getVenuesByCity,
  getVenuesByTitle,
} from "../services/venueService";

import type { Venue } from "../types/venue.types";


// --------------------------------------------------
// Venue images
// --------------------------------------------------

// const venueImages = [
//   "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
//   "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80",
//   "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
//   "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=80",
//   "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80",
//   "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
// ];


function HomePage() {
  const navigate = useNavigate();

  // --------------------------------------------------
  // All venues
  // --------------------------------------------------

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favouriteVenueIds, setFavouriteVenueIds] = useState<number[]>([]);
  const [accountRole, setAccountRole] = useState<UserRole | null>(null);
  const [favouriteError, setFavouriteError] = useState("");
  const [updatingFavouriteId, setUpdatingFavouriteId] = useState<number | null>(
    null
  );


  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const [searchLocation, setSearchLocation] = useState("");
  const [searchType, setSearchType] = useState("");

  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);


  // --------------------------------------------------
  // Load all venues when homepage opens
  // --------------------------------------------------

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    let active = true;

    const loadUserFavourites = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!active) {
          return;
        }

        setAccountRole(currentUser.role);
        if (currentUser.role === "user") {
          const favourites = await getMyFavourites();
          if (active) {
            setFavouriteVenueIds(
              favourites.map((venue) => venue.venue_id)
            );
          }
        }
      } catch {
        if (active) {
          setFavouriteError(
            "Unable to load favourites. Please refresh and try again."
          );
        }
      }
    };

    loadUserFavourites();
    return () => {
      active = false;
    };
  }, []);


  const loadVenues = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllVenues();

      console.log("Venues:", response);

      setVenues(response);
    } catch (err) {
      console.error("Failed to load venues:", err);

      setError("Unable to load venues. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // --------------------------------------------------
  // Search venues
  // --------------------------------------------------

  const handleSearch = async () => {
    const city = searchLocation.trim();
    const type = searchType.trim();

    // Nothing entered
    if (!city && !type) {
      setSearchError("Please enter a location or venue type.");
      setHasSearched(true);
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError("");
      setHasSearched(true);

      let results: Venue[] = [];


      // ----------------------------------------------
      // Search by city
      // ----------------------------------------------

      if (city) {
        results = await getVenuesByCity(city);
      }


      // ----------------------------------------------
      // Search by venue type
      // ----------------------------------------------

      if (type) {
        const typeResults = await getVenuesByTitle(type);


        // If both city and type are entered,
        // only keep venues that exist in both results.
        if (city) {
          results = results.filter((venue) =>
            typeResults.some(
              (typeVenue) =>
                typeVenue.venue_id === venue.venue_id
            )
          );
        } else {
          results = typeResults;
        }
      }


      setSearchResults(results);
    } catch (err) {
      console.error("Venue search failed:", err);

      setSearchResults([]);

      setSearchError(
        "Unable to search venues. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };


  // --------------------------------------------------
  // Clear search / show all venues
  // --------------------------------------------------

  const handleViewAll = () => {
    setSearchLocation("");
    setSearchType("");
    setSearchResults([]);
    setSearchError("");
    setHasSearched(false);
  };

  const handleCategorySelect = async (type: string) => {
    setSearchLocation("");
    setSearchType(type);
    setSearchError("");
    setHasSearched(true);
    setIsSearching(true);
    document.querySelector(".venues-section")?.scrollIntoView({
      behavior: "smooth",
    });

    try {
      const venuesToFilter = loading ? await getAllVenues() : venues;
      if (loading) {
        setVenues(venuesToFilter);
      }

      const searchTerms =
        type === "Party" ? ["party", "parties"] : [type.toLowerCase()];
      const results = venuesToFilter.filter((venue) => {
        const searchableText =
          `${venue.title} ${venue.description}`.toLowerCase();
        return searchTerms.some((term) => searchableText.includes(term));
      });
      setSearchResults(results);
    } catch (err) {
      console.error("Venue category search failed:", err);
      setSearchResults([]);
      setSearchError("Unable to search venues. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleShowAllVenues = () => {
    handleViewAll();
    document.querySelector(".venues-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };


  // --------------------------------------------------
  // Open venue details
  // --------------------------------------------------

  const handleVenueClick = (venueId: number) => {
    navigate(`/venues/${venueId}`);
  };

  const handleToggleFavourite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    venue: Venue
  ) => {
    event.stopPropagation();

    if (!getToken()) {
      navigate("/login");
      return;
    }

    if (accountRole !== "user") {
      setFavouriteError(
        "Favourites are available for customer accounts only."
      );
      return;
    }

    setUpdatingFavouriteId(venue.venue_id);
    setFavouriteError("");

    try {
      if (favouriteVenueIds.includes(venue.venue_id)) {
        await removeFavourite(venue.venue_id);
        setFavouriteVenueIds((currentIds) =>
          currentIds.filter((venueId) => venueId !== venue.venue_id)
        );
      } else {
        await addFavourite(venue.venue_id);
        setFavouriteVenueIds((currentIds) =>
          currentIds.includes(venue.venue_id)
            ? currentIds
            : [...currentIds, venue.venue_id]
        );
      }
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setFavouriteError(
        typeof detail === "string"
          ? detail
          : "Unable to update favourites. Please try again."
      );
    } finally {
      setUpdatingFavouriteId(null);
    }
  };


  // --------------------------------------------------
  // Determine which venues should be displayed
  // --------------------------------------------------

  const displayedVenues = hasSearched
    ? searchResults
    : venues;


  return (
    <div className="home-page">

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() => navigate("/home")}
        >
          <div className="brand-icon">
            B
          </div>

          <span>
            BookMyVenue
          </span>
        </div>


        <nav className="nav-links">

          <button
            className="nav-link active"
            onClick={() => navigate("/home")}
          >
            Home
          </button>


          <button
            className="nav-link"
            onClick={() => {
              document
                .querySelector(".venues-section")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
          >
            Explore
          </button>


          <button
            className="nav-link"
            onClick={() =>
              navigate(
                accountRole === "owner"
                  ? "/owner/dashboard"
                  : accountRole === "admin"
                    ? "/admin/dashboard"
                    : "/bookings"
              )
            }
          >
            {accountRole === "owner"
              ? "Owner Dashboard"
              : accountRole === "admin"
                ? "Admin Dashboard"
                : "My Bookings"}
          </button>

          {accountRole === "user" && (
            <button
              className="nav-link"
              onClick={() => navigate("/favourites")}
            >
              Favourites
            </button>
          )}

        </nav>


        <div className="nav-actions">
          {getToken() ? (
            <LogoutButton />
          ) : (
            <>
              <button
                className="login-button"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
              <button
                className="signup-button"
                onClick={() => navigate("/register")}
              >
                Sign up
              </button>
            </>
          )}

        </div>

      </header>


      {/* ==================================================
          HERO
      ================================================== */}

      <section className="hero">

        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=85"
          alt="Beautiful event venue"
        />


        <div className="hero-overlay"></div>


        <div className="hero-content">

          <p className="hero-small-text">
            MAKE YOUR EVENT SPECIAL
          </p>


          <h1>
            Find the perfect venue
            <br />
            for every occasion
          </h1>


          <p className="hero-description">
            Discover beautiful spaces for weddings,
            celebrations, corporate events and
            everything in between.
          </p>

        </div>


        {/* ==================================================
            SEARCH BOX
        ================================================== */}

        <div className="search-container">

          {/* LOCATION */}

          <div className="search-field">

            <span className="search-icon">
              ⌖
            </span>


            <div>

              <label>
                Location
              </label>


              <input
                type="text"
                placeholder="Where do you want to host?"
                value={searchLocation}
                onChange={(event) =>
                  setSearchLocation(event.target.value)
                }
              />

            </div>

          </div>


          <div className="search-divider"></div>


          {/* VENUE TYPE */}

          <div className="search-field">

            <span className="search-icon">
              ⌂
            </span>


            <div>

              <label>
                Venue type
              </label>


              <input
                type="text"
                placeholder="Wedding, birthday..."
                value={searchType}
                onChange={(event) =>
                  setSearchType(event.target.value)
                }
              />

            </div>

          </div>


          {/* SEARCH BUTTON */}

          <button
            className="search-button"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>

        </div>

      </section>


      {/* ==================================================
          SEARCH ERROR
      ================================================== */}

      {hasSearched && searchError && (

        <section className="search-status-section">

          <div className="error-message">

            <p>
              {searchError}
            </p>

          </div>

        </section>

      )}

      {favouriteError && (
        <section className="search-status-section" role="alert">
          <div className="error-message">
            <p>{favouriteError}</p>
          </div>
        </section>
      )}


      {/* ==================================================
          CATEGORIES
      ================================================== */}

      <section className="categories-section">

        <div className="section-header">

          <div>

            <p className="section-label">
              EXPLORE
            </p>


            <h2>
              Find a venue for any occasion
            </h2>

          </div>

        </div>


        <div className="category-list">

          <button
            className="category-item"
            disabled={isSearching}
            onClick={() => void handleCategorySelect("Wedding")}
          >
            <span className="category-icon">
              💍
            </span>

            <span>
              Weddings
            </span>
          </button>


          <button
            className="category-item"
            disabled={isSearching}
            onClick={() => void handleCategorySelect("Birthday")}
          >
            <span className="category-icon">
              🎂
            </span>

            <span>
              Birthdays
            </span>
          </button>


          <button
            className="category-item"
            disabled={isSearching}
            onClick={() => void handleCategorySelect("Corporate")}
          >
            <span className="category-icon">
              🏢
            </span>

            <span>
              Corporate
            </span>
          </button>


          <button
            className="category-item"
            disabled={isSearching}
            onClick={() => void handleCategorySelect("Party")}
          >
            <span className="category-icon">
              🎉
            </span>

            <span>
              Parties
            </span>
          </button>


          <button
            className="category-item"
            disabled={isSearching}
            onClick={() => void handleCategorySelect("Outdoor")}
          >
            <span className="category-icon">
              🌿
            </span>

            <span>
              Outdoor
            </span>
          </button>


          <button
            className="category-item"
            disabled={isSearching}
            onClick={handleShowAllVenues}
          >
            <span className="category-icon">
              ✨
            </span>

            <span>
              All venues
            </span>
          </button>

        </div>

      </section>


      {/* ==================================================
          VENUES
      ================================================== */}

      <section className="venues-section">

        <div className="section-header venue-header">

          <div>

            <p className="section-label">
              {hasSearched ? "SEARCH RESULTS" : "DISCOVER"}
            </p>


            <h2>
              {hasSearched
                ? "Venues matching your search"
                : "Featured venues"}
            </h2>


            <p className="section-description">

              {hasSearched
                ? "Here are the venues matching your search."
                : "Explore spaces that could be perfect for your next event."}

            </p>

          </div>


          {/* VIEW ALL */}

          {hasSearched && (

            <button
              className="view-all-button"
              onClick={handleViewAll}
            >
              View all
              <span>
                →
              </span>
            </button>

          )}

        </div>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && !hasSearched && (

          <div className="status-message">

            <div className="loader"></div>

            <p>
              Finding beautiful venues...
            </p>

          </div>

        )}


        {/* ==================================================
            SEARCH LOADING
        ================================================== */}

        {isSearching && (

          <div className="status-message">

            <div className="loader"></div>

            <p>
              Searching for venues...
            </p>

          </div>

        )}


        {/* ==================================================
            LOAD ERROR
        ================================================== */}

        {!loading &&
          !hasSearched &&
          error && (

            <div className="error-message">

              <p>
                {error}
              </p>


              <button
                onClick={loadVenues}
              >
                Try again
              </button>

            </div>

          )}


        {/* ==================================================
            NO SEARCH RESULTS
        ================================================== */}

        {!isSearching &&
          hasSearched &&
          !searchError &&
          searchResults.length === 0 && (

            <div className="empty-message">

              <h3>
                No venues found
              </h3>


              <p>
                Try changing your location
                or venue type.
              </p>


              <button
                className="view-all-button"
                onClick={handleViewAll}
              >
                View all venues
              </button>

            </div>

          )}


        {/* ==================================================
            NO VENUES IN DATABASE
        ================================================== */}

        {!loading &&
          !hasSearched &&
          !error &&
          venues.length === 0 && (

            <div className="empty-message">

              <h3>
                No venues available
              </h3>


              <p>
                There are currently no venues
                available.
              </p>

            </div>

          )}


        {/* ==================================================
            VENUE CARDS
        ================================================== */}

        {!loading &&
          !isSearching &&
          !error &&
          displayedVenues.length > 0 && (

            <div className="venue-grid">

                {displayedVenues.map(
                  (venue) => (

                    <article
                      className="venue-card"
                      key={venue.venue_id}
                      onClick={() =>
                        handleVenueClick(
                          venue.venue_id
                        )
                      }
                    >

                    {/* IMAGE */}

                    <div className="venue-image-container">

                      <img
                        src={getVenueImage(venue.venue_id)}
                        alt={venue.title}
                        className="venue-image"
                      />


                      {/* FAVORITE */}

                      <button
                        className={`favorite-button ${
                          favouriteVenueIds.includes(venue.venue_id)
                            ? "is-favorite"
                            : ""
                        }`}
                        onClick={(event) =>
                          void handleToggleFavourite(event, venue)
                        }
                        disabled={updatingFavouriteId === venue.venue_id}
                        aria-pressed={favouriteVenueIds.includes(venue.venue_id)}
                        aria-label={`${
                          favouriteVenueIds.includes(venue.venue_id)
                            ? "Remove"
                            : "Add"
                        } ${venue.title} ${
                          favouriteVenueIds.includes(venue.venue_id)
                            ? "from"
                            : "to"
                        } favourites`}
                      >
                        {favouriteVenueIds.includes(venue.venue_id) ? "♥" : "♡"}
                      </button>


                      {/* BADGE */}

                      <span className="venue-badge">
                        Featured
                      </span>

                    </div>


                    {/* CONTENT */}

                    <div className="venue-card-content">

                      <div className="venue-card-title-row">

                        <h3>
                          {venue.title}
                        </h3>

                      </div>


                      <p className="venue-location">
                        {venue.city}
                      </p>


                      <p className="venue-description">
                        {venue.description}
                      </p>


                      {/* FOOTER */}

                      <div className="venue-card-footer">

                        <div>

                          <strong>
                            ₹{venue.price_per_hour}
                          </strong>


                          <span>
                            {" "}
                            / hour
                          </span>

                        </div>


                        {venue.capacity && (

                          <span className="capacity">
                            Up to {venue.capacity} guests
                          </span>

                        )}

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

      </section>


      {/* ==================================================
          WHY BOOKMYVENUE
      ================================================== */}

      <section className="benefits-section">

        <div className="benefit">

          <div className="benefit-icon">
            ✓
          </div>


          <div>

            <h3>
              Verified venues
            </h3>


            <p>
              Discover quality spaces for your events.
            </p>

          </div>

        </div>


        <div className="benefit">

          <div className="benefit-icon">
            ◷
          </div>


          <div>

            <h3>
              Flexible booking
            </h3>


            <p>
              Choose a date and time that works for you.
            </p>

          </div>

        </div>


        <div className="benefit">

          <div className="benefit-icon">
            ₹
          </div>


          <div>

            <h3>
              Transparent pricing
            </h3>


            <p>
              See the venue price before you book.
            </p>

          </div>

        </div>


        <div className="benefit">

          <div className="benefit-icon">
            ♧
          </div>


          <div>

            <h3>
              Easy booking
            </h3>


            <p>
              Find and reserve your venue in a few clicks.
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="footer">

        <div className="footer-brand">

          <div className="brand">

            <div className="brand-icon">
              B
            </div>


            <span>
              BookMyVenue
            </span>

          </div>


          <p>
            Find the perfect space for your
            next event.
          </p>

        </div>


        <div className="footer-column">

          <h4>
            Explore
          </h4>

          <a>
            Venues
          </a>

          <a>
            Weddings
          </a>

          <a>
            Birthdays
          </a>

          <a>
            Corporate events
          </a>

        </div>


        <div className="footer-column">

          <h4>
            BookMyVenue
          </h4>

          <a>
            About us
          </a>

          <a>
            How it works
          </a>

          <a>
            Contact
          </a>

        </div>


        <div className="footer-column">

          <h4>
            Support
          </h4>

          <a>
            Help center
          </a>

          <a>
            Terms
          </a>

          <a>
            Privacy
          </a>

        </div>

      </footer>

    </div>
  );
}


export default HomePage;