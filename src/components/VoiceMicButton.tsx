import { Mic } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { parseSpokenAmount } from "@/lib/voiceNumbers";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";

interface VoiceMicButtonProps {
  onAmount: (value: number) => void;
  testId?: string;
}

export function VoiceMicButton({ onAmount, testId }: VoiceMicButtonProps) {
  const { toast } = useToast();
  const { settings } = useAppContext();
  const lang = settings.language === "ar" ? "ar-MA" : "en-US";

  const { supported, isListening, start } = useSpeechRecognition({
    lang,
    continuous: false,
    interimResults: false,
    onResult: (transcript, isFinal) => {
      if (!isFinal) return;
      const value = parseSpokenAmount(transcript);
      if (value !== null && value >= 0) {
        onAmount(value);
      } else {
        toast({ title: t("voice.notUnderstood"), description: transcript });
      }
    },
    onError: (error) => {
      if (error === "not-supported") {
        toast({ title: t("voice.notSupported") });
      } else if (error !== "no-speech" && error !== "aborted") {
        toast({ title: t("voice.notUnderstood") });
      }
    },
  });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={start}
      data-testid={testId}
      aria-label={t("voice.dictate")}
      className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center transition-colors
        ${isListening ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"}`}
    >
      <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
    </button>
  );
}
