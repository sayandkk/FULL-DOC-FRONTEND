import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, UploadCloud, FileType, CheckCircle2, Loader2, Send, X, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'ai';
    content: string;
};

const FloatingDocChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadedFile(file);
        
        // Clear chat when new file is uploaded
        setMessages([
            { role: 'ai', content: `I see you've loaded **${file.name}**. What would you like to know about it?` }
        ]);
        toast.success(`Loaded ${file.name} successfully.`);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!inputValue.trim()) return;
        if (!uploadedFile) {
            toast.error("Please upload a document first.");
            return;
        }

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue("");
        setIsThinking(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('question', userMsg);
            
            const response = await axios.post(`${API_BASE_URL}/gemini/ask`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if(response.data.answer) {
                 setMessages(prev => [...prev, { role: 'ai', content: response.data.answer }]);
            } else {
                 throw new Error("No answer returned");
            }

        } catch (error: any) {
            console.error("QnA Error:", error);
            const errMsg = error.response?.data?.message || "Failed to analyze the document. Please ensure your Gemini API key is correct.";
            toast.error(errMsg);
            setMessages(prev => [...prev, { role: 'ai', content: `*Error:* ${errMsg}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            
            {/* Chatbot Window */}
            <div 
                className={cn(
                    "mb-4 overflow-hidden shadow-2xl rounded-2xl border border-border bg-background transition-all duration-300 ease-in-out transform origin-bottom-right",
                    isOpen ? "scale-100 opacity-100 flex flex-col w-[380px] h-[600px] max-h-[80vh]" : "scale-0 opacity-0 hidden"
                )}
            >
                {/* Header */}
                <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">DocFlow AI</h3>
                            <p className="text-[11px] text-white/70 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Ready to Analyze
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Document Upload Area */}
                <div className="p-3 border-b border-border bg-muted/20 shrink-0">
                    <input 
                        type="file" 
                        accept=".pdf,.txt,.docx,.md"
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    {!uploadedFile ? (
                        <Button 
                            variant="outline" 
                            className="w-full h-12 border-dashed border-2 hover:bg-primary/5 hover:border-primary/40 transition-all gap-2 text-muted-foreground"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="w-4 h-4" />
                            Upload a Document
                        </Button>
                    ) : (
                        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md p-2 px-3">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileType className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-xs font-semibold text-foreground truncate">{uploadedFile.name}</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                className="h-6 w-6 p-0 hover:bg-primary/10 rounded-full shrink-0 ml-2"
                                onClick={() => fileInputRef.current?.click()}
                                title="Replace File"
                            >
                                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4 relative bg-muted/5">
                    {!uploadedFile && messages.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60">
                            <MessageSquarePlus className="w-10 h-10 mb-3 text-primary/40" />
                            <p className="text-sm font-medium text-foreground/70">Upload a file to begin</p>
                            <p className="text-[11px] mt-1 leading-relaxed">I can summarize your documents, extract insights, and answer questions.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-2">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'ai' && (
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-primary/20">
                                            <Bot className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                    <div className={`
                                        px-3.5 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed relative
                                        ${msg.role === 'user' 
                                            ? 'bg-primary text-primary-foreground font-medium rounded-br-sm shadow-sm' 
                                            : 'bg-white border border-border/80 text-foreground rounded-bl-sm shadow-sm'
                                        }
                                    `}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                            {msg.content.split('**').map((part, index) => 
                                                index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <div className="px-3.5 py-3 rounded-2xl bg-white border border-border text-foreground rounded-bl-sm flex items-center gap-2 shadow-sm">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                        <span className="text-[11px] text-muted-foreground font-medium">Analyzing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-border shrink-0 rounded-b-2xl">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                         <Input 
                             value={inputValue}
                             onChange={(e) => setInputValue(e.target.value)}
                             placeholder={uploadedFile ? "Ask a question..." : "Upload a file first..."}
                             className="pr-10 py-5 text-[13px] rounded-xl border-border/60 bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm"
                             disabled={!uploadedFile || isThinking}
                         />
                         <Button 
                             type="submit" 
                             size="icon"
                             disabled={!inputValue.trim() || !uploadedFile || isThinking}
                             className="absolute right-1.5 h-7 w-7 rounded-lg hover:bg-primary sm:hover:scale-105 transition-all"
                         >
                             <Send className="w-3.5 h-3.5" />
                         </Button>
                    </form>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 transition-all duration-300 flex items-center justify-center p-0 group ring-4 ring-primary/20"
            >
                {isOpen ? (
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                    <Bot className="w-7 h-7" />
                )}
            </Button>
            
        </div>
    );
};

export default FloatingDocChat;
