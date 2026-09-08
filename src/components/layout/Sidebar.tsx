import { Link, useLocation } from "wouter";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Menu, Home, History, LayoutDashboard, Settings, CalendarRange, TrendingUp, Download, Info, LogOut, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const [location] = useLocation();
  const { settings, syncStatus } = useAppContext();
  const { user, signOut } = useAuth();
  const isRTL = settings.language === "ar";
  const { canInstall, install } = usePWAInstall();

  const SyncBadge = () => {
    const config = {
      synced: { icon: Cloud, label: isRTL ? "متزامن" : "Synced", color: "text-emerald-500" },
      syncing: { icon: RefreshCw, label: isRTL ? "كيتزامن..." : "Syncing...", color: "text-amber-500 animate-spin" },
      offline: { icon: CloudOff, label: isRTL ? "بلا نت" : "Offline", color: "text-rose-500" },
      error: { icon: CloudOff, label: isRTL ? "خطأ فالمزامنة" : "Sync error", color: "text-rose-500" },
      "signed-out": { icon: CloudOff, label: "", color: "text-muted-foreground" },
    } as const;
    const c = config[syncStatus];
    if (syncStatus === "signed-out") return null;
    const Icon = c.icon;
    return (
      <div className="flex items-center gap-1.5 px-2 text-[11px] font-medium">
        <Icon className={`h-3 w-3 ${c.color}`} />
        <span className="text-sidebar-foreground/50">{c.label}</span>
      </div>
    );
  };

  const navItems = [
    { href: "/", label: t("nav.reconciliation"), icon: Home },
    { href: "/history", label: t("nav.history"), icon: History },
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/report", label: t("nav.report"), icon: CalendarRange },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
    { href: "/about", label: t("nav.about"), icon: Info },
  ];

  const InstallButton = () => (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={install}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-sidebar-primary/30 bg-sidebar-primary/10 hover:bg-sidebar-primary/20 transition-colors duration-150 group"
          >
            <div className="w-7 h-7 rounded-md bg-sidebar-primary/20 flex items-center justify-center shrink-0 group-hover:bg-sidebar-primary/30 transition-colors">
              <Download className="h-3.5 w-3.5 text-sidebar-primary" />
            </div>
            <div className="text-start">
              <p className="text-xs font-semibold text-sidebar-primary leading-none">Install App</p>
              <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Add to home screen</p>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = location === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={onNav}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 select-none
                ${active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border/60 font-medium"
                }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
              <span className="text-sm tracking-wide">{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  const Logo = () => (
    <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
      <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
        <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
      </div>
      <div>
        <p className="text-sm font-bold text-white leading-none tracking-wide">CashRec</p>
        <p className="text-xs text-sidebar-foreground/50 mt-0.5">Pro</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-60 bg-sidebar h-full min-h-screen border-r border-sidebar-border shrink-0">
        <Logo />
        <NavLinks />
        <div className="mt-auto p-4 border-t border-sidebar-border space-y-3">
          <InstallButton />
          <SyncBadge />
          {user && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
              <button
                onClick={signOut}
                data-testid="button-signout"
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-white">CashRec Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge />
          <AnimatePresence>
            {canInstall && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  onClick={install}
                  size="sm"
                  className="h-8 gap-1.5 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground text-xs font-semibold px-3"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-border/60 h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "left" : "right"} className="w-60 p-0 bg-sidebar border-sidebar-border">
              <Logo />
              <NavLinks />
              <div className="p-4 border-t border-sidebar-border space-y-3">
                <InstallButton />
                {user && (
                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
                    <button
                      onClick={signOut}
                      data-testid="button-signout-mobile"
                      className="text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
