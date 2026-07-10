import type { ReactNode } from "react";

type AlertKind = "normal" | "advisory" | "warning" | "info";

const styles: Record<AlertKind, string> = {
  normal: "border-normal/40 bg-normal/10 text-normal",
  advisory: "border-advisory/40 bg-advisory/10 text-advisory",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-hud/40 bg-hud/10 text-hud",
};

export function AlertBadge({
  kind = "info",
  children,
  className = "",
}: {
  kind?: AlertKind;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium transition-all duration-300 ${styles[kind]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border border-panel-border bg-panel-raised p-4 shadow-sm transition-all duration-300 ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
