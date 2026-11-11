import api from "./api";
import type { Venue } from "../types/venue.types";



export interface VenueCreate {
  title: string;
  description: string;
  address: string;
  city: string;
  price_per_hour: number;
  capacity: number | null;
}
export const getMyVenues = async (): Promise<Venue[]> => {
  const response = await api.get<Venue[]>("/venues/myvenues");
  return response.data;
};

export const addVenue = async (venue: VenueCreate) => {
  const response = await api.post("/venues/addvenues", venue);
  return response.data;
};

export const updateVenue = async (
  venueId: number,
  venue: VenueCreate
) => {
  const response = await api.put(
    `/venues/update/${venueId}`,
    venue
  );

  return response.data;
};

export const deleteVenue = async (venueId: number) => {
  const response = await api.delete(
    `/venues/delete/${venueId}`
  );

  return response.data;
};