import { AnimatePresence, motion } from 'framer-motion';
import { MapView } from '../components/map/MapView';
import { StatusLegend } from '../components/map/StatusLegend';
import { CategoryFilter } from '../components/map/CategoryFilter';
import { AccountMenu } from '../components/AccountMenu';
import { useProjectFilters } from '../hooks/useProjectFilters';

export function MapPage() {
  const filters = useProjectFilters();

  return (
    <div className="relative h-screen w-screen">
      <header className="pointer-events-none absolute left-4 top-4 z-10">
        <p className="text-sm font-semibold tracking-tight text-ink">Project Transparency PH</p>
        <p className="text-xs text-ink-faint">Cagayan de Oro · infrastructure projects</p>
      </header>

      <AnimatePresence>
        {filters.isFiltered && (
          <motion.button
            type="button"
            onClick={filters.clearAll}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-1/2 top-4 z-10 -translate-x-1/2 border border-rule bg-white/95 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm hover:bg-paper"
          >
            Filters active · Clear all
          </motion.button>
        )}
      </AnimatePresence>

      <MapView activeStatuses={filters.activeStatuses} activeCategories={filters.activeCategories} />
      <StatusLegend activeStatuses={filters.activeStatuses} onToggle={filters.toggleStatus} />
      <CategoryFilter activeCategories={filters.activeCategories} onToggle={filters.toggleCategory} />
      <AccountMenu />
    </div>
  );
}
