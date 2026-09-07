import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { AdUnit } from "@/components/AdUnit";
import { VoiceCommandBar } from "@/components/VoiceCommandBar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-4 md:p-8">
          {children}
        </div>
        <div className="mx-auto max-w-5xl px-4 md:px-8 pb-6 no-print">
          <AdUnit slot="XXXXXXXXXX" format="horizontal" className="rounded-xl overflow-hidden opacity-80" />
        </div>
      </main>
      <VoiceCommandBar />
    </div>
  );
}
