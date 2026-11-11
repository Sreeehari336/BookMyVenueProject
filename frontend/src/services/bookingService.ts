
import api from "./api";
import type {
  BookingCreate,
  BookingResponse,
} from "../types/booking.types";

export const createBooking = async (
  booking: BookingCreate
): Promise<BookingResponse> => {
  const response = await api.post<BookingResponse>(
    "/bookings/createbooking",
    booking
  );

  return response.data;
};

export const getMyBookings = async (): Promise<BookingResponse[]> => {
  const response = await api.get<BookingResponse[]>("/bookings/my");
  return response.data;
};

export const cancelMyBooking = async (
  bookingId: number
): Promise<BookingResponse> => {
  const response = await api.patch<BookingResponse>(
    `/bookings/${bookingId}/cancel`
  );
  return response.data;
};