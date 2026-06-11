import { useCallback, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import TrackPage from "./pages/TrackPage";
import { useSession } from "./hooks/useSession";
import { api } from "./api/client";

export default function App() {
  const { sessionId } = useSession();
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(() => {
    api
      .getCart(sessionId)
      .then((cart) => setCartCount(cart.item_count))
      .catch(() => setCartCount(0));
  }, [sessionId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <Routes>
      <Route element={<Layout cartCount={cartCount} />}>
        <Route
          index
          element={<HomePage sessionId={sessionId} onCartUpdate={refreshCart} />}
        />
        <Route
          path="cart"
          element={<CartPage sessionId={sessionId} onCartUpdate={refreshCart} />}
        />
        <Route path="checkout" element={<CheckoutPage sessionId={sessionId} />} />
        <Route path="track" element={<TrackPage />} />
      </Route>
    </Routes>
  );
}
