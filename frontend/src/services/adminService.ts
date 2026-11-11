import api from "./api";
import type { UserResponse, UserRole } from "../types/auth.types";
import type { BookingResponse } from "../types/booking.types";

export interface AdminDashboardStats {
  total_users: number;
  total_owners: number;
  total_venues: number;
  total_bookings: number;
  active_bookings: number;
  cancelled_bookings: number;
}

export interface AdminRevenue {
  total_revenue: number;
}

export interface AdminVenue {
  venue_id: number;
  owner_id: number;
  title: string;
  city: string;
  price_per_hour: number;
  capacity: number | null;
}

export interface AdminVenueCreate {
  title: string;
  description: string;
  address: string;
  city: string;
  price_per_hour: number;
  capacity: number | null;
  owner_id: number;
}

export interface AdminVenueUpdate {
  title: string;
  city: string;
  price_per_hour: number;
  capacity: number | null;
}

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await api.get<AdminDashboardStats>("/admin/dashboard");
  return response.data;
};

export const getAdminRevenue = async (): Promise<AdminRevenue> => {
  const response = await api.get<AdminRevenue>("/admin/revenue");
  return response.data;
};

export const getAdminUsers = async (
  role?: UserRole
): Promise<UserResponse[]> => {
  const response = await api.get<UserResponse[]>("/admin/users", {
    params: role ? { role } : undefined,
  });
  return response.data;
};

export const getAdminVenues = async (): Promise<AdminVenue[]> => {
  const response = await api.get<AdminVenue[]>("/admin/venues");
  return response.data;
};

export const createAdminVenue = async (
  venue: AdminVenueCreate
): Promise<AdminVenue> => {
  const response = await api.post<AdminVenue>("/admin/venues", venue);
  return response.data;
};

export const updateAdminVenue = async (
  venueId: number,
  venue: AdminVenueUpdate
): Promise<AdminVenue> => {
  const response = await api.patch<AdminVenue>(
    `/admin/venues/${venueId}`,
    venue
  );
  return response.data;
};

export const updateAdminVenueOwner = async (
  venueId: number,
  ownerId: number
): Promise<AdminVenue> => {
  const response = await api.patch<AdminVenue>(
    `/admin/venues/${venueId}/owner`,
    { owner_id: ownerId }
  );
  return response.data;
};

export const deleteAdminVenue = async (venueId: number): Promise<void> => {
  await api.delete(`/admin/venues/${venueId}`);
};

export const updateAdminUserRole = async (
  userId: number,
  role: UserRole
): Promise<UserResponse> => {
  const response = await api.patch<UserResponse>(
    `/admin/users/${userId}/role`,
    { role }
  );
  return response.data;
};

export const deleteAdminUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/users/${userId}`);
};

export const getAdminBookings = async (): Promise<BookingResponse[]> => {
  const response = await api.get<BookingResponse[]>("/admin/bookings");
  return response.data;
};

export const cancelAdminBooking = async (
  bookingId: number
): Promise<BookingResponse> => {
  const response = await api.patch<BookingResponse>(
    `/admin/bookings/${bookingId}/cancel`
  );
  return response.data;
};
