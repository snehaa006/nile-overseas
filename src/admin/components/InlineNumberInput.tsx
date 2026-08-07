import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

/**
 * A number cell that commits on blur or Enter and rolls back on a failed
 * save — used for the hours and overtime columns in the attendance tables.
 */
export function InlineNumberInput({
  value,
  onCommit,
  min = 0,
  max = 24,
  step = "0.5",
  disabled,
  className,
  placeholder,
}: {
  value: number;
  onCommit: (next: number) => Promise<void>;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(String(value)), [value]);

  const commit = async () => {
    const next = Number(draft);
    if (draft === "" || !Number.isFinite(next) || next < min || next > max) {
      toast.error(`Enter a value between ${min} and ${max}`);
      setDraft(String(value));
      return;
    }
    if (next === Number(value)) return;
    setSaving(true);
    try {
      await onCommit(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      setDraft(String(value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={disabled ? "" : draft}
      disabled={disabled || saving}
      placeholder={disabled ? "—" : placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={cn("mx-auto h-9 w-20 text-center tabular-nums", className)}
    />
  );
}
