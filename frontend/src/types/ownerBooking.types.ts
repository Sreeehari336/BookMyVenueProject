
export interface OwnerBooking {
  booking_id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  venue_id: number;
  venue_title: string;
  check_in_date: string;
  check_out_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
}
