import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { api } from "../api/client";
import type { Cart } from "../types";

interface CartPageProps {
  sessionId: string;
  onCartUpdate: () => void;
}

export default function CartPage({ sessionId, onCartUpdate }: CartPageProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    api
      .getCart(sessionId)
      .then(setCart)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, [sessionId]);

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    const updated = await api.updateCartItem(sessionId, itemId, quantity);
    setCart(updated);
    onCartUpdate();
  };

  const removeItem = async (itemId: number) => {
    const updated = await api.removeCartItem(sessionId, itemId);
    setCart(updated);
    onCartUpdate();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">
        Loading cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-semibold text-stone-700">
          Your cart is empty
        </h2>
        <p className="text-stone-500 mt-2">Browse our collection and add some cards!</p>
        <Link to="/" className="btn-primary inline-block mt-6">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="card-shadow p-5 flex gap-4 items-center">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.card_name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-stone-900">{item.card_name}</h3>
              <p className="text-sm text-stone-500">${item.unit_price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="font-bold text-brand-600 w-20 text-right">
              ${item.line_total.toFixed(2)}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="card-shadow p-6 mt-8">
        <div className="flex justify-between text-lg font-semibold">
          <span>Subtotal ({cart.item_count} items)</span>
          <span className="text-brand-600">${cart.subtotal.toFixed(2)}</span>
        </div>
        <p className="text-sm text-stone-500 mt-2">
          Shipping calculated at checkout based on delivery addresses
        </p>
        <Link to="/checkout" className="btn-primary w-full mt-6 text-center block">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
