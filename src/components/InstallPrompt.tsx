import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so the page loads first
      setTimeout(() => setShow(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS Safari — no beforeinstallprompt, show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone && !sessionStorage.getItem("pwa-dismissed")) {
      setTimeout(() => setShow(true), 1500);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "true");
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
        >
          <div className="relative bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl p-4 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-display font-black text-sm text-foreground mb-0.5">
                  Add to Home Screen
                </h3>
                {isIOS && !deferredPrompt ? (
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Tap the <span className="text-foreground font-semibold">share button</span> then <span className="text-foreground font-semibold">"Add to Home Screen"</span> for the full app experience!
                  </p>
                ) : (
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Install Jugar for quick access and an app-like experience!
                  </p>
                )}
              </div>
            </div>

            {/* Action button */}
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/15"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="mt-3 w-full py-2.5 bg-muted/50 border border-border/30 text-foreground rounded-xl font-display font-bold text-sm hover:bg-muted/80 transition-colors"
              >
                Got it!
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
