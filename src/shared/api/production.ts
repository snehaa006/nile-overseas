import { fetchAll, supabase } from "@/shared/lib/supabase";
import type { Agent, Customer } from "@/shared/types/models";

// --- Agents & customers (dropdown sources) ---------------------------------

export async function fetchAgents(): Promise<Agent[]> {
  return fetchAll((from, to) =>
    supabase.from("agents").select("*").order("name").order("id").range(from, to),
  );
}

export async function fetchCustomers(): Promise<Customer[]> {
  return fetchAll((from, to) =>
    supabase.from("customers").select("*").order("name").order("id").range(from, to),
  );
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

const INVOICES_BUCKET = "invoices";

export type ProductionEntryRow = {
  id: string;
  date: string;
  agent_id: string | null;
  customer_id: string | null;
  agent_name: string | null;
  customer_name: string | null;
  amount: number;
  invoice_path: string | null;
};

/** All production dispatch entries, newest first, with agent/customer names joined. */
export async function fetchProductionEntries(): Promise<ProductionEntryRow[]> {
  const data = await fetchAll((from, to) =>
    supabase
      .from("production_entries")
      .select("id, date, agent_id, customer_id, amount, invoice_path, agents(name), customers(name)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return data.map((r) => ({
    id: r.id,
    date: r.date,
    agent_id: r.agent_id,
    customer_id: r.customer_id,
    agent_name: (r.agents as { name: string } | null)?.name ?? null,
    customer_name: (r.customers as { name: string } | null)?.name ?? null,
    amount: Number(r.amount),
    invoice_path: r.invoice_path,
  }));
}

export type AddProductionEntryInput = {
  date: string;
  agent_id: string;
  customer_id: string;
  amount: number;
  /** Optional invoice PDF, stored in the private invoices bucket. */
  invoiceFile?: File | null;
};

export async function addProductionEntry(input: AddProductionEntryInput): Promise<void> {
  const { invoiceFile, ...entry } = input;

  let invoicePath: string | null = null;
  if (invoiceFile) {
    invoicePath = `${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(INVOICES_BUCKET)
      .upload(invoicePath, invoiceFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });
    if (uploadError) throw uploadError;
  }

  const { error } = await supabase
    .from("production_entries")
    .insert({ ...entry, invoice_path: invoicePath });
  if (error) {
    // roll back the orphaned storage object on DB failure
    if (invoicePath) await supabase.storage.from(INVOICES_BUCKET).remove([invoicePath]);
    throw error;
  }
}

export async function deleteProductionEntry(entry: {
  id: string;
  invoice_path: string | null;
}): Promise<void> {
  const { error } = await supabase.from("production_entries").delete().eq("id", entry.id);
  if (error) throw error;
  if (entry.invoice_path) {
    await supabase.storage.from(INVOICES_BUCKET).remove([entry.invoice_path]);
  }
}

/**
 * The invoices bucket is private, so viewing goes through a short-lived
 * signed URL rather than a public one.
 */
export async function getInvoiceUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(INVOICES_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

// --- Monthly summaries (per agent, per customer) ----------------------------

/** One party's (agent or customer) dispatch total for a single period. */
export type PartyPeriodRow = {
  id: string | null;
  name: string;
  period: string;
  amount: number;
  entries: number;
};

export type PeriodKind = "month" | "year";

/**
 * Rollup views carry no FK metadata for PostgREST to embed the party name, so
 * the agent/customer names are fetched separately and joined here (same
 * approach as the stock rollups).
 */
export async function fetchAgentSummary(period: PeriodKind): Promise<PartyPeriodRow[]> {
  // The view groups on (agent_id, period), so that pair orders it uniquely.
  const [data, agents] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from(period === "month" ? "production_agent_monthly" : "production_agent_yearly")
        .select(`agent_id, ${period}, amount, entries`)
        .order(period, { ascending: false })
        .order("agent_id")
        .range(from, to),
    ),
    fetchAgents(),
  ]);
  const names = new Map(agents.map((a) => [a.id, a.name]));
  return data.map((r) => {
    const row = r as unknown as { agent_id: string | null; amount: number | null; entries: number | null } & Record<string, string>;
    return {
      id: row.agent_id,
      name: row.agent_id ? names.get(row.agent_id) ?? "—" : "—",
      period: row[period],
      amount: Number(row.amount ?? 0),
      entries: Number(row.entries ?? 0),
    };
  });
}

export async function fetchCustomerSummary(period: PeriodKind): Promise<PartyPeriodRow[]> {
  const [data, customers] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from(period === "month" ? "production_customer_monthly" : "production_customer_yearly")
        .select(`customer_id, ${period}, amount, entries`)
        .order(period, { ascending: false })
        .order("customer_id")
        .range(from, to),
    ),
    fetchCustomers(),
  ]);
  const names = new Map(customers.map((c) => [c.id, c.name]));
  return data.map((r) => {
    const row = r as unknown as { customer_id: string | null; amount: number | null; entries: number | null } & Record<string, string>;
    return {
      id: row.customer_id,
      name: row.customer_id ? names.get(row.customer_id) ?? "—" : "—",
      period: row[period],
      amount: Number(row.amount ?? 0),
      entries: Number(row.entries ?? 0),
    };
  });
}
