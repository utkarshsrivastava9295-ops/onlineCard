import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  CheckCircle,
  Circle,
  Search,
  Truck,
  CreditCard,
  Printer,
  MapPin,
} from "lucide-react";
import { api } from "../api/client";
import type { OrderTracking } from "../types";

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "payment_confirmed", label: "Payment Confirmed", icon: CreditCard },
  { key: "processing", label: "Processing", icon: Circle },
  { key: "printing", label: "Printing Cards", icon: Printer },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order") || "");
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTracking(id.trim());
      setTracking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found");
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const param = searchParams.get("order");
    if (param) {
      // `orderId` initial state already reads from `searchParams`.
      // Schedule fetch on the next microtask to avoid calling setState synchronously inside this effect.
      Promise.resolve().then(() => fetchTracking(param));
    }
  }, [searchParams]);

  const currentStepIndex = tracking
    ? STATUS_STEPS.findIndex((s) => s.key === tracking.current_status)
    : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Track Your Order</h1>
      <p className="text-stone-500 mb-8">
        Enter your order ID to see real-time delivery status
      </p>

      <div className="flex gap-3 mb-8">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="e.g. ORD-A1B2C3D4E5F6"
          className="input-field flex-1 font-mono"
        />
        <button
          onClick={() => fetchTracking(orderId)}
          disabled={loading || !orderId}
          className="btn-primary flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? "Searching..." : "Track"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {tracking && (
        <div>
          <div className="card-shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Order ID</p>
                <p className="font-mono font-bold text-lg">{tracking.order_id}</p>
              </div>
              <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                {tracking.current_status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Progress steps */}
          <div className="card-shadow p-6 mb-6">
            <div className="relative">
              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isComplete = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-start gap-4 mb-6 last:mb-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isComplete
                          ? "bg-brand-600 text-white"
                          : "bg-stone-100 text-stone-400"
                      } ${isCurrent ? "ring-4 ring-brand-100" : ""}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="pt-2">
                      <p
                        className={`font-medium ${
                          isComplete ? "text-stone-900" : "text-stone-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-brand-600 mt-0.5">Current status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event timeline */}
          <div className="card-shadow p-6">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {[...tracking.events].reverse().map((event, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium capitalize">
                      {event.status.replace(/_/g, " ")}
                    </p>
                    <p className="text-stone-500">{event.message}</p>
                    <p className="text-stone-400 text-xs mt-0.5">
                      {event.location && `${event.location} · `}
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
