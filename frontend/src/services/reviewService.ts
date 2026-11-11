import api from "./api";

export interface VenueReview {
  review_id: number;
  user_id: number;
  username: string;
  venue_id: number;
  rating: number | null;
  comment: string | null;
}

export interface VenueReviewsResponse {
  reviews: VenueReview[];
  can_review: boolean;
}

export interface ReviewCreate {
  rating: number;
  comment?: string;
}

export const getVenueReviews = async (
  venueId: number
): Promise<VenueReviewsResponse> => {
  const response = await api.get<VenueReviewsResponse>(
    `/venues/${venueId}/reviews`
  );
  return response.data;
};

export const createVenueReview = async (
  venueId: number,
  review: ReviewCreate
): Promise<VenueReview> => {
  const response = await api.post<VenueReview>(
    `/venues/${venueId}/reviews`,
    review
  );
  return response.data;
};
