import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

function mapAuthError(code: string, isAr: boolean): string {
  const map: Record<string, [string, string]> = {
    "auth/invalid-email": ["Invalid email address", "البريد الإلكتروني غير صالح"],
    "auth/user-not-found": ["No account with this email", "لا يوجد حساب بهاد الإيميل"],
    "auth/wrong-password": ["Incorrect password", "كلمة السر غالطة"],
    "auth/invalid-credential": ["Incorrect email or password", "الإيميل أو كلمة السر غالطين"],
    "auth/email-already-in-use": ["This email is already registered", "هاد الإيميل مسجل من قبل"],
    "auth/weak-password": ["Password must be at least 6 characters", "خاص كلمة السر تكون 6 حروف على الأقل"],
    "auth/network-request-failed": ["Network error, check your connection", "مشكل فالنت، تأكد من الاتصال"],
  };
  const entry = map[code];
  if (!entry) return isAr ? "وقع مشكل، عاود المحاولة" : "Something went wrong, please try again";
  return isAr ? entry[1] : entry[0];
}

export default function Login() {
  const { signIn, signUp, resetPassword, configured } = useAuth();
  const { settings } = useAppContext();
  const { toast } = useToast();
  const isAr = settings.language === "ar";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      toast({ title: mapAuthError(err?.code, isAr), variant: "destructive" as any });
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: isAr ? "دخل الإيميل ديالك أولاً" : "Enter your email first" });
      return;
    }
    try {
      await resetPassword(email);
      toast({ title: isAr ? "تصيفط ليك رابط تبديل كلمة السر" : "Password reset link sent" });
    } catch (err: any) {
      toast({ title: mapAuthError(err?.code, isAr), variant: "destructive" as any });
    }
  };

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-2">
          <p className="font-semibold">
            {isAr ? "Firebase ماشي معطي config" : "Firebase is not configured"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "زيد متغيرات VITE_FIREBASE_* فملف .env.local"
              : "Add VITE_FIREBASE_* variables to your .env.local file"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border bg-card shadow-sm p-6 space-y-5"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="font-bold text-lg">CashRec Pro</p>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? isAr
                ? "سجل الدخول لحسابك"
                : "Sign in to your account"
              : isAr
                ? "أنشئ حساب جديد"
                : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{isAr ? "الإيميل" : "Email"}</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{isAr ? "كلمة السر" : "Password"}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={busy} data-testid="button-submit-auth">
            {busy
              ? isAr
                ? "..."
                : "..."
              : mode === "signin"
                ? isAr
                  ? "دخول"
                  : "Sign in"
                : isAr
                  ? "إنشاء حساب"
                  : "Sign up"}
          </Button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            {isAr ? "نسيت كلمة السر؟" : "Forgot password?"}
          </button>
        )}

        <div className="border-t pt-4 text-center text-sm">
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-primary font-medium"
              data-testid="button-switch-signup"
            >
              {isAr ? "ما عندكش حساب؟ أنشئ واحد" : "No account? Sign up"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-primary font-medium"
              data-testid="button-switch-signin"
            >
              {isAr ? "عندك حساب؟ دخل" : "Have an account? Sign in"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
