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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sans tracking-tight">Document Converter</h1>
                    <p className="text-muted-foreground mt-1">
                        Convert your documents between PDF and Word formats seamlessly.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <Card className="shadow-elevated border-border/50">
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <FileType className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl font-sans">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isHovering ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                        } ${file ? "bg-accent/30" : ""}`}
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
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                            <p className="font-medium text-sm text-foreground truncate max-w-full px-4">
                                {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="font-medium text-sm text-foreground">
                                Click or drag & drop file here
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supported formats: {type === "word-to-pdf" ? ".doc, .docx" : type === "image-to-pdf" ? ".jpg, .png" : ".pdf"}
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    disabled={!file || isConverting}
                    onClick={handleConvert}
                >
                    {isConverting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Converting...
                        </>
                    ) : (
                        `Convert to ${targetExtension.replace('.', '').toUpperCase()}`
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

export default PdfConverter;
