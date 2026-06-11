import type {
  Address,
  AddressValidation,
  Cart,
  CheckoutResponse,
  InvitationCard,
  OrderSummary,
  OrderTracking,
  ParsedExcelAddress,
} from "../types";

const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail)
    );
  }
  return response.json();
}

export const api = {
  getCards: () => request<InvitationCard[]>("/cards"),

  getCard: (id: number) => request<InvitationCard>(`/cards/${id}`),

  getCart: (sessionId: string) => request<Cart>(`/cart/${sessionId}`),

  addToCart: (sessionId: string, cardId: number, quantity: number) =>
    request<Cart>("/cart/add", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, card_id: cardId, quantity }),
    }),

  updateCartItem: (sessionId: string, itemId: number, quantity: number) =>
    request<Cart>(`/cart/${sessionId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (sessionId: string, itemId: number) =>
    request<Cart>(`/cart/${sessionId}/items/${itemId}`, { method: "DELETE" }),

  validateAddresses: (addresses: Address[]) =>
    request<{
      total: number;
      valid_count: number;
      invalid_count: number;
      results: AddressValidation[];
    }>("/orders/validate-addresses", {
      method: "POST",
      body: JSON.stringify(addresses),
    }),

  parseExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/orders/parse-excel`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || "Upload failed");
    }
    return response.json() as Promise<{
      total: number;
      valid_count: number;
      invalid_count: number;
      addresses: ParsedExcelAddress[];
    }>;
  },

  checkout: (
    sessionId: string,
    customerEmail: string,
    addresses: Address[],
    payment: { method: string; card_number?: string; card_holder?: string }
  ) =>
    request<CheckoutResponse>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        customer_email: customerEmail,
        addresses,
        payment,
      }),
    }),

  getOrder: (orderId: string) => request<Record<string, unknown>>(`/orders/${orderId}`),

  listOrders: (email?: string) => {
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    return request<OrderSummary[]>(`/orders${query}`);
  },

  getTracking: (orderId: string) => request<OrderTracking>(`/tracking/${orderId}`),
};
