import { useMemo } from "react";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { FileStack, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const { records, settings } = useAppContext();

  const stats = useMemo(() => {
    let totalShortage = 0;
    let totalSurplus = 0;
    let todayCount = 0;
    const now = new Date();
    records.forEach(r => {
      if (r.difference < 0) totalShortage += Math.abs(r.difference);
      if (r.difference > 0) totalSurplus += r.difference;
      if (isSameDay(new Date(r.createdAt), now)) todayCount++;
    });
    return { totalShortage, totalSurplus, todayCount };
  }, [records]);

  const trendData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      const dayRecords = records.filter(r => isSameDay(new Date(r.createdAt), d));
      const net = dayRecords.reduce((sum, r) => sum + r.difference, 0);
      return { date: format(d, "MMM dd"), net };
    });
  }, [records]);

  const statusData = useMemo(() => {
    const balanced = records.filter(r => r.status === "balanced").length;
    const shortage = records.filter(r => r.status === "shortage").length;
    const surplus = records.filter(r => r.status === "surplus").length;
    return [
      { name: t("recon.balanced"), value: balanced, color: "hsl(var(--success))" },
      { name: t("recon.shortage"), value: shortage, color: "hsl(var(--destructive))" },
      { name: t("recon.surplus"), value: surplus, color: "hsl(var(--info))" },
    ].filter(d => d.value > 0);
  }, [records]);

  const statCards = [
    {
      label: t("dash.totalRecords"),
      value: records.length,
      unit: "",
      icon: FileStack,
      color: "text-primary",
      bg: "bg-primary/10 dark:bg-primary/15",
    },
    {
      label: t("dash.todayRecords"),
      value: stats.todayCount,
      unit: "",
      icon: CalendarDays,
      color: "text-warning",
      bg: "bg-warning/10 dark:bg-warning/15",
    },
    {
      label: t("dash.totalShortage"),
      value: stats.totalShortage.toFixed(2),
      unit: settings.currency,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10 dark:bg-destructive/15",
    },
    {
      label: t("dash.totalSurplus"),
      value: stats.totalSurplus.toFixed(2),
      unit: settings.currency,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10 dark:bg-success/15",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">{t("dash.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-card-border hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3 gap-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                    {s.label}
                  </p>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${s.color}`}>
                  {s.value}
                  {s.unit && <span className="text-xs font-sans font-medium text-muted-foreground ml-1">{s.unit}</span>}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="col-span-1 lg:col-span-2">
          <Card className="border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("dash.trend")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    />
                    <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                      {trendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-1">
          <Card className="border-card-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("dash.breakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{t("history.empty")}</div>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
