/**
 * HR holds salaries, attendance and advances, so it is restricted to the
 * owner account. Every other admin signs in to the same dashboard but never
 * sees the module — and the matching RLS policies (migration 0018) refuse
 * their reads even if they call the API directly.
 *
 * Keep this list in step with `hr_admin_emails()` in the database.
 */
const HR_ADMIN_EMAILS = ["sneha203btcse24@igdtuw.ac.in"];

export function canAccessHr(email: string | null | undefined): boolean {
  if (!email) return false;
  return HR_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
