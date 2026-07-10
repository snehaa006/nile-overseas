import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { dateKey, formatDate } from "@/shared/utils/format";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Value/onChange use "YYYY-MM-DD" strings — one row per day in `daily_stock`.
 */
export function DatePicker({
  value,
  onChange,
  className,
}: {
  value: string; // "YYYY-MM-DD"
  onChange: (next: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const [month, setMonth] = useState(Number(value.slice(5, 7)) - 1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setYear(Number(value.slice(0, 4)));
    setMonth(Number(value.slice(5, 7)) - 1);
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selectedYear = Number(value.slice(0, 4));
  const selectedMonth = Number(value.slice(5, 7)) - 1;
  const selectedDay = Number(value.slice(8, 10));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {formatDate(value)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-popover p-3 shadow-lg animate-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">
              {new Date(year, month, 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className="rounded p-1 hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`empty-${i}`} />;
              const isSelected =
                year === selectedYear && month === selectedMonth && day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md py-1 text-sm transition",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(dateKey());
              setOpen(false);
            }}
            className="mt-3 w-full rounded-md border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Jump to today
          </button>
        </div>
      )}
    </div>
  );
}
