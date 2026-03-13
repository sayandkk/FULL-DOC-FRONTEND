import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Lock, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

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

      // Persist tokens and user info
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("session_id", data.sessionId);
      localStorage.setItem("dms_user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-muted/30 overflow-hidden font-sans">
      {/* Subtle Background Elements to replace the full left panel */}
      <div className="absolute top-0 right-0 -tr-32 -tr-32 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -bl-32 -bl-32 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Centered Login Container */}
      <div className="w-full max-w-[440px] relative z-10 px-6">

        {/* Branding Area */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/50 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground text-center">DocFlow</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center uppercase tracking-widest font-semibold">Workspace Authentication</p>
        </div>

        <Card className="border-border/40 shadow-xl bg-card/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 px-8 text-center border-b border-border/10">
            <CardTitle className="text-xl font-bold font-sans">Sign In</CardTitle>
            <CardDescription className="text-sm">
              Access your digital document management system
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex flex-col gap-1 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Authentication Failed
                  </div>
                  <p className="text-xs text-destructive/80 pl-6">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">Email Address</Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@department.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all rounded-xl shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">Password</Label>
                  <a href="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-background/50 border-input/50 focus-visible:ring-primary/40 focus-visible:border-primary transition-all rounded-xl pl-4 pr-10 shadow-sm"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md rounded-xl transition-all" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Secure Sign In"
                  )}
                </Button>
              </div>

              <div className="mt-8 text-center border-t border-border/40 pt-6">
                <div className="inline-flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium bg-muted/50 px-3 py-1.5 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  Enterprise Grade Security
                </div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-4">
                  All access is monitored and logged
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
