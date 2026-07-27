/**
 * Shared display-formatting helpers. formatBudget originally lived inline
 * in ProjectPopup.tsx (Phase 3) — promoted here in Phase 5 now that
 * ProjectDetailPage needs the exact same formatting, so both stay in sync
 * from one place instead of drifting.
 */

// Budget arrives from the API as a string (see lib/types.ts / the API's
// project.repository.ts comment on why: Decimal(15,2) precision would be
// lossy as a JS number). Number() + Intl formatting is fine for *display*
// here since we're not doing arithmetic on the result.
export function formatBudget(budget: string): string {
  const value = Number(budget);
  if (Number.isNaN(value)) return budget;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

// Dates arrive as ISO strings (JSON has no Date type). null/undefined means
// "not set yet" (e.g. a project with no targetCompletion) rather than an
// error, so callers get a display fallback instead of having to branch
// every time.
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}
