import { Link, Outlet, useLocation } from "react-router-dom";
import { ShoppingBag, Package, Home, Mail } from "lucide-react";

interface LayoutProps {
  cartCount: number;
}

export default function Layout({ cartCount }: LayoutProps) {
  const location = useLocation();

  const navLink = (path: string, label: string, icon: React.ReactNode) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-brand-50 text-brand-700"
            : "text-stone-600 hover:text-brand-600 hover:bg-stone-50"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Mail className="w-7 h-7 text-brand-600" />
              <span className="font-display text-2xl font-bold text-stone-900">
                InviteShop
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navLink("/", "Shop", <Home className="w-4 h-4" />)}
              {navLink("/cart", "Cart", <ShoppingBag className="w-4 h-4" />)}
              {navLink("/track", "Track Order", <Package className="w-4 h-4" />)}
            </nav>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-stone-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p className="font-display text-lg text-white mb-2">InviteShop</p>
          <p>Premium invitation cards delivered to your doorstep.</p>
          <p className="mt-2 text-stone-500">Microservices demo — FastAPI + React</p>
        </div>
      </footer>
    </div>
  );
}
