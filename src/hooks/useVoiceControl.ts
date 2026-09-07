import { useCallback, useRef } from "react";

export function useTextToSpeech(lang: string = "ar-MA") {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const pickVoice = useCallback(() => {
    if (!supported) return null;
    if (voiceRef.current) return voiceRef.current;
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice =
      voices.find((v) => v.lang?.toLowerCase().startsWith("ar-ma")) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("ar")) ||
      null;
    voiceRef.current = arabicVoice;
    return arabicVoice;
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        const voice = pickVoice();
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore speech synthesis errors silently
      }
    },
    [lang, supported, pickVoice],
  );

  const stopSpeaking = useCallback(() => {
    if (supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, [supported]);

  return { supported, speak, stopSpeaking };
}
