import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatMonth } from "@/shared/utils/format";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Value/onChange use "YYYY-MM" strings (matches the `month` column's
 * first-of-month convention when a "-01" suffix is appended by the caller).
 */
export function MonthPicker({
  value,
  onChange,
  className,
}: {
  value: string; // "YYYY-MM"
  onChange: (next: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setYear(Number(value.slice(0, 4))), [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectedYear = Number(value.slice(0, 4));
  const selectedMonth = Number(value.slice(5, 7));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {formatMonth(`${value}-01`)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-popover p-3 shadow-lg animate-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_LABELS.map((label, i) => {
              const monthNum = i + 1;
              const isSelected = year === selectedYear && monthNum === selectedMonth;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onChange(`${year}-${String(monthNum).padStart(2, "0")}`);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-sm transition",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              onChange(ym);
              setOpen(false);
            }}
            className="mt-3 w-full rounded-md border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Jump to current month
          </button>
        </div>
      )}
    </div>
  );
}
