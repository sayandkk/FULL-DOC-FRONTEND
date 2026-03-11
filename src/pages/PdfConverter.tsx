import { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
    type: "word-to-pdf" | "pdf-to-word" | "image-to-pdf";
}

const ConverterCard = ({ title, description, accept, endpoint, targetExtension, type }: ConverterCardProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
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
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: any) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        // Basic validation
        if (type === "pdf-to-word" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
            toast.error("Please select a valid PDF file");
            return;
        }
        if (type === "word-to-pdf" && !selectedFile.name.toLowerCase().match(/\.(doc|docx)$/)) {
            toast.error("Please select a valid Word file (.doc or .docx)");
            return;
        }
        if (type === "image-to-pdf" && !selectedFile.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
            toast.error("Please select a valid Image file (.jpg, .jpeg, .png)");
            return;
        }
        setFile(selectedFile);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsConverting(true);
        const formData = new FormData();
        formData.append("file", file);

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
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            link.setAttribute("download", `${originalName}${targetExtension}`);

            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Conversion successful!");
            setFile(null);
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
                        <FileType className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</CardTitle>
                </div>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer overflow-hidden ${isHovering
                        ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-inner"
                        : "border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-50/50 dark:hover:bg-black/20"
                        } ${file ? "bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30" : ""}`}
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
                        className="hidden"
                    />

                    {file ? (
                        <div className="flex flex-col items-center gap-3 relative z-10 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm mb-2">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-lg truncate max-w-[200px] sm:max-w-xs">
                                {file.name}
                            </p>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-white/5">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
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

                <Button
                    className="w-full h-14 rounded-xl text-base font-bold transition-all"
                    size="lg"
                    disabled={!file || isConverting}
                    onClick={handleConvert}
                    variant={file ? "default" : "secondary"}
                >
                    {isConverting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Converting Document...
                        </span>
                    ) : (
                        `Convert to ${targetExtension.replace('.', '').toUpperCase()}`
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

export default PdfConverter;
