import { Bell, User, CheckCheck, Plus, ChevronRight, Upload, PencilLine, PlusCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("dms_user") || '{"email":"user@gov","role":"officer"}');
  const { notifications, unreadCount, markAllRead, markRead, refresh } = useNotifications();

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    officer: "Officer",
    assistant: "Assistant",
    supervisor: "Supervisor",
    dept_head: "Department Head",
  };

  // Generate breadcrumbs from pathname
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Contextual Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/dashboard')}>
          DocFlow
        </span>
        {pathnames.slice(1).map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 2).join('/')}`;
          const isLast = index === pathnames.slice(1).length - 1;
          const formattedName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          return (
            <div key={name} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <span
                className={isLast ? "text-foreground font-semibold" : "cursor-pointer hover:text-foreground transition-colors"}
                onClick={!isLast ? () => navigate(routeTo) : undefined}
              >
                {formattedName}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Actions Dropdown */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="h-9 gap-1.5 rounded-full px-4 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline-block">New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/40 p-1.5">
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-md text-[13px] font-medium" onClick={() => navigate('/dashboard/files')}>
              <Upload className="w-4 h-4 text-muted-foreground" />
              Upload Document
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-md text-[13px] font-medium" onClick={() => navigate('/dashboard/notes')}>
              <PencilLine className="w-4 h-4 text-muted-foreground" />
              Create Note
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 border-border/40" />
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-md text-[13px] font-medium text-primary focus:text-primary focus:bg-primary/10" onClick={() => navigate('/dashboard/workflow')}>
              <PlusCircle className="w-4 h-4" />
              Start Workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => { if (open) refresh(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted/60">
              <Bell className="w-[18px] h-[18px] text-foreground/80" />
              {/* Connection status dot */}
              <span
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full border-2 border-background bg-emerald-500"
                title="Notifications"
              />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-lg border-border/40">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-normal text-green-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Live
                </span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={markAllRead}
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${!n.read ? "bg-muted/50" : ""}`}
                    onClick={() => {
                      markRead(n.id);
                      // Navigate to the relevant entity
                      if (n.entityType === 'file' && n.entityId) {
                        navigate('/dashboard/files', { state: { selectedFileId: n.entityId } });
                      } else if (n.entityType === 'request' && n.entityId) {
                        navigate('/dashboard/requests', { state: { selectedRequestId: n.entityId } });
                      } else if (n.link) {
                        navigate(n.link);
                      }
                    }}
                  >
                    <span className="font-medium text-sm leading-tight">{n.title}</span>
                    <span className="text-xs text-muted-foreground leading-tight whitespace-normal">{n.message}</span>
                    <div className="flex items-center justify-between w-full mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(n.timestamp).toLocaleString()}
                      </span>
                      {(n.entityType === 'file' || n.entityType === 'request' || n.link) && (
                        <span className="text-[10px] text-primary/70 font-medium">View →</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 py-1.5 h-auto rounded-full hover:bg-muted/60 transition-colors">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <p className="text-[13px] font-semibold leading-none text-foreground/90">{user.email}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border/40 p-1.5">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-border/40" />
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-md cursor-pointer text-sm">
              Profile
            </DropdownMenuItem>
            {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
            <DropdownMenuSeparator className="my-1 border-border/40" />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-600 focus:bg-red-500/10 rounded-md cursor-pointer text-sm font-medium"
              onClick={() => {
                localStorage.removeItem("dms_user");
                window.location.href = "/";
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
