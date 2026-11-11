import api from "./api";
import type { Venue } from "../types/venue.types";

export const getMyFavourites = async (): Promise<Venue[]> => {
  const response = await api.get<Venue[]>("/users/favourites");
  return response.data;
};

export const addFavourite = async (venueId: number): Promise<Venue> => {
  const response = await api.post<Venue>(`/users/favourites/${venueId}`);
  return response.data;
};

export const removeFavourite = async (venueId: number): Promise<void> => {
  await api.delete(`/users/favourites/${venueId}`);
};
