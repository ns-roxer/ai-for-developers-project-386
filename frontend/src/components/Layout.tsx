import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { to: "/", label: "Event Types" },
  { to: "/admin/event-types/new", label: "Create Event Type" },
  { to: "/admin/bookings", label: "Upcoming Bookings" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-8">
          <Link to="/" className="text-lg font-semibold whitespace-nowrap">
            📞 Call Booking
          </Link>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}

