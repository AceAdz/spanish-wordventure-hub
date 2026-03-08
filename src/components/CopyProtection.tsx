import { useEffect } from "react";

export default function CopyProtection() {
  useEffect(() => {
    // Disable right-click
    const handleContext = (e: MouseEvent) => { e.preventDefault(); };
    // Disable common dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) { e.preventDefault(); return; }
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key === "u") { e.preventDefault(); return; }
    };

    document.addEventListener("contextmenu", handleContext);
    document.addEventListener("keydown", handleKeyDown);

    // Add CSS to disable text selection on non-input elements
    const style = document.createElement("style");
    style.textContent = `
      body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
      input, textarea, [contenteditable] { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", handleContext);
      document.removeEventListener("keydown", handleKeyDown);
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
