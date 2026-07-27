import { CITIZEN_REPORT_CATEGORY_LABELS } from '../../lib/citizenReportLabels';
import { formatDate } from '../../lib/format';
import type { CitizenReport } from '../../lib/types';

interface ReportsListProps {
  isPending: boolean;
  isError: boolean;
  reports: CitizenReport[] | undefined;
}

export function ReportsList({ isPending, isError, reports }: ReportsListProps) {
  if (isPending) {
    return <p className="mt-2 text-sm text-ink-faint">Loading reports…</p>;
  }

  if (isError) {
    return <p className="mt-2 text-sm text-ink-faint">Couldn't load reports for this project.</p>;
  }

  if (!reports || reports.length === 0) {
    return <p className="mt-2 text-sm text-ink-faint">No approved reports yet.</p>;
  }

  return (
    <ul className="mt-3 space-y-4 border-l border-rule pl-4">
      {reports.map((report) => (
        <li key={report.id} className="relative">
          <span aria-hidden className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-signal" />
          <p className="text-[11px] uppercase tracking-wide text-ink-faint">
            {CITIZEN_REPORT_CATEGORY_LABELS[report.category]} · {formatDate(report.createdAt)}
          </p>
          {report.comment && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{report.comment}</p>}
          <p className="mt-1 text-xs text-ink-faint">Reported by {report.reporterName}</p>
        </li>
      ))}
    </ul>
  );
}
