import type { ProjectListItem } from '../../lib/types';
import { formatBudget } from '../../lib/format';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/statusColors';

interface ProjectPopupProps {
  project: ProjectListItem;
  onViewDetails: () => void;
}

/**
 * Rendered into a detached DOM node and mounted via MapLibre's
 * Popup#setDOMContent (see MapView) — MapLibre popups are imperative and
 * live outside the Router tree, which is why `onViewDetails` is passed in
 * as a callback rather than this component using a react-router <Link>.
 */
export function ProjectPopup({ project, onViewDetails }: ProjectPopupProps) {
  const color = STATUS_COLORS[project.status];

  return (
    <div className="w-64 font-sans">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-3">
        <p
          className="text-[11px] font-medium uppercase tracking-wide"
          style={{ color }}
        >
          {STATUS_LABELS[project.status]}
        </p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">{project.name}</h3>
        <p className="mt-1 text-xs text-ink-soft">
          {project.agencyAcronym ?? project.agencyName} · {project.cityName}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-rule pt-2 text-xs">
          <dt className="text-ink-faint">Budget</dt>
          <dd className="text-right font-mono text-ink-soft">{formatBudget(project.budget)}</dd>
          <dt className="text-ink-faint">Progress</dt>
          <dd className="text-right font-mono text-ink-soft">{project.progressPercentage}%</dd>
        </dl>

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-3 text-xs font-medium text-signal hover:underline"
        >
          View details →
        </button>
      </div>
    </div>
  );
}
