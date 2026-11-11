export interface Venue {
  venue_id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  price_per_hour: number;
  capacity: number | null;
}