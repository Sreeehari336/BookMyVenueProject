
export interface BookingCreate {
  venue_id: number;
  check_in_date: string;
  check_out_date: string;
  start_time: string;
  end_time: string;
}

export interface BookingResponse {
  booking_id: number;
  user_id: number;
  venue_id: number;
  check_in_date: string;
  check_out_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
}
