import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import VenueDetailsPage from "./pages/VenueDetailsPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AddVenuePage from "./pages/AddVenuePage";
import EditVenuePage from "./pages/EditVenuePage";
import OwnerBookingsPage from "./pages/OwnerBookingsPage";
import VenueBookingsPage from "./pages/VenueBookingsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminVenuesPage from "./pages/AdminVenuesPage";
import RequireRole from "./components/RequireRole";
import FavouritesPage from "./pages/FavouritesPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/venues/:venueId"
          element={<VenueDetailsPage />}
        />
        <Route element={<RequireRole roles={["user"]} />}>
          <Route path="/bookings/create" element={<BookingPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/favourites" element={<FavouritesPage />} />
        </Route>
        <Route element={<RequireRole roles={["owner"]} />}>
          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
          <Route path="/owner/venues/add" element={<AddVenuePage />} />
          <Route
            path="/owner/venues/edit/:venueId"
            element={<EditVenuePage />}
          />
          <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
          <Route
            path="/owner/venues/:venueId/bookings"
            element={<VenueBookingsPage />}
          />
        </Route>
        <Route element={<RequireRole roles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/venues" element={<AdminVenuesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
