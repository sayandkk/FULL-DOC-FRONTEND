import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, UploadCloud, Download, FileText, Trash2, CheckCircle2, ChevronLeft, ChevronRight, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const ESignature = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("draw");
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  
  // Placement states
  const [sigPosition, setSigPosition] = useState({ x: 50, y: 50 }); // Percentage within the preview
  const [sigScale, setSigScale] = useState(0.5);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showDraggable, setShowDraggable] = useState(false);

  const sigCanvas = useRef<SignatureCanvas>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sigImageInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setSigPosition({ x: 50, y: 50 }); // Reset to center
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setSignedPdfBytes(null); 
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  const handleSigImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImage(event.target?.result as string);
        setShowDraggable(true);
        toast.success("Signature loaded. Now drag it to the desired position.");
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload a valid image file.");
    }
  };

  const clearSignature = () => {
    if (activeTab === "draw" && sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setSignatureImage(null);
    setShowDraggable(false);
    if (sigImageInputRef.current) sigImageInputRef.current.value = "";
  };

  const saveSignature = () => {
    if (activeTab === "draw" && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        toast.error("Please draw a signature first.");
        return;
      }
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setSignatureImage(dataUrl);
      setShowDraggable(true);
      toast.success("Signature saved. Drag it to place on document.");
    }
  };

  const processSignature = async () => {
    if (!pdfFile || !signatureImage) {
      toast.error("Missing document or signature.");
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const sigImageBytes = await fetch(signatureImage).then((res) => res.arrayBuffer());
      const embeddedImage = await pdfDoc.embedPng(sigImageBytes);
      
      const pages = pdfDoc.getPages();
      const targetPage = pages[pageNumber - 1];
      const { width, height } = targetPage.getSize();

      // Mapping percentage to PDF points (0,0 is bottom-left)
      // sigPosition is percentage (0-100) from TOP-LEFT
      
      // Use a consistent base width that matches the preview ratio
      const baseWidth = 200; 
      const imgWidth = baseWidth * sigScale;
      const aspect = embeddedImage.height / embeddedImage.width;
      const imgHeight = imgWidth * aspect;

      // X mapping: sigPosition.x is center of image
      const pdfX = ((sigPosition.x / 100) * width) - (imgWidth / 2);
      
      // Y mapping: sigPosition.y is center of image from TOP
      const pdfY_fromTop = (sigPosition.y / 100) * height;
      const pdfY = height - pdfY_fromTop - (imgHeight / 2);

      targetPage.drawImage(embeddedImage, {
        x: pdfX,
        y: pdfY,
        width: imgWidth,
        height: imgHeight,
      });

      const finalPdfBytes = await pdfDoc.save();
      setSignedPdfBytes(finalPdfBytes);
      toast.success("Document signed successfully!");
    } catch (error) {
      console.error("Signature processing error:", error);
      toast.error("Failed to apply signature.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSignedDoc = () => {
    if (!signedPdfBytes) return;
    const blob = new Blob([new Uint8Array(signedPdfBytes) as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Signed_${pdfFile?.name || 'Document.pdf'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <PenTool className="w-6 h-6 text-primary" />
          </div>
          Interactive E-Signature
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Upload a PDF and drag your signature to the exact location where you want it to appear.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step-by-Step Selection */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Document & Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="file" accept="application/pdf" className="hidden" ref={pdfInputRef} onChange={handlePdfUpload} />
              {!pdfFile ? (
                <Button variant="outline" className="w-full h-20 border-dashed border-2 gap-2" onClick={() => pdfInputRef.current?.click()}>
                  <UploadCloud className="w-5 h-5" />
                  Upload PDF
                </Button>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold truncate">{pdfFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setPdfFile(null)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw">Draw</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="draw" className="mt-4">
                  <div className="border border-border rounded-xl bg-white aspect-[5/2] relative overflow-hidden">
                    <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: 'w-full h-full' }} />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={clearSignature}>Clear</Button>
                      <Button variant="default" size="sm" className="h-7 text-[10px]" onClick={saveSignature}>Save</Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                  <input type="file" accept="image/png, image/jpeg" className="hidden" ref={sigImageInputRef} onChange={handleSigImageUpload} />
                  {signatureImage ? (
                    <div className="relative group rounded-xl border border-border bg-white h-24 p-2 flex items-center justify-center">
                      <img src={signatureImage} alt="Sig" className="max-h-full object-contain" />
                      <button onClick={clearSignature} className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full h-24 border-dashed border-2" onClick={() => sigImageInputRef.current?.click()}>
                      Upload Signature Image
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {signatureImage && (
            <Card className="shadow-sm border-border animate-in slide-in-from-left-2 duration-300">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">2. Adjust Signature</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Size</span>
                      <span>{Math.round(sigScale * 100)}%</span>
                    </div>
                    <input type="range" min="0.1" max="1.5" step="0.1" value={sigScale} onChange={(e) => setSigScale(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <Button className="w-full" size="lg" onClick={processSignature} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Embed on PDF"}
                  </Button>
               </CardContent>
            </Card>
          )}

          {signedPdfBytes && (
            <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 space-y-3 animate-in fade-in zoom-in">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-950">Successfully Prepared!</p>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={downloadSignedDoc}>
                 <Download className="w-4 h-4 mr-2" /> Download Signed PDF
              </Button>
            </div>
          )}
        </div>

        {/* PDF PREVIEW & DRAG AREA */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-[600px]">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-4">
               <Button variant="outline" size="icon" onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} disabled={pageNumber <= 1}>
                 <ChevronLeft className="w-4 h-4" />
               </Button>
               <span className="text-sm font-bold">Page {pageNumber} of {numPages || '?'}</span>
               <Button variant="outline" size="icon" onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))} disabled={pageNumber >= numPages}>
                 <ChevronRight className="w-4 h-4" />
               </Button>
             </div>
             <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest hidden sm:block">Interactive Placement Area</p>
          </div>

          <div 
            ref={previewContainerRef}
            className="flex-1 rounded-2xl border border-border bg-slate-100/50 dark:bg-black/20 overflow-hidden relative shadow-inner p-8 flex justify-center items-start"
          >
            {!pdfFile ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground/40 gap-3">
                <FileText className="w-16 h-16 opacity-10" />
                <p className="text-sm font-medium">Upload PDF to start interactive placement</p>
              </div>
            ) : (
              <div ref={pageWrapperRef} className="relative shadow-2xl bg-white leading-[0]">
                <Document 
                  file={pdfFile} 
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="p-20"><LoaderIcon /></div>}
                >
                  <Page 
                    pageNumber={pageNumber} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    onLoadSuccess={(page) => {
                      if (pageWrapperRef.current) {
                        // Dynamically set the wrapper size to match the rendered page
                        const canvas = pageWrapperRef.current.querySelector('canvas');
                        if (canvas) {
                          pageWrapperRef.current.style.width = `${canvas.clientWidth}px`;
                          pageWrapperRef.current.style.height = `${canvas.clientHeight}px`;
                        }
                      }
                    }}
                  />
                </Document>

                {/* Draggable Signature Overlay */}
                {signatureImage && showDraggable && (
                   <motion.div
                    drag
                    dragMomentum={false}
                    dragConstraints={pageWrapperRef}
                    dragElastic={0}
                    onDragEnd={(e) => {
                      if (pageWrapperRef.current) {
                        const pageRect = pageWrapperRef.current.getBoundingClientRect();
                        const sigRect = (e.target as HTMLElement).getBoundingClientRect();
                        
                        // Calculate the center of the signature box relative to the page
                        const centerX = (sigRect.left + sigRect.width / 2) - pageRect.left;
                        const centerY = (sigRect.top + sigRect.height / 2) - pageRect.top;
                        
                        const xPct = (centerX / pageRect.width) * 100;
                        const yPct = (centerY / pageRect.height) * 100;

                        setSigPosition({ 
                          x: Math.max(0, Math.min(100, xPct)), 
                          y: Math.max(0, Math.min(100, yPct)) 
                        });
                      }
                    }}
                    className="absolute z-10 cursor-move border-2 border-primary/50 bg-primary/10 rounded-sm overflow-visible shadow-lg"
                    style={{
                      left: `${sigPosition.x}%`,
                      top: `${sigPosition.y}%`,
                      x: "-50%",
                      y: "-50%"
                    }}
                  >
                    <img 
                      src={signatureImage} 
                      alt="Draggable Signature" 
                      style={{ 
                        width: `${200 * sigScale}px`, 
                        pointerEvents: 'none',
                        display: 'block'
                      }} 
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-[10px] text-white px-2 py-0.5 rounded whitespace-nowrap shadow-md font-bold">
                      Signature
                    </div>
                    {/* Corner Handles */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm" />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoaderIcon = () => (
  <div className="flex flex-col items-center gap-2">
     <RefreshCw className="w-8 h-8 animate-spin text-primary/30" />
     <span className="text-xs font-semibold text-muted-foreground">Loading Document...</span>
  </div>
);

export default ESignature;
