import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Printer, TrendingDown, TrendingUp, Minus, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

function StatusBadge({ status }: { status: "balanced" | "shortage" | "surplus" }) {
  const cls =
    status === "balanced"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : status === "shortage"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
      : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {t(`recon.${status}` as any)}
    </span>
  );
}

interface DayGroup {
  date: string;
  records: ReturnType<typeof useAppContext>["records"];
  totalOpening: number;
  totalExpected: number;
  totalTheoretical: number;
  totalCounted: number;
  totalDifference: number;
  shortageCount: number;
  surplusCount: number;
  balancedCount: number;
}

export default function Report() {
  const { records, settings } = useAppContext();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const availableYears = useMemo(() => {
    const years = new Set(records.map((r) => new Date(r.createdAt).getFullYear()));
    years.add(now.getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [records]);

  const monthlyRecords = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(start);
    return records.filter((r) =>
      isWithinInterval(parseISO(r.createdAt), { start, end })
    );
  }, [records, selectedYear, selectedMonth]);

  const dayGroups = useMemo((): DayGroup[] => {
    const map = new Map<string, typeof monthlyRecords>();
    for (const r of monthlyRecords) {
      const day = format(parseISO(r.createdAt), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(r);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, recs]) => ({
        date,
        records: recs,
        totalOpening: recs.reduce((s, r) => s + (r.openingCash ?? 0), 0),
        totalExpected: recs.reduce((s, r) => s + r.expectedCash, 0),
        totalTheoretical: recs.reduce((s, r) => s + (r.theoreticalTotal ?? r.expectedCash), 0),
        totalCounted: recs.reduce((s, r) => s + r.countedCash, 0),
        totalDifference: recs.reduce((s, r) => s + r.difference, 0),
        shortageCount: recs.filter((r) => r.status === "shortage").length,
        surplusCount: recs.filter((r) => r.status === "surplus").length,
        balancedCount: recs.filter((r) => r.status === "balanced").length,
      }));
  }, [monthlyRecords]);

  const totals = useMemo(() => ({
    sessions: monthlyRecords.length,
    totalShortage: monthlyRecords.filter((r) => r.status === "shortage").reduce((s, r) => s + Math.abs(r.difference), 0),
    totalSurplus: monthlyRecords.filter((r) => r.status === "surplus").reduce((s, r) => s + r.difference, 0),
    netDifference: monthlyRecords.reduce((s, r) => s + r.difference, 0),
    shortageCount: monthlyRecords.filter((r) => r.status === "shortage").length,
    surplusCount: monthlyRecords.filter((r) => r.status === "surplus").length,
    balancedCount: monthlyRecords.filter((r) => r.status === "balanced").length,
  }), [monthlyRecords]);

  const cur = settings.currency;

  const fmt = (n: number) => n.toFixed(2);

  const monthName = format(new Date(selectedYear, selectedMonth), "MMMM yyyy");

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(2000, i), "MMMM"),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("report.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("report.subtitle")}</p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2 self-start md:self-auto">
          <Printer className="h-4 w-4" />
          {t("history.print")}
        </Button>
      </div>

      {/* Month picker */}
      <div className="flex gap-3 no-print">
        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Print-only month title */}
      <div className="hidden print:block text-xl font-bold mb-4">{t("report.title")} — {monthName}</div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{t("report.sessions")}</p>
            </div>
            <p className="text-2xl font-bold">{totals.sessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <p className="text-xs text-muted-foreground font-medium">{t("dash.totalShortage")}</p>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{fmt(totals.totalShortage)}</p>
            <p className="text-xs text-muted-foreground">{cur} · {totals.shortageCount} {t("report.sessions")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              <p className="text-xs text-muted-foreground font-medium">{t("dash.totalSurplus")}</p>
            </div>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{fmt(totals.totalSurplus)}</p>
            <p className="text-xs text-muted-foreground">{cur} · {totals.surplusCount} {t("report.sessions")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{t("report.net")}</p>
            </div>
            <p className={`text-2xl font-bold ${totals.netDifference < 0 ? "text-rose-600 dark:text-rose-400" : totals.netDifference > 0 ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {totals.netDifference > 0 ? "+" : ""}{fmt(totals.netDifference)}
            </p>
            <p className="text-xs text-muted-foreground">{cur}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily table */}
      {dayGroups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {t("report.empty")}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("report.dailyBreakdown")} — {monthName}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t("report.col.date")}</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">{t("recon.opening.short")}</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">{t("recon.expected.short")}</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{t("recon.theoretical.short")}</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">{t("recon.counted.short")}</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{t("recon.difference")}</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{t("report.col.sessions")}</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">{t("report.col.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dayGroups.map((day, i) => {
                    const diff = day.totalDifference;
                    const diffColor =
                      diff === 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" :
                      diff < 0 ? "text-rose-600 dark:text-rose-400 font-semibold" :
                      "text-sky-600 dark:text-sky-400 font-semibold";
                    const dominant =
                      day.shortageCount > day.surplusCount && day.shortageCount > day.balancedCount ? "shortage" :
                      day.surplusCount > day.shortageCount && day.surplusCount > day.balancedCount ? "surplus" :
                      "balanced";
                    return (
                      <tr key={day.date} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 font-medium">
                          {format(parseISO(day.date), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{fmt(day.totalOpening)}</td>
                        <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{fmt(day.totalExpected)}</td>
                        <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{fmt(day.totalTheoretical)}</td>
                        <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{fmt(day.totalCounted)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${diffColor}`}>
                          {diff > 0 ? "+" : ""}{fmt(diff)}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                          {day.records.length}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={dominant as any} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 bg-muted/30 font-semibold">
                    <td className="px-4 py-3">{t("report.total")}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                      {fmt(dayGroups.reduce((s, d) => s + d.totalOpening, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                      {fmt(dayGroups.reduce((s, d) => s + d.totalExpected, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      {fmt(dayGroups.reduce((s, d) => s + d.totalTheoretical, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                      {fmt(dayGroups.reduce((s, d) => s + d.totalCounted, 0))}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${totals.netDifference < 0 ? "text-rose-600 dark:text-rose-400" : totals.netDifference > 0 ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {totals.netDifference > 0 ? "+" : ""}{fmt(totals.netDifference)}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">{totals.sessions}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Per-day session detail (collapsible on mobile shown as sub-rows) */}
            <div className="divide-y print:hidden">
              {dayGroups.map((day) =>
                day.records.length > 1 ? (
                  <details key={day.date + "-detail"} className="group">
                    <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 hover:bg-muted/20 select-none">
                      <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                      {format(parseISO(day.date), "dd MMM")} — {day.records.length} {t("report.sessions")}
                    </summary>
                    <div className="pl-8 pr-4 pb-3 space-y-1">
                      {day.records.map((r) => (
                        <div key={r.id} className="flex justify-between text-xs text-muted-foreground py-1 border-b last:border-0">
                          <span>{format(parseISO(r.createdAt), "HH:mm")} {r.note ? `— ${r.note}` : ""}</span>
                          <span className={r.status === "shortage" ? "text-rose-500" : r.status === "surplus" ? "text-sky-500" : "text-emerald-500"}>
                            {r.difference > 0 ? "+" : ""}{r.difference.toFixed(2)} {cur}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
