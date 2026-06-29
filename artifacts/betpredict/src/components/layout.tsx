import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Flame, LayoutDashboard, Target, TrendingUp, Menu, Hammer } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { SyncBanner } from "./sync-banner";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Match Explorer", icon: Activity },
  { href: "/hot", label: "Hot Games", icon: Flame },
  { href: "/bet-of-the-day", label: "Bet of the Day", icon: Target },
  { href: "/bet-builder", label: "Bet Builder", icon: Hammer },
  { href: "/predictions", label: "Predictions", icon: TrendingUp },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Force dark mode class on document
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground w-64 p-4">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">BetPredict Pro</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"}`}>
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">System Status</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-sidebar-foreground">All Systems Nominal</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 z-40">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-white">BetPredict Pro</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar border-r-sidebar-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Sync status bar */}
        <SyncBanner />

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 bg-grid">
          {children}
        </div>
      </main>
    </div>
  );
}
