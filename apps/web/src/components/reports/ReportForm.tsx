import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CitizenReportCategory } from '@transparency-ph/shared-types';
import { apiRequest, ApiError } from '../../lib/apiClient';
import { CITIZEN_REPORT_CATEGORY_LABELS, CITIZEN_REPORT_CATEGORY_ORDER } from '../../lib/citizenReportLabels';
import type { SubmitReportResponse } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

type LocationStatus = 'pending' | 'captured' | 'unavailable';

interface ReportFormProps {
  idOrSlug: string;
}

// A one-shot submit, same as LoginPage/RegisterPage - deliberately not a
// React Query mutation. Also: a newly-submitted report is PENDING and
// won't appear in the (APPROVED-only) reports list, so there's nothing to
// invalidate/refetch on success - the confirmation is just local UI state.
export function ReportForm({ idOrSlug }: ReportFormProps) {
  const { user } = useAuth();

  const [category, setCategory] = useState<CitizenReportCategory>('NO_ACTIVITY');
  const [comment, setComment] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Capture location once, on mount - only matters once the form is
  // actually going to be shown (a signed-out visitor sees the inline
  // prompt below instead, so no point asking for permission they can't
  // use yet).
  useEffect(() => {
    if (!user || !('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus('captured');
      },
      () => setLocationStatus('unavailable'),
      { timeout: 10_000 },
    );
  }, [user]);

  if (!user) {
    return (
      <p className="mt-2 text-sm text-ink-soft">
        <Link to="/login" className="font-medium text-signal hover:underline">
          Sign in
        </Link>{' '}
        to report an issue with this project.
      </p>
    );
  }

  if (isSubmitted) {
    return (
      <p className="mt-2 text-sm text-ink-soft">
        Thanks — your report has been submitted and is awaiting review before it appears here.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest<SubmitReportResponse>(`/projects/${idOrSlug}/reports`, {
        method: 'POST',
        body: {
          category,
          comment: comment.trim() ? comment.trim() : undefined,
          ...(coords ?? {}),
        },
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">What's going on?</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CitizenReportCategory)}
          className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal"
        >
          {CITIZEN_REPORT_CATEGORY_ORDER.map((value) => (
            <option key={value} value={value}>
              {CITIZEN_REPORT_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Details <span className="normal-case text-ink-faint">(optional)</span>
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={3}
          className="mt-1 w-full resize-none border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal"
        />
      </label>

      <p className="text-xs text-ink-faint">
        {locationStatus === 'pending' && 'Getting your location…'}
        {locationStatus === 'captured' && 'Your current location will be attached to this report.'}
        {locationStatus === 'unavailable' && "Submitting without a location — we couldn't access it."}
      </p>

      {error && <p className="text-sm text-status-cancelled">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  );
}
