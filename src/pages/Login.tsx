import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Shield, Lock, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { motion, AnimatePresence, Variants } from "framer-motion";
import BrandImage from "@/assets/login-brand.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("session_id", data.sessionId);
      localStorage.setItem("dms_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Login failed. Please check your credentials.";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        staggerChildren: 0.1, 
        delayChildren: 0.2,
        ease: "easeOut" 
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-black font-sans selection:bg-indigo-100 overflow-hidden relative">
      {/* BACKGROUND ELEMENTS - Matching Inner Page style */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-4 relative z-10"
      >
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/40 dark:border-white/5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/10">
          <div className="p-8 sm:p-12 space-y-8">
            {/* BRAND HEADER */}
            <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center group transition-transform hover:scale-105 duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Welcome Back
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Access your DocFlow intelligence workspace
                </p>
              </div>
            </motion.div>

            {/* LOGIN FORM */}
            <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 text-red-600 dark:text-red-400 shadow-sm mb-2">
                       <AlertCircle className="w-5 h-5 shrink-0" />
                       <p className="text-xs font-semibold leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Work Email</Label>
                  <Input
                    type="email"
                    placeholder="name@department.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-2xl text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Secure Password</Label>
                    <button type="button" className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">Reset?</button>
                  </div>
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-2xl text-slate-900 dark:text-white font-medium placeholder:text-slate-400 pl-4 pr-12 shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 group transition-all"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </motion.form>

            {/* FOOTER METRICS */}
            <motion.div variants={itemVariants} className="pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Shield className="w-4 h-4 text-emerald-500" />
                Secure Portal
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest">
                v4.2.0
              </div>
            </motion.div>
          </div>
        </div>

        {/* EXTERNAL LINKS */}
        <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-6">
          {["System Status", "Documentation", "Contact Support"].map((text) => (
            <button key={text} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
              {text}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
