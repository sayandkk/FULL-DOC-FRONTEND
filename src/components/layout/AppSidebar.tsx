import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  FolderOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  GitBranch,
  FileType,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  // { label: "Requests", icon: Inbox, path: "/dashboard/requests" },
  { label: "Inward Register", icon: Inbox, path: "/dashboard/inward" },
  { label: "File Management", icon: FolderOpen, path: "/dashboard/files" },
  { label: "Master Files", icon: ClipboardList, path: "/dashboard/master-files" },
  // { label: "Notes & Drafts", icon: ClipboardList, path: "/dashboard/notes" },
  // { label: "Documents", icon: FileText, path: "/dashboard/documents" },
  { label: "File Tracker", icon: GitBranch, path: "/dashboard/workflow" },
  // { label: "Archive", icon: Archive, path: "/dashboard/archive" },
  { label: "Reports", icon: BarChart3, path: "/dashboard/reports" },
  { label: "Convert", icon: FileType, path: "/dashboard/convert-pdf" },
  // { label: "Search", icon: Search, path: "/dashboard/search" },
];

const deptHeadItems = [
  { label: "Work Flow Creations", icon: Tag, path: "/dashboard/classifications" },
  { label: "Manage Users", icon: Users, path: "/dashboard/users" },
];

const bottomItems = [
  // { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("dms_user") || "{}");
  const isDeptHead = user?.role === "DEPT_HEAD";
  const isAdmin = user?.role === "ADMIN";
  const showManagement = isDeptHead || isAdmin;

  const handleLogout = () => {
    localStorage.removeItem("dms_user");
    window.location.href = "/";
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 sticky top-0 z-20 backdrop-blur-md supports-[backdrop-filter]:bg-sidebar/95",
        collapsed ? "w-16" : "w-[280px]"
      )}
    >
      {/* Header: Workspace Switcher */}
      <div className="flex items-center gap-3 p-4 h-16 border-b border-sidebar-border shrink-0 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground truncate">
              DocFlow Department A
            </span>
            <span className="text-[11px] text-muted-foreground truncate">Main Workspace</span>
          </div>
        )}
      </div>

      {/* Search Bar (Mock Cmd+K) */}
      {!collapsed && (
        <div className="px-4 py-3">
          <button className="flex items-center justify-between w-full px-3 py-2 text-sm text-sidebar-foreground/60 bg-black/5 dark:bg-white/5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Search...</span>
            </div>
            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 space-y-6 overflow-y-auto">

        {/* Favorites Group (Mock) */}
        {/* {!collapsed && (
          <div className="space-y-1">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Favorites</p>
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium text-sidebar-foreground/70 hover:bg-black/5 transition-colors cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>2026_Project_Alpha</span>
            </div>
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium text-sidebar-foreground/70 hover:bg-black/5 transition-colors cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Q1 Budget Approvals</span>
            </div>
          </div>
        )} */}

        {/* Documents Group */}
        <div className="space-y-1">
          {!collapsed && <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Documents</p>}
          {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[6]].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md text-[13px] font-medium transition-all group",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground/80 hover:bg-black/5 dark:hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Action Center Group */}
        <div className="space-y-1">
          {!collapsed && <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Action Center</p>}
          {[navItems[4], navItems[5]].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md text-[13px] font-medium transition-all group",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground/80 hover:bg-black/5 dark:hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Management Group */}
        {showManagement && (
          <div className="space-y-1">
            {!collapsed && <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Management</p>}
            {deptHeadItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-md text-[13px] font-medium transition-all group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground/80 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom Profile / Settings */}
      <div className="p-3 border-t border-sidebar-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 rounded-md text-[13px] font-medium text-sidebar-foreground/80 hover:bg-red-500/10 hover:text-red-600 transition-all w-full"
          title={collapsed ? "Logout" : undefined}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-primary" />
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-sidebar-background" />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="font-semibold text-sm truncate">{user.email || 'Admin User'}</span>
              <span className="text-[10px] text-muted-foreground">Logout</span>
            </div>
          )}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="absolute -right-3 top-6 w-6 h-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-full rounded-full border border-sidebar-border bg-sidebar hover:bg-black/5 dark:hover:bg-white/5 text-sidebar-foreground shadow-sm p-0 flex items-center justify-center transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
