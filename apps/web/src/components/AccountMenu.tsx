import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Self-positioned like StatusLegend/CategoryFilter (dropped flatly into
 * MapPage, not part of the header block) - sits just left of
 * CategoryFilter (which occupies right-4, 224px wide) so the two don't
 * overlap.
 */
export function AccountMenu() {
  const { user, isAuthReady, logout } = useAuth();

  // Nothing renders until the silent-refresh check on load finishes -
  // avoids a flash of "Sign in" for someone who's actually already signed
  // in via a stored refresh token.
  if (!isAuthReady) return null;

  if (!user) {
    return (
      <Link
        to="/login"
        className="absolute right-64 top-4 z-10 border border-rule bg-white/95 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm hover:bg-paper"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="absolute right-64 top-4 z-10 flex items-center gap-2 border border-rule bg-white/95 px-3 py-1.5 text-xs shadow-sm">
      <span className="text-ink-soft">{user.fullName}</span>
      <button type="button" onClick={logout} className="font-medium text-signal hover:underline">
        Sign out
      </button>
    </div>
  );
}
