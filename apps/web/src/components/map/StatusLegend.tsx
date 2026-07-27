import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectStatus } from '@transparency-ph/shared-types';
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from '../../lib/statusColors';

interface StatusLegendProps {
  activeStatuses: ReadonlySet<ProjectStatus>;
  onToggle: (status: ProjectStatus) => void;
}

/**
 * Doubles as the status filter: each row is a toggle, not just a key. This
 * is why it lives where a citizen's eye already goes to decode pin colors —
 * turning a color off here is the same mental action as "hide this color
 * on the map", so filtering and legend-reading are the same gesture instead
 * of two separate controls.
 */
export function StatusLegend({ activeStatuses, onToggle }: StatusLegendProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 z-10 w-56 border border-rule bg-white/95 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-rule px-3 py-2 text-left"
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">
          Project status
        </span>
        <span className="font-mono text-xs text-ink-faint">{open ? '−' : '+'}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {STATUS_ORDER.map((status) => {
              const active = activeStatuses.has(status);
              return (
                <li key={status} className="border-b border-rule/60 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onToggle(status)}
                    aria-pressed={active}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-opacity hover:bg-paper"
                    style={{ opacity: active ? 1 : 0.35 }}
                  >
                    <span aria-hidden className="h-3.5 w-1 shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                    <span className="text-xs text-ink-soft">{STATUS_LABELS[status]}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
