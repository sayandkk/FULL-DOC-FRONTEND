import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Download, ChevronRight, GitBranch, AlertCircle, Clock } from "lucide-react";
import { filesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { FileRecord, FileMovement, MovementAction } from "@/lib/types";

const actionColors: Record<MovementAction, string> = {
    CREATE: "bg-blue-100 text-blue-700",
    FORWARD: "bg-indigo-100 text-indigo-700",
    APPROVE: "bg-green-100 text-green-700",
    RETURN: "bg-orange-100 text-orange-700",
    REJECT: "bg-red-100 text-red-700",
    CLOSE: "bg-slate-100 text-slate-700",
    ARCHIVE: "bg-purple-100 text-purple-700",
    RESTORE: "bg-teal-100 text-teal-700",
    DISPOSE: "bg-gray-100 text-gray-700",
};

const WorkflowTracking = () => {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [file, setFile] = useState<FileRecord | null>(null);
    const [movements, setMovements] = useState<FileMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true); setError(""); setFile(null); setMovements([]);
        try {
            const res = await filesApi.list({ search: query.trim() });
            const data = res.data;
            const list: FileRecord[] = Array.isArray(data) ? data : data.data || [];
            if (list.length === 0) { setError("No file found with that number or subject."); return; }
            const found = list[0];
            setFile(found);
            const movRes = await filesApi.getMovements(found.id);
            setMovements(movRes.data);
        } catch { setError("Failed to fetch file. Please try again."); }
        finally { setLoading(false); }
    };

    const exportCSV = () => {
        if (!file || movements.length === 0) return;
        const rows = [
            ["Step", "Action", "From", "To", "Remarks", "Timestamp"],
            ...movements.map((m, i) => {
                const isAdhocInsert = m.remarks?.includes('[ADHOC_INSERT]');
                const isAdhocReturn = m.remarks?.includes('[ADHOC_RETURN]');
                const fromName = m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}` : "System";
                const toName = m.toUser ? `${m.toUser.firstName} ${m.toUser.lastName}` : "—";

                let actionText: string = m.action;
                if (isAdhocInsert) actionText = "AD-HOC INSERT";
                if (isAdhocReturn) actionText = "AD-HOC RETURN";

                return [
                    String(i + 1), actionText,
                    fromName,
                    toName,
                    m.remarks ? m.remarks.replace('[ADHOC_INSERT]', '').replace('[ADHOC_RETURN]', '').trim() : "",
                    new Date(m.createdAt).toLocaleString(),
                ];
            }),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `movement-trail-${file.fileNumber}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            {/* Header / Hero Search */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Workflow Tracking</h1>
                    <p className="text-indigo-200 text-sm sm:text-base mb-8 max-w-lg">
                        Visualize the complete lifecycle and movement trail of your documents through the organizational workflow.
                    </p>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                            <Input
                                placeholder="Enter File Number or Subject (e.g., F-2026-0001)..."
                                className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 rounded-2xl focus-visible:ring-white/30 text-base shadow-inner backdrop-blur-sm"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="h-14 px-8 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 font-semibold shadow-lg transition-transform active:scale-95">
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Track"}
                        </Button>
                    </form>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-950/50 backdrop-blur-md px-4 py-2 rounded-lg mt-4 w-fit border border-red-900/50">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </div>
            </div>

            {/* File Info Overview (Kanban-style card) */}
            {file && (
                <div className="bg-white/80 backdrop-blur-md border border-indigo-100/50 p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 px-3 py-1 rounded-full text-xs font-semibold shadow-none border-0">
                                    {`${file.fileNumber}`}
                                </Badge>
                                {(() => {
                                    const isOwner = file.currentOwnerId === user?.id;
                                    const isActive = ['PENDING', 'FORWARDED', 'RETURNED'].includes(file.status);

                                    if (isOwner && isActive) {
                                        return <Badge className="bg-orange-100 text-orange-800 border-0 shadow-none px-3 py-1">Action Required</Badge>;
                                    }

                                    return <Badge className={`border-0 shadow-none px-3 py-1 ${file.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                            file.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                                file.status === "RETURNED" ? "bg-orange-100 text-orange-800" :
                                                    "bg-blue-100 text-blue-800"
                                        }`}>{`${file.status}`}</Badge>;
                                })()}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-tight">{file.subject}</h2>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5"><GitBranch className="w-4 h-4 opacity-70" /> {`${file.department?.name || "—"}`}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70" /> {new Date(file.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <Button variant="outline" className="gap-2 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0 h-12 px-6 shadow-sm" onClick={exportCSV}>
                            <Download className="w-4 h-4" /> Export CSV
                        </Button>
                    </div>
                </div>
            )}

            {/* Movement Trail (Timeline Stepping) */}
            {file && (
                <div className="bg-white/80 backdrop-blur-md border border-indigo-100/50 p-6 sm:p-10 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <GitBranch className="w-5 h-5 text-indigo-500" /> Movement Timeline
                        </h3>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 shadow-none border-0 font-medium px-3">{`${movements.length} Steps`}</Badge>
                    </div>

                    {movements.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <p className="text-slate-500 font-medium">No movements recorded for this file yet.</p>
                        </div>
                    ) : (
                        <div className="relative pl-4 sm:pl-8">
                            {/* Vertical connecting line */}
                            <div className="absolute left-[27px] sm:left-[43px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent"></div>

                            <div className="space-y-8 relative">
                                {movements.map((m, i) => {
                                    const actionColor = actionColors[m.action] || "bg-slate-100 text-slate-700";
                                    const isLast = i === movements.length - 1;

                                    // Parse names
                                    const isAdhocInsert = m.remarks?.includes('[ADHOC_INSERT]');
                                    const isAdhocReturn = m.remarks?.includes('[ADHOC_RETURN]');
                                    const fromName = m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}` : "System";
                                    const toName = m.toUser ? `${m.toUser.firstName} ${m.toUser.lastName}` : "—";
                                    const cleanRemarks = m.remarks?.replace('[ADHOC_INSERT]', '').replace('[ADHOC_RETURN]', '').trim();

                                    return (
                                        <div key={m.id} className="relative flex items-start group">
                                            {/* Step Marker */}
                                            <div className="absolute -left-4 sm:-left-3.5 top-0 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-[3px] border-indigo-200 flex items-center justify-center shadow-sm group-hover:border-indigo-400 group-hover:scale-110 transition-all">
                                                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isLast ? 'bg-indigo-600 animate-pulse' : 'bg-indigo-300'}`}></div>
                                            </div>

                                            {/* Content Box */}
                                            <div className="ml-8 sm:ml-12 flex-1">
                                                <div className={`p-5 rounded-2xl border transition-shadow ${isLast ? 'bg-indigo-50/30 border-indigo-200 shadow-md' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge className={`shadow-none font-semibold px-2.5 py-0.5 border-0 ${actionColor}`}>
                                                                {`${isAdhocInsert ? "AD-HOC INSERT" : isAdhocReturn ? "AD-HOC RETURN" : m.action}`}
                                                            </Badge>
                                                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-sm text-slate-700 font-medium flex items-center gap-2 flex-wrap mt-2">
                                                        {isAdhocInsert ? (
                                                            <span><span className="text-slate-900">{fromName}</span> added <span className="text-indigo-700">{toName}</span></span>
                                                        ) : isAdhocReturn ? (
                                                            <span><span className="text-slate-900">{fromName}</span> (ad-hoc) returned to <span className="text-indigo-700">{toName}</span></span>
                                                        ) : m.action === 'CREATE' ? (
                                                            <span>Initiated by <span className="text-slate-900">{toName}</span></span>
                                                        ) : (
                                                            <>
                                                                <span className="text-slate-900">{fromName}</span>
                                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                                                <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{toName}</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {cleanRemarks && (
                                                        <div className="mt-4 text-sm bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-slate-600 italic">
                                                            <span className="text-slate-400 font-serif text-lg leading-none absolute -mt-1 -ml-1">"</span>
                                                            <span className="pl-3">{cleanRemarks}</span>
                                                            <span className="text-slate-400 font-serif text-lg leading-none absolute ml-1 mt-1">"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty Search State */}
            {!file && !loading && !error && (
                <div className="text-center py-20 px-4">
                    <div className="w-24 h-24 bg-indigo-50/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-indigo-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Track</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Enter a file number above to trace its entire journey through the organizational hierarchy.
                    </p>
                </div>
            )}
        </div>
    );
};

export default WorkflowTracking;
