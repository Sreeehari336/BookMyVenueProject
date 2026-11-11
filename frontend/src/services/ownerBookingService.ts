
import api from "./api";
import type { OwnerBooking } from "../types/ownerBooking.types";

export const getOwnerBookings = async (): Promise<OwnerBooking[]> => {
  const response = await api.get<OwnerBooking[]>(
    "/bookings/owner/allbookings"
  );
  return response.data;
};

export const getVenueBookings = async (
  venueId: number
): Promise<OwnerBooking[]> => {
  const response = await api.get<OwnerBooking[]>(
    `/bookings/owner/venue/${venueId}`
  );
  return response.data;
};


export const cancelOwnerBooking = async (
  bookingId: number
): Promise<void> => {
  await api.patch(`/bookings/owner/bookings/${bookingId}/cancel`);
};