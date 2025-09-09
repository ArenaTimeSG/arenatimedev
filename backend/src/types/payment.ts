export interface CreatePreferenceRequest {
  description: string;
  amount: number;
  user_id: string;
  client_name: string;
  client_email: string;
  booking_id: string;
}

export interface CreatePreferenceResponse {
  success: boolean;
  preference_id: string;
  init_point?: string;
  sandbox_init_point?: string;
  error?: string;
}

export interface BookingStatusResponse {
  booking_id: string;
  status: string;
  payment_status?: string;
  payment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookNotification {
  type: string;
  data: {
    id: string;
  };
}
