import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Profile", href: "/profile", icon: <User size={16} /> },
  { label: "Settings", href: "/settings", icon: <Settings size={16} /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-1.5 text-xs font-medium"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none">
                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary/40 transition-all">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium truncate text-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                  <User size={14} /> Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                  <Settings size={14} /> Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                onClick={signOut}
              >
                <LogOut size={14} /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
