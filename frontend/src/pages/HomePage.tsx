import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../api/client";
import CardItem from "../components/CardItem";
import type { InvitationCard } from "../types";

interface HomePageProps {
  sessionId: string;
  onCartUpdate: () => void;
}

export default function HomePage({ sessionId, onCartUpdate }: HomePageProps) {
  const [cards, setCards] = useState<InvitationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCards()
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(cards.map((c) => c.category))];
  const filtered = category ? cards.filter((c) => c.category === category) : cards;

  const handleAddToCart = async (cardId: number, quantity: number) => {
    setAddingId(cardId);
    try {
      await api.addToCart(sessionId, cardId, quantity);
      onCartUpdate();
      const card = cards.find((c) => c.id === cardId);
      setToast(`Added ${quantity}x ${card?.name} to cart`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-brand-200 text-sm font-medium tracking-wide uppercase">
              Premium Invitation Cards
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Make Every Celebration Unforgettable
          </h1>
          <p className="text-brand-100 text-lg max-w-2xl mx-auto">
            Browse our curated collection of elegant invitation cards. Order for one
            address or hundreds — upload an Excel sheet for bulk delivery.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !category
                ? "bg-brand-600 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:border-brand-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-brand-600 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-brand-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-shadow h-80 animate-pulse bg-stone-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onAddToCart={handleAddToCart}
                loading={addingId === card.id}
              />
            ))}
          </div>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-stone-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
