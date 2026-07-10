import { supabase } from "@/shared/lib/supabase";
import type { Agent, Customer } from "@/shared/types/models";

// --- Agents & customers (dropdown sources) ---------------------------------

export async function fetchAgents(): Promise<Agent[]> {
  const { data, error } = await supabase.from("agents").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function addAgent(name: string): Promise<void> {
  const { error } = await supabase.from("agents").insert({ name });
  if (error) throw error;
}

export async function addCustomer(name: string): Promise<void> {
  const { error } = await supabase.from("customers").insert({ name });
  if (error) throw error;
}

export async function deleteAgent(id: string): Promise<void> {
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// --- Production entries -----------------------------------------------------

export type ProductionEntryRow = {
  id: string;
  date: string;
  agent_id: string | null;
  customer_id: string | null;
  agent_name: string | null;
  customer_name: string | null;
  amount: number;
};

/** All production dispatch entries, newest first, with agent/customer names joined. */
export async function fetchProductionEntries(): Promise<ProductionEntryRow[]> {
  const { data, error } = await supabase
    .from("production_entries")
    .select("id, date, agent_id, customer_id, amount, agents(name), customers(name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    agent_id: r.agent_id,
    customer_id: r.customer_id,
    agent_name: (r.agents as { name: string } | null)?.name ?? null,
    customer_name: (r.customers as { name: string } | null)?.name ?? null,
    amount: Number(r.amount),
  }));
}

export type AddProductionEntryInput = {
  date: string;
  agent_id: string;
  customer_id: string;
  amount: number;
};

export async function addProductionEntry(input: AddProductionEntryInput): Promise<void> {
  const { error } = await supabase.from("production_entries").insert(input);
  if (error) throw error;
}

export async function deleteProductionEntry(id: string): Promise<void> {
  const { error } = await supabase.from("production_entries").delete().eq("id", id);
  if (error) throw error;
}

// --- Monthly summaries (per agent, per customer) ----------------------------

export type PartyMonthlyRow = {
  id: string | null;
  name: string;
  month: string;
  amount: number;
  entries: number;
};

/**
 * Rollup views carry no FK metadata for PostgREST to embed the party name, so
 * the agent/customer names are fetched separately and joined here (same
 * approach as the stock rollups).
 */
export async function fetchAgentMonthly(): Promise<PartyMonthlyRow[]> {
  const [{ data, error }, agents] = await Promise.all([
    supabase
      .from("production_agent_monthly")
      .select("agent_id, month, amount, entries")
      .order("month", { ascending: false }),
    fetchAgents(),
  ]);
  if (error) throw error;
  const names = new Map(agents.map((a) => [a.id, a.name]));
  return (data ?? []).map((r) => ({
    id: r.agent_id,
    name: r.agent_id ? names.get(r.agent_id) ?? "—" : "—",
    month: r.month as string,
    amount: Number(r.amount ?? 0),
    entries: Number(r.entries ?? 0),
  }));
}

export async function fetchCustomerMonthly(): Promise<PartyMonthlyRow[]> {
  const [{ data, error }, customers] = await Promise.all([
    supabase
      .from("production_customer_monthly")
      .select("customer_id, month, amount, entries")
      .order("month", { ascending: false }),
    fetchCustomers(),
  ]);
  if (error) throw error;
  const names = new Map(customers.map((c) => [c.id, c.name]));
  return (data ?? []).map((r) => ({
    id: r.customer_id,
    name: r.customer_id ? names.get(r.customer_id) ?? "—" : "—",
    month: r.month as string,
    amount: Number(r.amount ?? 0),
    entries: Number(r.entries ?? 0),
  }));
}
