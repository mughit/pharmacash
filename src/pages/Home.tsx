import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { useTextToSpeech } from "@/hooks/useVoiceControl";

const formSchema = z.object({
  openingCash: z.coerce.number().min(0, "Must be positive"),
  expectedCash: z.coerce.number().min(0, "Must be positive"),
  countedCash: z.coerce.number().min(0, "Must be positive"),
  note: z.string().optional(),
});

export default function Home() {
  const { addRecord, settings } = useAppContext();
  const { toast } = useToast();
  const [analysed, setAnalysed] = useState(false);
  const { speak } = useTextToSpeech(settings.language === "ar" ? "ar-MA" : "en-US");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { openingCash: 0, expectedCash: 0, countedCash: 0, note: "" },
  });

  const opening = Number(form.watch("openingCash")) || 0;
  const expected = Number(form.watch("expectedCash")) || 0;
  const counted = Number(form.watch("countedCash")) || 0;
  const theoretical = opening + expected;
  const difference = counted - theoretical;

  let status: "balanced" | "shortage" | "surplus" = "balanced";
  if (difference < 0) status = "shortage";
  if (difference > 0) status = "surplus";

  const statusColor =
    status === "balanced" ? "text-emerald-600 dark:text-emerald-400" :
    status === "shortage" ? "text-rose-600 dark:text-rose-400" :
    "text-sky-600 dark:text-sky-400";

  const statusBg =
    status === "balanced" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" :
    status === "shortage" ? "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800" :
    "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800";

  const speakResult = (diff: number, s: "balanced" | "shortage" | "surplus", currency: string) => {
    const amount = Math.abs(diff).toFixed(2);
    const isAr = settings.language === "ar";
    let phrase = "";
    if (s === "balanced") {
      phrase = isAr ? "النتيجة متوازنة، ما كاينش فرق." : "Result balanced, no difference.";
    } else if (s === "shortage") {
      phrase = isAr ? `كاين عجز ديال ${amount} ${currency}` : `There is a shortage of ${amount} ${currency}`;
    } else {
      phrase = isAr ? `كاين فائض ديال ${amount} ${currency}` : `There is a surplus of ${amount} ${currency}`;
    }
    speak(phrase);
  };

  const handleAnalyse = () => {
    form.trigger(["openingCash", "expectedCash", "countedCash"]).then((valid) => {
      if (valid) {
        setAnalysed(true);
        speakResult(difference, status, settings.currency);
      }
    });
  };

  const handleReset = () => {
    form.reset();
    setAnalysed(false);
  };

  // React to global voice commands (dispatched from the floating voice-command
  // button) so the user can say "calculate" / "save" / "reset" from anywhere.
  useEffect(() => {
    const onVoiceAction = (event: Event) => {
      const action = (event as CustomEvent<{ action: string }>).detail?.action;
      if (action === "calculate") {
        handleAnalyse();
      } else if (action === "save") {
        if (analysed) {
          form.handleSubmit(onSubmit)();
        } else {
          toast({ title: t("voice.commandNotRecognized") });
        }
      } else if (action === "reset") {
        handleReset();
      }
    };
    window.addEventListener("voice:action", onVoiceAction);
    return () => window.removeEventListener("voice:action", onVoiceAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysed, opening, expected, counted]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const theo = values.openingCash + values.expectedCash;
    const diff = values.countedCash - theo;
    let s: "balanced" | "shortage" | "surplus" = "balanced";
    if (diff < 0) s = "shortage";
    if (diff > 0) s = "surplus";

    addRecord({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      openingCash: values.openingCash,
      expectedCash: values.expectedCash,
      countedCash: values.countedCash,
      theoreticalTotal: theo,
      difference: diff,
      status: s,
      currency: settings.currency,
      note: values.note,
    });
    toast({ title: t("recon.toast.success") });
    form.reset();
    setAnalysed(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg mx-auto">

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Header tag */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {t("recon.shiftTool")}
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 pb-5 space-y-4">

            {/* Opening Balance */}
            <FormField
              control={form.control}
              name="openingCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    {t("recon.opening")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        {settings.currency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        data-testid="input-opening-cash"
                        {...field}
                        onFocus={(e) => e.target.select()}
                        className="pl-14 pr-12 text-lg h-12 font-mono"
                      />
                      <VoiceMicButton
                        testId="button-voice-opening-cash"
                        onAmount={(v) => form.setValue("openingCash", v, { shouldValidate: true })}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recorded Sales */}
            <FormField
              control={form.control}
              name="expectedCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    {t("recon.expected")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        {settings.currency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        data-testid="input-expected-cash"
                        {...field}
                        onFocus={(e) => e.target.select()}
                        className="pl-14 pr-12 text-lg h-12 font-mono"
                      />
                      <VoiceMicButton
                        testId="button-voice-expected-cash"
                        onAmount={(v) => form.setValue("expectedCash", v, { shouldValidate: true })}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* COUNT DRAWER divider */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t("recon.countDrawer")}
              </span>
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
            </div>

            {/* Actual Cash in Drawer */}
            <FormField
              control={form.control}
              name="countedCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    {t("recon.counted")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                        {settings.currency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        data-testid="input-counted-cash"
                        {...field}
                        onFocus={(e) => e.target.select()}
                        className="pl-14 pr-12 text-lg h-12 font-mono"
                      />
                      <VoiceMicButton
                        testId="button-voice-counted-cash"
                        onAmount={(v) => form.setValue("countedCash", v, { shouldValidate: true })}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                className="flex-1 h-12 text-base font-semibold"
                data-testid="button-analyse"
                onClick={handleAnalyse}
              >
                {t("recon.analyse")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 px-6 text-base font-semibold"
                data-testid="button-reset"
                onClick={handleReset}
              >
                {t("recon.reset")}
              </Button>
            </div>

            {/* Result panel — shown after analyse */}
            <AnimatePresence>
              {analysed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`rounded-xl border p-6 text-center space-y-3 ${statusBg}`}
                >
                  <p className="text-sm font-medium text-muted-foreground">{t("recon.difference")}</p>
                  <div className={`text-5xl font-bold font-mono tracking-tight ${statusColor}`} data-testid="text-difference">
                    {difference > 0 ? "+" : ""}{difference.toFixed(2)} {settings.currency}
                  </div>
                  <div className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${statusColor} bg-white/60 dark:bg-black/20`} data-testid="status-badge">
                    {t(`recon.${status}` as any)}
                  </div>

                  {/* Note */}
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="text-left mt-2">
                        <FormLabel className="text-sm">{t("recon.note")}</FormLabel>
                        <FormControl>
                          <Textarea data-testid="input-note" {...field} rows={2} className="bg-white/70 dark:bg-black/20" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11"
                    data-testid="button-save-record"
                  >
                    {t("recon.save")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

          </form>
        </Form>
      </div>
    </motion.div>
  );
}
