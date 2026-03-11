import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, MoreVertical, FileText, ChevronDown, Download, Trash2, Edit, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Upload, FileUp, Link2, Inbox, User, Calendar, Eye, AlertCircle } from "lucide-react";
import { inwardApi, documentsApi } from "@/lib/api";
import type { Inward, InwardType, Document } from "@/lib/types";

const typeLabels: Record<InwardType, string> = {
    LETTER: "Letter", MEMO: "Memo", REPORT: "Report", APPLICATION: "Application", OTHER: "Other",
};

const InwardManagement = () => {
    const [inwards, setInwards] = useState<Inward[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Inward | null>(null);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        subject: "", source: "", type: "LETTER" as InwardType, description: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Document handling
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [docsLoading, setDocsLoading] = useState(false);
    const [uploadHeading, setUploadHeading] = useState("");
    const [isNewHeading, setIsNewHeading] = useState(false);
    const [pendingUploadFile, setPendingUploadFile] = useState<{ file: File; inputEl: HTMLInputElement } | null>(null);
    const [showDuplicateUploadWarn, setShowDuplicateUploadWarn] = useState(false);
    const [duplicateUploadName, setDuplicateUploadName] = useState("");

    // Document deletion
    const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState(false);
    const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);
    const [deletingDoc, setDeletingDoc] = useState(false);

    const user = JSON.parse(localStorage.getItem("dms_user") || "{}");

    const fetchInwards = async () => {
        setLoading(true);
        try {
            const res = await inwardApi.list({ search });
            const data = res.data;
            setInwards(Array.isArray(data) ? data : data.data || []);
        } catch {
            setInwards([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async (inwardId: string) => {
        setDocsLoading(true);
        try {
            const res = await documentsApi.findByInward(inwardId);
            setDocuments(res.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
            setDocuments([]);
        } finally {
            setDocsLoading(false);
        }
    };

    useEffect(() => { fetchInwards(); }, [search]);

    useEffect(() => {
        if (selected) {
            fetchDocuments(selected.id);
        } else {
            setDocuments([]);
        }
    }, [selected]);

    const doUpload = async (file: File, inputEl: HTMLInputElement) => {
        if (!selected) return;
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        try {
            await documentsApi.upload(formData, {
                inwardId: selected.id,
                description: "Uploaded via Inward Management",
                heading: uploadHeading.trim() || undefined
            });
            fetchDocuments(selected.id);
            setUploadHeading("");
            setIsNewHeading(false);
        } catch (error) {
            console.error("Upload failed", error);
            setError("Failed to upload document");
        } finally {
            setUploading(false);
            inputEl.value = "";
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !selected) return;
        const file = e.target.files[0];
        const duplicate = documents.find(d =>
            (d.originalName || "").toLowerCase() === file.name.toLowerCase()
        );
        if (duplicate) {
            setPendingUploadFile({ file, inputEl: e.target });
            setDuplicateUploadName(file.name);
            setShowDuplicateUploadWarn(true);
        } else {
            await doUpload(file, e.target);
        }
    };

    const handleDeleteDocument = async () => {
        if (!docToDelete || !selected) return;
        setDeletingDoc(true);
        try {
            await documentsApi.delete(docToDelete.id);
            fetchDocuments(selected.id);
            setShowDeleteDocConfirm(false);
            setDocToDelete(null);
            toast.success("Attachment deleted successfully");
        } catch {
            toast.error("Failed to delete attachment");
        } finally {
            setDeletingDoc(false);
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const res = await documentsApi.download(doc.id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", doc.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("For download failed", error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const payload = {
            subject: form.subject,
            senderName: form.source,
            inwardType: form.type,
            description: form.description,
            departmentId: user.departmentId || user.department?.id,
        };

        try {
            await inwardApi.create(payload);
            setShowForm(false);
            setForm({ subject: "", source: "", type: "LETTER", description: "" });
            fetchInwards();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create inward entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setDeleting(true);
        try {
            await inwardApi.delete(selected.id);
            setShowDeleteConfirm(false);
            setSelected(null);
            fetchInwards();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete inward entry");
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inward Register</h1>
                    <p className="text-muted-foreground text-sm mt-1">Register and track incoming correspondence</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Inward
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-card">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search by subject or source..." className="pl-9" value={search}
                                onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Button variant="outline" size="icon" onClick={fetchInwards}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card className="shadow-card border-none bg-white/80 backdrop-blur-md overflow-hidden rounded-2xl">
                <CardHeader className="pb-3 border-b border-black/5 bg-white/50">
                    <CardTitle className="text-lg font-sans flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-950">
                            <Inbox className="w-5 h-5 text-indigo-600" />
                            Inward Entries
                        </div>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-full px-3 shadow-none">
                            {`${inwards.length} records`}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin mr-3 text-indigo-500" /> Loading records...
                        </div>
                    ) : inwards.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Inbox className="w-8 h-8 text-indigo-300" />
                            </div>
                            <p className="font-medium text-foreground/80">No inward entries found</p>
                            <p className="text-sm mt-1">Start by registering your first correspondence.</p>
                            <Button variant="default" className="mt-6 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm" onClick={() => setShowForm(true)}>
                                Register First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full text-sm">
                            {/* Smart Table Header */}
                            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-black/[0.02] border-b border-black/5">
                                <div className="col-span-1 text-center">Date</div>
                                <div className="col-span-2">Number</div>
                                <div className="col-span-4">Subject</div>
                                <div className="col-span-2">Sender</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>
                            {/* Smart Table Body (Zebra striped) */}
                            <div className="divide-y divide-black/5">
                                {inwards.map((item, index) => (
                                    <div key={item.id}
                                        className={`grid grid-cols-12 gap-4 p-4 items-center group cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-black/[0.01]'} hover:bg-indigo-50/50`}
                                        onClick={() => setSelected(item)}>
                                        <div className="col-span-1 text-center text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="col-span-2 font-medium text-foreground/80 truncate">
                                            {item.inwardNumber}
                                        </div>
                                        <div className="col-span-4 min-w-0">
                                            <p className="font-semibold text-foreground/90 truncate group-hover:text-indigo-700 transition-colors">{item.subject}</p>
                                            {item.files && item.files.length > 0 && (
                                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200">
                                                    <Link2 className="w-3 h-3" /> Linked to File
                                                </span>
                                            )}
                                        </div>
                                        <div className="col-span-2 text-muted-foreground truncate text-[13px]">
                                            {item.senderName || "—"}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-slate-100 text-slate-700 border border-slate-200/60 uppercase">
                                                {typeLabels[item.inwardType]}
                                            </span>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-indigo-100 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); setSelected(item); }}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Inward Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl">
                    <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-indigo-100/50">
                        <DialogTitle className="text-xl font-sans text-indigo-950">Register New Inward Entry</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Fill in the details for the new correspondence.</p>
                    </div>
                    <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                placeholder="Brief subject of the correspondence" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as InwardType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Source / Sender</Label>
                            <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                                placeholder="Department or external sender" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Additional details..." rows={3} />
                        </div>
                        <div className="px-6 py-4 bg-black/[0.02] border-t border-black/5 flex items-center justify-end gap-3 mt-2">
                            <Button variant="ghost" type="button" className="hover:bg-black/5 rounded-full" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting} className="rounded-full shadow-sm bg-indigo-600 hover:bg-indigo-700">
                                {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                {submitting ? "Saving..." : "Register Entry"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl p-0 border-none shadow-2xl supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl">
                    <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-indigo-100/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-sans text-indigo-950 flex items-center gap-3">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                {selected?.inwardNumber}
                            </DialogTitle>
                            <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700 rounded-full font-semibold px-3 py-1 text-xs">
                                {selected ? `${typeLabels[selected.inwardType]}` : ""}
                            </Badge>
                        </div>
                    </div>
                    {selected && (
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Column: Main Content */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Subject block */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Subject</h3>
                                        <p className="text-xl font-bold text-slate-900 leading-snug">{selected.subject}</p>
                                    </div>

                                    {/* Description block */}
                                    {selected.description && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Description</h3>
                                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-700 leading-relaxed text-sm">
                                                {selected.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Linked File Info */}
                                    {selected.files && selected.files.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <Link2 className="w-4 h-4" /> Linked Files
                                            </h3>
                                            <div className="grid gap-2">
                                                {selected.files.map(f => (
                                                    <div key={f.id} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl hover:bg-indigo-50 transition-colors">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                {f.fileNumber}
                                                            </p>
                                                            <p className="text-xs text-indigo-700/70 truncate mt-0.5">{f.subject}</p>
                                                        </div>
                                                        <span className={`ml-3 shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${f.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            f.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                f.status === 'CLOSED' ? 'bg-slate-200 text-slate-700' :
                                                                    'bg-indigo-100 text-indigo-700'
                                                            }`}>{f.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents Section */}
                                    <div className="pt-2">
                                        <div className="flex flex-col gap-4 mb-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <FileText className="w-4 h-4" /> Attached Documents
                                                </h3>
                                            </div>

                                            <div className="flex gap-2">
                                                {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).length > 0 && !isNewHeading ? (
                                                    <Select
                                                        value={uploadHeading}
                                                        onValueChange={(val) => {
                                                            if (val === "NEW_HEADING_OPTION") {
                                                                setIsNewHeading(true);
                                                                setUploadHeading("");
                                                            } else {
                                                                setUploadHeading(val);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm w-[200px]">
                                                            <SelectValue placeholder="Select heading..." />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).map((h) => (
                                                                <SelectItem key={h as string} value={h as string}>{h as string}</SelectItem>
                                                            ))}
                                                            <SelectItem value="NEW_HEADING_OPTION" className="text-muted-foreground font-medium">
                                                                + Create New Heading
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex gap-1 items-center">
                                                        <Input
                                                            placeholder="Heading..."
                                                            value={uploadHeading}
                                                            onChange={(e) => setUploadHeading(e.target.value)}
                                                            className="h-8 text-sm w-[200px]"
                                                            autoFocus={isNewHeading}
                                                        />
                                                        {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).length > 0 && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={() => setIsNewHeading(false)}
                                                                title="Select existing heading"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="relative shrink-0">
                                                    <input
                                                        type="file"
                                                        id="doc-upload"
                                                        className="hidden"
                                                        onChange={handleUpload}
                                                        disabled={uploading}
                                                    />
                                                    <Button size="sm" variant="outline" className="h-8 gap-2" disabled={uploading}
                                                        onClick={() => document.getElementById("doc-upload")?.click()}>
                                                        {uploading ? (
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Upload className="w-3 h-3" />
                                                        )}
                                                        Upload Version
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {docsLoading ? (
                                            <div className="text-center py-4 text-muted-foreground text-sm">Loading documents...</div>
                                        ) : documents.length === 0 ? (
                                            <div className="text-center py-6 border rounded-md border-dashed text-muted-foreground text-sm">
                                                No documents attached yet
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                                {Object.entries(documents.reduce((acc: Record<string, Document[]>, doc) => {
                                                    const h = doc.heading || "General Documents";
                                                    if (!acc[h]) acc[h] = [];
                                                    acc[h].push(doc);
                                                    return acc;
                                                }, {})).map(([heading, docs]) => (
                                                    <div key={heading} className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{heading}</h4>
                                                        {docs.map((doc) => (
                                                            <div key={doc.id} className="flex items-center justify-between p-2 rounded border bg-card/50 text-sm">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                                                                        v{doc.version}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium truncate">{doc.originalName}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(doc.size / 1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(doc)} title="Download">
                                                                    <Download className="w-4 h-4 text-muted-foreground" />
                                                                </Button>
                                                                {/* Only allow delete if the inward hasn't been linked to any file yet */}
                                                                {(!selected.files || selected.files.length === 0) && (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                        title="Delete attachment"
                                                                        onClick={() => {
                                                                            setDocToDelete({ id: doc.id, name: doc.originalName });
                                                                            setShowDeleteDocConfirm(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Metadata Sidebar */}
                                <div className="md:col-span-1 space-y-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-5">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Document Type</p>
                                            <div className="flex items-center gap-2">
                                                <Inbox className="w-4 h-4 text-indigo-500" />
                                                <p className="font-semibold text-slate-800 text-sm">{typeLabels[selected.inwardType]}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Source / Sender</p>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-indigo-500" />
                                                <p className="font-semibold text-slate-800 text-sm">{selected.senderName || "—"}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received Date</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                <p className="font-semibold text-slate-800 text-sm">{new Date(selected.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex-row justify-between sm:justify-between items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleting}
                            className="gap-2"
                        >
                            {deleting ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <Trash2 className="w-3 h-3" />
                            )}
                            {deleting ? "Deleting..." : "Delete Inward"}
                        </Button>
                        <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Inward Entry
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 text-sm text-muted-foreground">
                        <p>Are you sure you want to delete</p>
                        <p className="font-semibold text-foreground mt-1">{selected?.inwardNumber} — {selected?.subject}</p>
                        <p className="mt-2 text-destructive/80">This action cannot be undone.</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
                            {deleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            {deleting ? "Deleting..." : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Duplicate File Warning Dialog */}
            <Dialog open={showDuplicateUploadWarn} onOpenChange={setShowDuplicateUploadWarn}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="w-5 h-5" /> Duplicate File Name
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            A document with the name <strong>"{duplicateUploadName}"</strong> is already attached to this inward.
                            Are you sure you want to attach another file with the exact same name?
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDuplicateUploadWarn(false);
                                setPendingUploadFile(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                                if (pendingUploadFile) {
                                    doUpload(pendingUploadFile.file, pendingUploadFile.inputEl);
                                }
                                setShowDuplicateUploadWarn(false);
                            }}
                            disabled={uploading}
                        >
                            {uploading ? "Uploading..." : "Proceed Anyway"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Document Confirmation Dialog */}
            <Dialog open={showDeleteDocConfirm} onOpenChange={(open) => { if (!open && !deletingDoc) { setShowDeleteDocConfirm(false); setDocToDelete(null); } }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Attachment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 text-sm text-muted-foreground">
                        <p>Are you sure you want to delete this attachment?</p>
                        <p className="font-semibold text-foreground mt-1 truncate">{docToDelete?.name}</p>
                        <p className="mt-2 text-destructive/80">This action cannot be undone.</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setShowDeleteDocConfirm(false); setDocToDelete(null); }} disabled={deletingDoc}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDocument} disabled={deletingDoc} className="gap-2">
                            {deletingDoc ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            {deletingDoc ? "Deleting..." : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InwardManagement;
