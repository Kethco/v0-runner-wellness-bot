"use client";

import { usePathname } from "next/navigation";
import { Activity, Settings, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-api";

const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "History", href: "/history" },
  { label: "Trends", href: "/trends" },
  { label: "Goals", href: "/goals" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  
  const userName = profile?.first_name || user?.email?.split("@")[0] || "Runner";
  const userInitials = profile?.first_name 
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`.toUpperCase()
    : userName.slice(0, 2).toUpperCase();
  
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 bg-card/80 backdrop-blur-xl border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="hidden sm:flex items-baseline gap-1">
          <span className="text-lg font-bold tracking-tight text-foreground">RUNNER</span>
          <span className="text-lg font-bold tracking-tight text-primary">WELLNESS</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <a
              key={link.label}
              href={link.href}
              className={`px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors rounded-lg ${
                isActive
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-border">
            <div className="flex items-center gap-2 mb-6 pt-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold tracking-tight">RUNNER</span>
                <span className="text-base font-bold tracking-tight text-primary">WELLNESS</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`px-4 py-3 text-sm font-medium tracking-wide uppercase transition-colors rounded-lg ${
                      isActive
                        ? "text-foreground bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
              <div className="border-t border-border mt-4 pt-4">
                <a
                  href="/login"
                  className="px-4 py-3 text-sm font-medium tracking-wide uppercase transition-colors rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 block"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="px-4 py-3 text-sm font-medium tracking-wide uppercase transition-colors rounded-lg text-primary hover:bg-primary/10 block"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
        </Button>
        <a href="/settings">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
            <Settings className="w-5 h-5" />
          </Button>
        </a>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity">
              {userInitials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">Pro Athlete</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/profile">Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/coach">Coach Dashboard</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/help">Help</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer"
              onClick={() => signOut()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
