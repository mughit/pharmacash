import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { parseVoiceCommand } from "@/lib/voiceCommands";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { useAppContext } from "@/context/AppContext";

// Dispatches a window event so pages (e.g. Home) can react to voice actions
// without a direct component relationship.
export function dispatchVoiceAction(action: "calculate" | "save" | "reset") {
  window.dispatchEvent(new CustomEvent("voice:action", { detail: { action } }));
}

export function VoiceCommandBar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings } = useAppContext();
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  const lang = settings.language === "ar" ? "ar-MA" : "en-US";

  const handleResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal) return;
      const command = parseVoiceCommand(transcript);
      if (command.type === "navigate") {
        setLocation(command.path);
        toast({ title: command.label });
      } else if (command.type === "action") {
        dispatchVoiceAction(command.action);
      } else {
        toast({ title: t("voice.commandNotRecognized"), description: transcript });
      }
    },
    [setLocation, toast],
  );

  const handleError = useCallback(
    (error: string) => {
      if (error === "not-supported") {
        toast({ title: t("voice.notSupported") });
        setEnabled(false);
        enabledRef.current = false;
      }
      // "no-speech" and similar transient errors are ignored — onEnd will restart
    },
    [toast],
  );

  const startRef = useRef<() => void>(() => {});

  const handleEnd = useCallback(() => {
    // Auto-restart if the user still has voice commands toggled on
    // (the Web Speech API stops after a period of silence).
    if (enabledRef.current) {
      setTimeout(() => {
        if (enabledRef.current) startRef.current();
      }, 300);
    }
  }, []);

  const { supported, isListening, start, stop } = useSpeechRecognition({
    lang,
    continuous: true,
    interimResults: false,
    onResult: handleResult,
    onError: handleError,
    onEnd: handleEnd,
  });

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  const toggle = () => {
    if (!supported) {
      toast({ title: t("voice.notSupported") });
      return;
    }
    if (enabled) {
      enabledRef.current = false;
      setEnabled(false);
      stop();
      toast({ title: t("voice.commandsOff") });
    } else {
      enabledRef.current = true;
      setEnabled(true);
      start();
      toast({ title: t("voice.commandsOn"), description: t("voice.help") });
    }
  };

  useEffect(() => {
    return () => {
      enabledRef.current = false;
    };
  }, []);

  if (!supported) return null;

  return (
    <motion.button
      onClick={toggle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.92 }}
      className={`fixed bottom-5 end-5 z-20 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors
        ${enabled ? "bg-rose-600 text-white" : "bg-primary text-primary-foreground"}`}
      data-testid="button-voice-commands"
      aria-label={enabled ? t("voice.commandsOff") : t("voice.commandsOn")}
    >
      <AnimatePresence mode="wait">
        {enabled && isListening ? (
          <motion.span
            key="pulse"
            className="absolute inset-0 rounded-full bg-rose-500/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        ) : null}
      </AnimatePresence>
      {enabled ? <Mic className="h-6 w-6 relative" /> : <MicOff className="h-6 w-6 relative opacity-80" />}
    </motion.button>
  );
}
