import { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2, Layers, Scissors, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import axios from "axios";

// Using the vite proxy or absolute URL depending on env
// nginx.conf proxies /convert/ to the python service
const CONVERT_API_URL = import.meta.env.VITE_API_URL ? "/convert" : "http://localhost:8000";

const PdfConverter = () => {
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Document Converter</h1>
                    <p className="text-slate-300 text-sm sm:text-base max-w-lg">
                        Fast, secure, and seamless conversion between PDF, Word, and Image formats.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ConverterCard
                    title="Word to PDF"
                    description="Convert .doc or .docx files to PDF."
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    endpoint={`${CONVERT_API_URL}/convert-word`}
                    targetExtension=".pdf"
                    type="word-to-pdf"
                />
                <ConverterCard
                    title="PDF to Word"
                    description="Convert .pdf files to formatted Word documents."
                    accept=".pdf,application/pdf"
                    endpoint={`${CONVERT_API_URL}/convert-pdf`}
                    targetExtension=".docx"
                    type="pdf-to-word"
                />
                <ConverterCard
                    title="Image to PDF"
                    description="Convert JPG, PNG, or JPEG images to PDF."
                    accept="image/jpeg,image/png,image/jpg"
                    endpoint={`${CONVERT_API_URL}/convert-image-to-pdf-file`}
                    targetExtension=".pdf"
                    type="image-to-pdf"
                />
                <ConverterCard
                    title="Merge PDFs"
                    description="Combine multiple PDF files into one."
                    accept=".pdf,application/pdf"
                    endpoint={`${CONVERT_API_URL}/merge-pdfs`}
                    targetExtension=".pdf"
                    type="merge-pdf"
                    multiple
                />
                <ConverterCard
                    title="Split PDF"
                    description="Extract specific pages from a PDF."
                    accept=".pdf,application/pdf"
                    endpoint={`${CONVERT_API_URL}/split-pdf`}
                    targetExtension=".pdf"
                    type="split-pdf"
                    showRangeInput
                />
            </div>
        </div>
    );
};

interface ConverterCardProps {
    title: string;
    description: string;
    accept: string;
    endpoint: string;
    targetExtension: string;
    type: "word-to-pdf" | "pdf-to-word" | "image-to-pdf" | "merge-pdf" | "split-pdf";
    multiple?: boolean;
    showRangeInput?: boolean;
}

const ConverterCard = ({ title, description, accept, endpoint, targetExtension, type, multiple, showRangeInput }: ConverterCardProps) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isHovering, setIsHovering] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [pageRange, setPageRange] = useState("1-end");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: any) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = (e: any) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileChange = (e: any) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (incomingFiles: File[]) => {
        const validated = incomingFiles.filter(f => validateFile(f));
        if (multiple) {
            setFiles(prev => [...prev, ...validated]);
        } else if (validated.length > 0) {
            setFiles([validated[0]]);
        }
    };

    const validateFile = (selectedFile: File) => {
        // Basic validation
        if ((type === "pdf-to-word" || type === "split-pdf" || type === "merge-pdf") && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
            toast.error(`${selectedFile.name} is not a valid PDF file`);
            return false;
        }
        if (type === "word-to-pdf" && !selectedFile.name.toLowerCase().match(/\.(doc|docx)$/)) {
            toast.error("Please select a valid Word file (.doc or .docx)");
            return false;
        }
        if (type === "image-to-pdf" && !selectedFile.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
            toast.error("Please select a valid Image file (.jpg, .jpeg, .png)");
            return false;
        }
        return true;
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConvert = async () => {
        if (files.length === 0) return;

        setIsConverting(true);
        const formData = new FormData();

        if (multiple) {
            files.forEach(f => formData.append("files", f));
        } else {
            formData.append("file", files[0]);
            if (showRangeInput) {
                formData.append("pages", pageRange);
            }
        }

        try {
            const response = await axios.post(endpoint, formData, {
                responseType: "blob",
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;

            // Generate output filename
            const originalName = files[0].name.replace(/\.[^/.]+$/, "");
            const isZip = response.data.type === "application/zip";
            const extension = isZip ? ".zip" : targetExtension;
            const downloadName = type === "merge-pdf" ? (isZip ? "merged_documents.zip" : "merged_document.pdf") : `${originalName}${extension}`;
            link.setAttribute("download", downloadName);

            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Conversion successful!");
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Conversion error:", error);
            toast.error("Conversion failed. Please try again.");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-200/50 dark:ring-white/5 overflow-hidden relative group transition-all hover:shadow-md hover:bg-white/80 dark:hover:bg-slate-900/80">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>

            <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                        {type === "merge-pdf" ? <Layers className="w-5 h-5" /> : type === "split-pdf" ? <Scissors className="w-5 h-5" /> : <FileType className="w-5 h-5" />}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</CardTitle>
                </div>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all cursor-pointer overflow-hidden ${isHovering
                        ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-inner"
                        : "border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-50/50 dark:hover:bg-black/20"
                        } ${files.length > 0 ? "bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={accept}
                        multiple={multiple}
                        className="hidden"
                    />

                    {files.length > 0 ? (
                        <div className="flex flex-col items-center gap-3 relative z-10 animate-in fade-in zoom-in duration-300">
                            {multiple ? (
                                <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {files.map((f, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm group/item">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileType className="w-4 h-4 text-indigo-400 shrink-0" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{f.name}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold text-sm">
                                            <Plus className="w-4 h-4" /> Add more files
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm mb-2">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-lg truncate max-w-[200px] sm:max-w-xs">
                                        {files[0].name}
                                    </p>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-white/5">
                                        {(files[0].size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors ${isHovering ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                                {isHovering ? "Drop it here!" : "Click or drag file here"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Supported formats: {type === "word-to-pdf" ? ".doc, .docx" : type === "image-to-pdf" ? ".jpg, .png" : ".pdf"}
                            </p>
                        </div>
                    )}
                </div>

                {showRangeInput && files.length > 0 && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Page Range</label>
                        <input
                            type="text"
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            placeholder="e.g. 1-3, 5, 7-end"
                            className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                )}

                <Button
                    className="w-full h-14 rounded-xl text-base font-bold transition-all shadow-lg shadow-indigo-500/10"
                    size="lg"
                    disabled={files.length === 0 || isConverting}
                    onClick={handleConvert}
                    variant={files.length > 0 ? "default" : "secondary"}
                >
                    {isConverting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        type === "merge-pdf" ? `Merge ${files.length} PDFs` : type === "split-pdf" ? "Split PDF" : `Convert to ${targetExtension.replace('.', '').toUpperCase()}`
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

export default PdfConverter;
