import { cn } from "@/shared/utils/cn";
import type { AttendanceStatus } from "@/shared/types/models";

/**
 * The P / A pair. Tapping the letter that is already lit clears the mark,
 * so `onToggle` receives the letter pressed and the caller decides.
 */
export function AttendanceToggle({
  status,
  onToggle,
  disabled,
  label,
}: {
  status?: AttendanceStatus;
  onToggle: (next: AttendanceStatus) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border">
      <MarkButton
        letter="P"
        title={`Mark ${label} present`}
        active={status === "present"}
        tone="present"
        disabled={disabled}
        onClick={() => onToggle("present")}
      />
      <MarkButton
        letter="A"
        title={`Mark ${label} absent`}
        active={status === "absent"}
        tone="absent"
        disabled={disabled}
        onClick={() => onToggle("absent")}
      />
    </div>
  );
}

function MarkButton({
  letter,
  title,
  active,
  tone,
  disabled,
  onClick,
}: {
  letter: string;
  title: string;
  active: boolean;
  tone: "present" | "absent";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-9 w-10 text-sm font-bold transition-colors first:border-r disabled:opacity-50",
        !active && "bg-background text-muted-foreground",
        !active && tone === "present" && "hover:bg-emerald-50 hover:text-emerald-700",
        !active && tone === "absent" && "hover:bg-rose-50 hover:text-rose-700",
        active && tone === "present" && "bg-emerald-600 text-white",
        active && tone === "absent" && "bg-rose-600 text-white",
      )}
    >
      {letter}
    </button>
  );
}
