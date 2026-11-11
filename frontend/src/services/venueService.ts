import api from "./api";
import type { Venue } from "../types/venue.types";

export const getAllVenues = async (): Promise<Venue[]> => {
  const response = await api.get<Venue[]>("/venues/");
  return response.data;
};

export const getVenuesByCity = async (
  city: string
): Promise<Venue[]> => {
  const response = await api.get<Venue[]>(
    `/venues/location/${encodeURIComponent(city)}`
  );

  return response.data;
};

export const getVenuesByTitle = async (
  title: string
): Promise<Venue[]> => {
  const response = await api.get<Venue[]>(
    `/venues/type/${encodeURIComponent(title)}`
  );

  return response.data;
};

export const getVenueById = async (
  venueId: number
): Promise<Venue> => {
  const response = await api.get<Venue>(
    `/venues/venueid/${venueId}`
  );

  return response.data;
};