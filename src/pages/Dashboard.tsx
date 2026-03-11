import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText, Clock, CheckCircle2, RotateCcw, AlertCircle, RefreshCw, Plus,
  Search, ArrowRight, Activity, HardDrive, Zap, CalendarDays
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, filesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { FileRecord } from "@/lib/types";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  RETURNED: { label: "Returned", variant: "destructive" },
  FORWARDED: { label: "Forwarded", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    returned: 0,
    archived: 0,
    filesProcessedThisWeek: 0,
    activeUsers: 0,
    overdueFiles: 0,
    slaEscalationsOpen: 0,
    weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
    totalStorageBytes: 0,
  });
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [workflowStats, setWorkflowStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, filesRes, wfRes] = await Promise.all([
          dashboardApi.getStats().catch(() => ({ data: null })),
          filesApi.list({ limit: 5 }).catch(() => ({ data: [] })),
          dashboardApi.getWorkflowStats().catch(() => ({ data: [] })),
        ]);

        if (statsRes.data) {
          const s = statsRes.data as any;
          const overview = s.overview || s;

          setStats({
            pending: s.personal?.myPendingFiles ?? overview.pendingFiles ?? overview.pending ?? 0,
            approved: overview.approvedFiles ?? overview.approved ?? 0,
            returned: overview.returnedFiles ?? overview.returned ?? 0,
            archived: overview.archivedFiles ?? overview.archived ?? 0,
            filesProcessedThisWeek: overview.filesProcessedThisWeek ?? 0,
            activeUsers: overview.totalUsers ?? 0,
            overdueFiles: overview.overdueFiles ?? 0,
            slaEscalationsOpen: overview.slaEscalationsOpen ?? 0,
            weeklyTrend: overview.weeklyTrend ?? [0, 0, 0, 0, 0, 0, 0],
            totalStorageBytes: overview.totalStorageBytes ?? 0,
          });
        }
        const d = filesRes.data;
        setRecentFiles(Array.isArray(d) ? d.slice(0, 5) : (d.data || []).slice(0, 5));

        const wfData = wfRes.data;
        setWorkflowStats(Array.isArray(wfData) ? wfData : []);
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const kpiCards = [
    { label: "Pending Files", value: stats.pending, change: "Awaiting action", icon: Clock, gradient: "bg-gradient-to-br from-warning/10 to-warning/5", iconColor: "text-warning", borderColor: "border-warning/20" },
    { label: "Approved Files", value: stats.approved, change: "Successfully closed", icon: CheckCircle2, gradient: "bg-gradient-to-br from-success/10 to-success/5", iconColor: "text-success", borderColor: "border-success/20" },
    { label: "Returned Files", value: stats.returned, change: "Needs attention", icon: RotateCcw, gradient: "bg-gradient-to-br from-destructive/10 to-destructive/5", iconColor: "text-destructive", borderColor: "border-destructive/20" },
    { label: "Overdue Files", value: stats.overdueFiles, change: "Past SLA due date", icon: AlertCircle, gradient: "bg-gradient-to-br from-warning/10 to-warning/5", iconColor: "text-warning", borderColor: "border-warning/30" },
  ];

  const quickActions = [
    { label: "Create File", icon: Plus, desc: "Start a new file", path: "/dashboard/files" },
    { label: "Search Files", icon: Search, desc: "Find files & track movements", path: "/dashboard/workflow" },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">

      {/* Hero Section */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 p-8 rounded-3xl shadow-lg border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl mix-blend-overlay"></div>

        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 text-indigo-200 mb-2">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-sans">
            Good morning{user ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-indigo-100/80 text-[15px] mt-2 font-medium max-w-lg">
            Here's what's happening with your documents and workflows today.
          </p>
        </div>
        <div className="relative z-10 w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
          <Input
            placeholder="Search all files and inwards..."
            className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus-visible:ring-cyan-500/50 rounded-xl shadow-inner backdrop-blur-md transition-all hover:bg-white/15 focus:bg-white/20"
          />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="border-none shadow-sm bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative">
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${kpi.gradient}`} />
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold font-sans text-foreground/90 group-hover:text-indigo-950 transition-colors">
                    {loading ? "—" : kpi.value}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate">
                    {kpi.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${kpi.borderColor} ${kpi.gradient} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">

        {/* Top Left (Large): Activity Pulse */}
        <Card className="md:col-span-8 shadow-card border-none bg-white/80 backdrop-blur-md overflow-hidden rounded-2xl flex flex-col justify-between min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-sans flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Activity Pulse
              </CardTitle>
              <CardDescription className="text-sm mt-1">File processing volume over the last 7 days</CardDescription>
            </div>
            {loading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end p-0">
            {/* Dynamic line chart area */}
            <div className="relative h-64 w-full bg-gradient-to-t from-indigo-50/50 to-transparent mt-4 opacity-80 border-t border-indigo-100/50">
              {(() => {
                const defaultTrend = [0, 0, 0, 0, 0, 0, 0];
                const trendData = Array.isArray(stats.weeklyTrend) ? stats.weeklyTrend : defaultTrend;
                const displayTrend = trendData.every(v => v === 0) ? [0, 0, 0.5, 0, 0, 0, 0] : trendData; // tiny bump if flat
                const maxTrend = Math.max(...displayTrend, 5);

                const points = displayTrend.map((val, i) => {
                  const x = (i / 6) * 100;
                  const y = 80 - (val / maxTrend) * 60; // peak at ~20, dip at ~80
                  return `${x},${y}`;
                });

                const linePath = `M ${points.map((p, i) => i === 0 ? p : `L ${p}`).join(" ")}`;
                const fillPath = `${linePath} L 100,100 L 0,100 Z`;

                return (
                  <svg className="absolute bottom-0 w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d={fillPath} fill="currentColor" className="text-indigo-500/10" />
                    <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500 drop-shadow-md" />
                  </svg>
                );
              })()}
              {/* Overlay Stats */}
              <div className="absolute top-6 left-6 flex gap-8">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processed</p>
                  <p className="text-3xl font-bold font-sans text-indigo-950 mt-1">{loading ? "—" : stats.filesProcessedThisWeek}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-bold font-sans text-indigo-950 mt-1">{loading ? "—" : stats.pending}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Right (Small): Pending for You */}
        <Card className="md:col-span-4 shadow-card border-none bg-white/80 backdrop-blur-md rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-80" />
          <CardHeader className="pb-3 border-b border-black/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-sans flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Pending for You
              </CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 rounded-full px-2.5">
                {stats.pending} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading...
              </div>
            ) : recentFiles.filter(f => f.status === 'PENDING').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400 opacity-50" />
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs mt-1">No pending files require your action.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {recentFiles.filter(f => f.status === 'PENDING').slice(0, 4).map((file) => (
                  <div key={file.id}
                    onClick={() => navigate('/dashboard/files', { state: { selectedFileId: file.id } })}
                    className="p-4 hover:bg-black/[0.02] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground/90 truncate group-hover:text-indigo-600 transition-colors">{file.subject}</p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{file.fileNumber}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {recentFiles.filter(f => f.status === 'PENDING').length > 4 && (
            <div className="p-3 border-t border-black/5 text-center">
              <Button variant="link" className="text-xs h-auto p-0 text-indigo-600 font-medium">View all pending tasks →</Button>
            </div>
          )}
        </Card>
      </div>
      {/* Bottom Row: Quick-access widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">

        {/* Recently Opened */}
        <Card className="shadow-card border-none bg-white/80 backdrop-blur-md rounded-2xl col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-cyan-400 opacity-80" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-sans flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Recently Opened
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-7 text-indigo-600 font-medium hover:bg-indigo-50 rounded-full" onClick={() => navigate('/dashboard/files')}>
                View Registry
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {recentFiles.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No recent files found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentFiles.slice(0, 4).map((file) => (
                  <div key={file.id}
                    onClick={() => navigate('/dashboard/files', { state: { selectedFileId: file.id } })}
                    className="group flex gap-3 p-3 rounded-xl border border-black/5 hover:border-indigo-500/30 hover:shadow-sm bg-white cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                      <FileText className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-foreground/90 truncate">{file.subject}</p>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{file.department?.name || "General"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow & Storage Insights */}
        <Card className="shadow-card border-none bg-white/80 backdrop-blur-md rounded-2xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500 opacity-80" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-sans flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {/* Storage Widget Dynamic */}
            <div className="p-4 rounded-xl border border-black/5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-500" />
                  <span className="text-[13px] font-semibold">Storage Usage</span>
                </div>
                {(() => {
                  const storageGbLimit = 5 * 1024 * 1024 * 1024; // 5 GB
                  const percent = Math.min((stats.totalStorageBytes / storageGbLimit) * 100, 100).toFixed(1);
                  const mb = (stats.totalStorageBytes / (1024 * 1024)).toFixed(1);
                  return (
                    <span className="text-[11px] font-medium text-muted-foreground" title={`${mb} MB / 5 GB`}>{percent}%</span>
                  );
                })()}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                {(() => {
                  const storageGbLimit = 5 * 1024 * 1024 * 1024; // 5 GB
                  const percent = Math.min((stats.totalStorageBytes / storageGbLimit) * 100, 100);
                  return (
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                  );
                })()}
              </div>
            </div>

            {/* Workflow Status Mock */}
            <div className="p-4 rounded-xl border border-black/5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold">Active Workflows</span>
                <Badge variant="outline" className="text-[10px] bg-white border-black/10 text-slate-600">This Month</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold font-sans text-emerald-600">{stats.approved}</p>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">Approved</p>
                </div>
                <div className="w-px h-8 bg-black/10" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold font-sans text-rose-600">{stats.returned}</p>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">Returned</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
