import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectCategory } from '@transparency-ph/shared-types';
import { PROJECT_CATEGORIES } from '@transparency-ph/shared-types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/categoryLabels';

interface CategoryFilterProps {
  activeCategories: ReadonlySet<ProjectCategory>;
  onToggle: (category: ProjectCategory) => void;
}

/**
 * Categories don't have an on-map visual (only status colors the pins), so
 * unlike StatusLegend this is a standalone control rather than doubling as
 * a key. It sits top-right, opposite the status legend, so the two filter
 * dimensions don't compete for the same corner of the map.
 */
export function CategoryFilter({ activeCategories, onToggle }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const selectedCount = activeCategories.size;

  return (
    <div className="absolute right-4 top-4 z-10 w-56 border border-rule bg-white/95 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">
          Category
        </span>
        <span className="font-mono text-xs text-ink-faint">
          {selectedCount}/{PROJECT_CATEGORIES.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-rule"
          >
            <ul>
              {CATEGORY_ORDER.map((category) => {
                const active = activeCategories.has(category);
                return (
                  <li key={category} className="border-b border-rule/60 last:border-b-0">
                    <label className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-paper">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => onToggle(category)}
                        className="h-3.5 w-3.5 accent-ink"
                      />
                      <span className="text-xs text-ink-soft">{CATEGORY_LABELS[category]}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
