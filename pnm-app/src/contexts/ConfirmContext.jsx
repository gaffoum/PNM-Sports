import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmContext = createContext(null);

// Hook : const confirm = useConfirm();
//   const ok = await confirm({ title, message, confirmLabel, cancelLabel, danger });
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit être utilisé dans <ConfirmProvider>");
  return ctx;
}

const DEFAULTS = {
  title: "Confirmer",
  message: "",
  confirmLabel: "Confirmer",
  cancelLabel: "Annuler",
  danger: false,
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { ...options }
  const resolver = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({ ...DEFAULTS, ...options });
    });
  }, []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  // Échap = annuler, Entrée = confirmer
  useEffect(() => {
    if (!state) return;
    function onKey(e) {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => close(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="panel relative w-full max-w-md p-6 shadow-2xl animate-[fadeIn_120ms_ease-out]"
          >
            <div className="flex items-start gap-3">
              {state.danger && (
                <span className="shrink-0 w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 grid place-items-center text-red-300">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg leading-tight">{state.title}</h3>
                {state.message && (
                  <p className="text-sm text-ink-dim mt-1.5 whitespace-pre-line">{state.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => close(false)} className="btn btn-outline">{state.cancelLabel}</button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`btn ${state.danger ? "btn-danger" : "btn-primary"}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
