import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Trash2, Printer, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function History() {
  const { records, removeRecord, settings } = useAppContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "balanced" | "shortage" | "surplus">("all");

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (search) {
          const s = search.toLowerCase();
          const d = format(new Date(r.createdAt), "PP").toLowerCase();
          const n = r.note?.toLowerCase() || "";
          if (!d.includes(s) && !n.includes(s)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, search, filter]);

  const statusStyles = {
    balanced: {
      border: "border-l-success",
      badge: "bg-success/15 text-success",
      diff: "text-success",
    },
    shortage: {
      border: "border-l-destructive",
      badge: "bg-destructive/15 text-destructive",
      diff: "text-destructive",
    },
    surplus: {
      border: "border-l-info",
      badge: "bg-info/15 text-info",
      diff: "text-info",
    },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("history.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2 self-start md:self-auto" data-testid="button-print">
          <Printer className="h-4 w-4" />
          {t("history.print")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("history.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-filter">
            <SelectValue placeholder={t("history.filter.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("history.filter.all")}</SelectItem>
            <SelectItem value="balanced">{t("recon.balanced")}</SelectItem>
            <SelectItem value="shortage">{t("recon.shortage")}</SelectItem>
            <SelectItem value="surplus">{t("recon.surplus")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
            >
              {t("history.empty")}
            </motion.div>
          ) : (
            filteredRecords.map((record) => {
              const st = statusStyles[record.status];
              return (
                <motion.div
                  key={record.id}
                  variants={cardVariant}
                  layout
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
                  className="print-break-inside-avoid"
                >
                  <Card className={`overflow-hidden border-l-[3px] ${st.border} hover:shadow-md transition-shadow duration-200`}>
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {format(new Date(record.createdAt), "PPpp")}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${st.badge}`}>
                              {t(`recon.${record.status}` as any)}
                            </span>
                          </div>
                          {record.note && (
                            <p className="text-xs text-muted-foreground mt-1">{record.note}</p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                            <span>{t("recon.opening.short")}: <span className="text-foreground font-mono font-medium">{(record.openingCash ?? 0).toFixed(2)}</span></span>
                            <span>{t("recon.expected.short")}: <span className="text-foreground font-mono font-medium">{record.expectedCash.toFixed(2)}</span></span>
                            <span>{t("recon.theoretical.short")}: <span className="text-foreground font-mono font-medium">{(record.theoreticalTotal ?? record.expectedCash).toFixed(2)}</span></span>
                            <span>{t("recon.counted.short")}: <span className="text-foreground font-mono font-medium">{record.countedCash.toFixed(2)}</span></span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                          <div className={`text-xl font-bold font-mono ${st.diff}`}>
                            {record.difference > 0 ? "+" : ""}{record.difference.toFixed(2)}
                            <span className="text-xs font-sans font-normal text-muted-foreground ml-1">{record.currency}</span>
                          </div>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 no-print"
                                data-testid={`button-delete-${record.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("history.delete.confirm")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the record from your local storage.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("history.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeRecord(record.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("history.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
