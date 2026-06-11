import { Plus, ShoppingCart } from "lucide-react";
import type { InvitationCard } from "../types";

interface CardItemProps {
  card: InvitationCard;
  onAddToCart: (cardId: number, quantity: number) => void;
  loading?: boolean;
}

export default function CardItem({ card, onAddToCart, loading }: CardItemProps) {
  return (
    <div className="card-shadow overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={card.image_url}
          alt={card.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5">
        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
          {card.category}
        </span>
        <h3 className="font-display text-lg font-semibold mt-2 text-stone-900">
          {card.name}
        </h3>
        <p className="text-sm text-stone-500 mt-1 line-clamp-2">{card.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-brand-600">
            ${card.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart(card.id, 1)}
            disabled={loading || card.stock === 0}
            className="btn-primary flex items-center gap-2 text-sm py-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onAddToCart(card.id, 5)}
            disabled={loading}
            className="text-xs text-stone-500 hover:text-brand-600 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add 5
          </button>
          <button
            onClick={() => onAddToCart(card.id, 10)}
            disabled={loading}
            className="text-xs text-stone-500 hover:text-brand-600 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add 10
          </button>
          <span className="text-xs text-stone-400 ml-auto">{card.stock} in stock</span>
        </div>
      </div>
    </div>
  );
}
