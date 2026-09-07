import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Database, Smartphone, Mail, Globe } from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const features = [
  {
    icon: TrendingUp,
    title: "Daily Reconciliation",
    desc: "Track opening balance, computer sales, and drawer cash every shift with instant shortage and surplus detection.",
  },
  {
    icon: Database,
    title: "Local & Private",
    desc: "All data is stored directly on your device. No cloud servers, no accounts, no data sharing — 100% private.",
  },
  {
    icon: ShieldCheck,
    title: "Monthly Reports",
    desc: "View day-by-day breakdowns, session totals, and trend charts to monitor your cash accuracy over time.",
  },
  {
    icon: Smartphone,
    title: "Works Offline",
    desc: "Install as a PWA on any phone or tablet. Works without an internet connection once installed.",
  },
];

export default function About() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-2xl mx-auto">

      {/* Hero */}
      <motion.div variants={item} className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
          <TrendingUp className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("about.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("about.version")}</p>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <p className="text-sm leading-relaxed text-foreground/80">
          {t("about.description")}
        </p>
      </motion.div>

      {/* Features */}
      <motion.div variants={item}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("about.features")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Privacy Policy (required for AdSense) */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("about.privacy")}</p>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-foreground/75 leading-relaxed">
          <p>{t("about.privacy.p1")}</p>
          <p>{t("about.privacy.p2")}</p>
          <p>{t("about.privacy.p3")}</p>
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("about.contact")}</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <a
            href="mailto:contact@example.com"
            className="flex items-center gap-3 text-sm text-primary hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" />
            contact@example.com
          </a>
          <a
            href="https://example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-primary hover:underline"
          >
            <Globe className="h-4 w-4 shrink-0" />
            example.com
          </a>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.div variants={item}>
        <p className="text-xs text-center text-muted-foreground pb-4">
          {t("about.footer")}
        </p>
      </motion.div>

    </motion.div>
  );
}
