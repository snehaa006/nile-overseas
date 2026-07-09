import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Settings,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/stock", label: "Monthly Stock", icon: Boxes, end: false },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, end: false },
  { to: "/admin/settings", label: "Website Settings", icon: Settings, end: false },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut, session } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <span className="font-serif text-lg font-bold text-primary">
          Nile Overseas
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
          {session?.user.email}
        </p>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
