import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  BookOpen,
  Calendar,
  Users,
  PenTool,
  BarChart3,
  Bell,
  Settings,
  Shield,
  ShieldCheck,
  Zap,
  ClipboardList,
  Award,
  FileText,
  Library,
  Home,
  Fingerprint,
  Activity,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// ─── Sidebar Section Definitions ────────────────────────────────────
type MenuItem = {
  icon: any;
  label: string;
  path: string;
  roles?: string[];
  badge?: string;
};

type SidebarSection = {
  key: string;
  label: string;
  items: MenuItem[];
  roles?: string[]; // if set, whole section only shows for these roles
};

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    key: "learning",
    label: "Learning",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: BookOpen, label: "My Lessons", path: "/lessons" },
      { icon: Library, label: "Lesson Library", path: "/library" },
      { icon: Calendar, label: "My Shifts", path: "/shifts", roles: ["learner", "employer_admin", "super_admin"] },
      { icon: ClipboardList, label: "Assignments", path: "/assignments", roles: ["learner"] },
      { icon: Award, label: "Certificates", path: "/certificates", roles: ["learner"] },
    ],
  },
  {
    key: "management",
    label: "Management",
    roles: ["content_author", "employer_admin", "super_admin"],
    items: [
      { icon: PenTool, label: "Content Studio", path: "/authoring", roles: ["content_author", "employer_admin", "super_admin"] },
      { icon: FileText, label: "Review Queue", path: "/review", roles: ["employer_admin", "super_admin"] },
      { icon: Users, label: "Roster", path: "/roster", roles: ["employer_admin", "super_admin"] },
      { icon: Zap, label: "Assign Lessons", path: "/assign", roles: ["employer_admin", "super_admin"] },
      { icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["employer_admin", "super_admin"] },
      { icon: TrendingUp, label: "Completion Report", path: "/completion-report", roles: ["employer_admin", "super_admin"] },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    roles: ["employer_admin", "super_admin"],
    items: [
      { icon: Shield, label: "Compliance", path: "/compliance", roles: ["employer_admin", "super_admin"] },
      { icon: ShieldCheck, label: "Security", path: "/security", roles: ["employer_admin", "super_admin"], badge: "New" },
      { icon: Activity, label: "System Status", path: "/status", roles: ["employer_admin", "super_admin"] },
    ],
  },
  {
    key: "account",
    label: "Account",
    items: [
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Fingerprint, label: "Consent & Privacy", path: "/consent" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const SIDEBAR_SECTIONS_OPEN_KEY = "sidebar-sections-open";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-2">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/smarthinkerz-logo-original_15b12a42.jpg"
              alt="Smarthinkerz LearnShift"
              className="h-28 w-auto object-contain"
            />
            <h1 className="text-xl font-semibold tracking-tight text-center text-foreground">Sign in to continue</h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access your personalized micro-learning dashboard and shift-aware training.
            </p>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full shadow-lg hover:shadow-xl transition-all">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const userRole = (user as any)?.appRole || "learner";

  // Collapsible section state — persisted per session
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem(SIDEBAR_SECTIONS_OPEN_KEY);
      return saved ? JSON.parse(saved) : { learning: true, management: true, admin: true, account: true };
    } catch {
      return { learning: true, management: true, admin: true, account: true };
    }
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      sessionStorage.setItem(SIDEBAR_SECTIONS_OPEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Filter sections and items by role
  const visibleSections = useMemo(() => {
    return SIDEBAR_SECTIONS
      .filter((section) => !section.roles || section.roles.includes(userRole))
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.roles || item.roles.includes(userRole)),
      }))
      .filter((section) => section.items.length > 0);
  }, [userRole]);

  const allVisibleItems = useMemo(() => visibleSections.flatMap((s) => s.items), [visibleSections]);
  const activeMenuItem = allVisibleItems.find((item) => location.startsWith(item.path));

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const roleLabel =
    userRole === "super_admin" ? "Super Admin"
    : userRole === "employer_admin" ? "Admin"
    : userRole === "content_author" ? "Author"
    : "Learner";

  const { data: notifications } = trpc.notification.getMyNotifications.useQuery(undefined, { refetchInterval: 60000 });
  const unreadCount = (notifications ?? []).filter((n: any) => !n.readAt).length;

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0">
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/smarthinkerz-logo-original_15b12a42.jpg"
                  alt="Smarthinkerz LearnShift"
                  className="h-24 w-auto object-contain"
                />
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {visibleSections.map((section) => {
              const isOpen = openSections[section.key] !== false;
              return (
                <div key={section.key} className="mb-1">
                  {/* Section header — hidden when sidebar is collapsed */}
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{section.label}</span>
                      {isOpen
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />
                      }
                    </button>
                  )}

                  {/* Items — always show when collapsed (tooltip shows label) */}
                  {(isOpen || isCollapsed) && (
                    <SidebarMenu className="px-2 py-0.5">
                      {section.items.map((item) => {
                        const isActive = location.startsWith(item.path);
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => setLocation(item.path)}
                              tooltip={item.label}
                              className="h-10 transition-all font-normal min-h-[44px]"
                            >
                              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                              <span>{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  )}
                </div>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]">
                  <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-foreground">{user?.name || "User"}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                        {roleLabel}
                      </Badge>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/")} className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home Page</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Desktop top bar */}
        {!isMobile && (
          <div className="flex border-b h-12 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <SmartBreadcrumb className="text-xs" />
            <button
              onClick={() => setLocation("/notifications")}
              className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold tabular-nums">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background min-h-[44px] min-w-[44px]" />
              <span className="tracking-tight text-foreground font-medium">{activeMenuItem?.label ?? "LearnShift"}</span>
            </div>
            <button
              onClick={() => setLocation("/notifications")}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold tabular-nums">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
        <main id="main-content" className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
