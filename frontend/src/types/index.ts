export interface InvitationCard {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
}

export interface CartItem {
  id: number;
  card_id: number;
  card_name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  line_total: number;
}

export interface Cart {
  session_id: string;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

export interface Address {
  recipient_name: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface AddressValidation {
  address: Address;
  is_valid: boolean;
  confidence_score: number;
  issues: string[];
  normalized_address?: Address;
}

export interface ParsedExcelAddress extends Address {
  row_number: number;
  is_valid: boolean;
  issues: string[];
}

export interface CheckoutResponse {
  order_id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  payment_id: string | null;
  payment_status: string | null;
  address_count: number;
  message: string;
}

export interface TrackingEvent {
  status: string;
  message: string;
  location: string | null;
  created_at: string;
}

export interface OrderTracking {
  order_id: string;
  current_status: string;
  events: TrackingEvent[];
}

export interface OrderSummary {
  order_id: string;
  status: string;
  total_amount: number;
  customer_email: string;
  created_at: string;
}
