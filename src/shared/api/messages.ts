import { supabase } from "@/shared/lib/supabase";
import type { ContactMessage } from "@/shared/types/models";

/** All enquiries, newest first — staff panel only (RLS-gated). */
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Submit an enquiry from the public Contact form. No `.select()` here:
 * anonymous visitors can insert but not read the table back.
 */
export async function createContactMessage(input: {
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) throw error;
}

export async function setContactMessageRead(
  id: string,
  isRead: boolean,
): Promise<ContactMessage> {
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ is_read: isRead })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) throw error;
}
