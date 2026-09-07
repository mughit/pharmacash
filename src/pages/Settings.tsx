import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, DollarSign, Trash2 } from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface RowProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ icon: Icon, label, description, children }: RowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      <div className="w-full sm:w-44 sm:shrink-0">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, clearRecords } = useAppContext();
  const { toast } = useToast();

  const handleSave = (key: keyof typeof settings, value: string) => {
    updateSettings({ ...settings, [key]: value });
    toast({ title: t("settings.toast.success") });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-xl mx-auto">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences and data.</p>
      </motion.div>

      <motion.div variants={item} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Preferences</p>
        </div>
        <div className="px-5">
          <SettingRow
            icon={settings.theme === "dark" ? Moon : Sun}
            label={t("settings.theme")}
            description="Light or dark display"
          >
            <Select value={settings.theme} onValueChange={(v) => handleSave("theme", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("settings.theme.light")}</SelectItem>
                <SelectItem value="dark">{t("settings.theme.dark")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={Globe}
            label={t("settings.language")}
            description="Language and text direction"
          >
            <Select value={settings.language} onValueChange={(v) => handleSave("language", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("settings.language.en")}</SelectItem>
                <SelectItem value="ar">{t("settings.language.ar")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={DollarSign}
            label={t("settings.currency")}
            description="Default currency"
          >
            <Select value={settings.currency} onValueChange={(v) => handleSave("currency", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAD">MAD — Moroccan Dirham</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="GBP">GBP — British Pound</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </motion.div>

      <motion.div variants={item} className="rounded-2xl border border-destructive/25 bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-destructive/20 bg-destructive/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-destructive/70">{t("settings.data")}</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("settings.clear")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Remove all saved records</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">{t("settings.clear")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                <AlertDialogDescription>{t("settings.clear.confirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("history.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={clearRecords} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t("settings.clear")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </motion.div>
  );
}
