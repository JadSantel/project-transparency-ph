import { Link, useParams } from 'react-router-dom';
import { CATEGORY_LABELS } from '../lib/categoryLabels';
import { formatBudget, formatDate } from '../lib/format';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/statusColors';
import type { ProjectUpdate } from '../lib/types';
import { useProject } from '../hooks/useProject';
import { useProjectUpdates } from '../hooks/useProjectUpdates';
import { useProjectReports } from '../hooks/useProjectReports';
import { ReportForm } from '../components/reports/ReportForm';
import { ReportsList } from '../components/reports/ReportsList';

const UPDATE_TYPE_LABELS: Record<ProjectUpdate['type'], string> = {
  MILESTONE: 'Milestone',
  PROGRESS: 'Progress update',
  STATUS_CHANGE: 'Status change',
};

export function ProjectDetailPage() {
  const { idOrSlug } = useParams();
  const projectQuery = useProject(idOrSlug);
  const updatesQuery = useProjectUpdates(idOrSlug);
  const reportsQuery = useProjectReports(idOrSlug);

  if (projectQuery.isPending) {
    return <CenteredMessage eyebrow="Loading" title="Fetching project…" />;
  }

  if (projectQuery.isError) {
    const notFound = projectQuery.error.status === 404;
    return (
      <CenteredMessage
        eyebrow={notFound ? 'Not found' : 'Something went wrong'}
        title={notFound ? `No project matches "${idOrSlug}"` : projectQuery.error.message}
      />
    );
  }

  const project = projectQuery.data.data;
  const statusColor = STATUS_COLORS[project.status];

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="text-xs font-medium text-signal hover:underline">
          ← Back to map
        </Link>

        <header className="mt-6 border-b border-rule pb-6">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: statusColor }} />
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: statusColor }}>
              {STATUS_LABELS[project.status]}
            </p>
            <span className="text-ink-faint">·</span>
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">
              {CATEGORY_LABELS[project.category]}
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-semibold leading-snug text-ink">{project.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {project.agencyAcronym ?? project.agencyName} · {project.cityName}
          </p>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-rule pb-6 sm:grid-cols-4">
          <Stat label="Budget" value={formatBudget(project.budget)} mono />
          <Stat label="Progress" value={`${project.progressPercentage}%`} mono />
          <Stat label="Funding source" value={project.fundingSource ?? '—'} />
          <Stat label="Started" value={formatDate(project.startDate)} />
          <Stat label="Target completion" value={formatDate(project.targetCompletion)} />
          <Stat label="Actual completion" value={formatDate(project.actualCompletion)} />
        </section>

        <ProgressBar percentage={project.progressPercentage} color={statusColor} />

        <section className="mt-6 border-b border-rule pb-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Description</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{project.description}</p>
        </section>

        <section className="mt-6 border-b border-rule pb-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Update timeline</p>
          <UpdatesTimeline
            isPending={updatesQuery.isPending}
            isError={updatesQuery.isError}
            updates={updatesQuery.data?.data}
          />
        </section>

        <section className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Citizen reports</p>
          <ReportsList
            isPending={reportsQuery.isPending}
            isError={reportsQuery.isError}
            reports={reportsQuery.data?.data}
          />
          <ReportForm idOrSlug={project.slug} />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className={`mt-0.5 text-sm text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function ProgressBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="mt-4">
      <div className="h-1.5 w-full overflow-hidden bg-rule">
        <div
          className="h-full transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function UpdatesTimeline({
  isPending,
  isError,
  updates,
}: {
  isPending: boolean;
  isError: boolean;
  updates: ProjectUpdate[] | undefined;
}) {
  if (isPending) {
    return <p className="mt-2 text-sm text-ink-faint">Loading updates…</p>;
  }

  if (isError) {
    return <p className="mt-2 text-sm text-ink-faint">Couldn't load updates for this project.</p>;
  }

  if (!updates || updates.length === 0) {
    return <p className="mt-2 text-sm text-ink-faint">No updates have been recorded yet.</p>;
  }

  return (
    <ol className="mt-3 space-y-4 border-l border-rule pl-4">
      {updates.map((update) => (
        <li key={update.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-signal"
          />
          <p className="text-[11px] uppercase tracking-wide text-ink-faint">
            {UPDATE_TYPE_LABELS[update.type]} · {formatDate(update.updateDate)}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-ink">{update.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{update.description}</p>
          {(update.progressAtTime !== null || update.createdByName) && (
            <p className="mt-1 text-xs text-ink-faint">
              {update.progressAtTime !== null ? `Progress at the time: ${update.progressAtTime}%` : null}
              {update.progressAtTime !== null && update.createdByName ? ' · ' : null}
              {update.createdByName ? `Logged by ${update.createdByName}` : null}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function CenteredMessage({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-paper text-center">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{eyebrow}</p>
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <Link to="/" className="text-sm font-medium text-signal hover:underline">
        ← Back to map
      </Link>
    </div>
  );
}
