import { fetchAll, supabase } from "@/shared/lib/supabase";
import type { Process } from "@/shared/types/models";

export type ProcessEntryRow = {
  id: string;
  date: string;
  process: Process;
  blanket_id: string | null;
  blanket_name: string | null;
  roll: number;
  kg: number;
};

/** All process entries for a single day, with blanket name joined in. */
export async function fetchProcessDay(date: string): Promise<ProcessEntryRow[]> {
  const data = await fetchAll((from, to) =>
    supabase
      .from("process_entries")
      .select("id, date, process, blanket_id, roll, kg, blankets(name)")
      .eq("date", date)
      .order("created_at")
      .order("id")
      .range(from, to),
  );
  return data.map((r) => ({
    id: r.id,
    date: r.date,
    process: r.process as Process,
    blanket_id: r.blanket_id,
    blanket_name: (r.blankets as { name: string } | null)?.name ?? null,
    roll: Number(r.roll),
    kg: Number(r.kg),
  }));
}

export type AddProcessEntryInput = {
  date: string;
  process: Process;
  blanket_id: string | null;
  roll: number;
  kg: number;
};

export async function addProcessEntry(input: AddProcessEntryInput): Promise<void> {
  const { error } = await supabase.from("process_entries").insert(input);
  if (error) throw error;
}

export async function deleteProcessEntry(id: string): Promise<void> {
  const { error } = await supabase.from("process_entries").delete().eq("id", id);
  if (error) throw error;
}

export type ProcessTotalRow = {
  process: Process;
  period: string;
  roll: number;
  kg: number;
  entries: number;
};

export async function fetchProcessMonthly(): Promise<ProcessTotalRow[]> {
  // The view groups on (process, month), so that pair is its unique key.
  const data = await fetchAll((from, to) =>
    supabase
      .from("process_monthly_totals")
      .select("process, month, roll, kg, entries")
      .order("month", { ascending: false })
      .order("process")
      .range(from, to),
  );
  return data.map((r) => ({
    process: r.process as Process,
    period: r.month as string,
    roll: Number(r.roll ?? 0),
    kg: Number(r.kg ?? 0),
    entries: Number(r.entries ?? 0),
  }));
}

export async function fetchProcessYearly(): Promise<ProcessTotalRow[]> {
  const data = await fetchAll((from, to) =>
    supabase
      .from("process_yearly_totals")
      .select("process, year, roll, kg, entries")
      .order("year", { ascending: false })
      .order("process")
      .range(from, to),
  );
  return data.map((r) => ({
    process: r.process as Process,
    period: r.year as string,
    roll: Number(r.roll ?? 0),
    kg: Number(r.kg ?? 0),
    entries: Number(r.entries ?? 0),
  }));
}
