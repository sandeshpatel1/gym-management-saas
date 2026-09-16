import { useAuth } from '../context/AuthContext';

/**
 * Thin wrapper kept so Sidebar/BranchSwitcher/MyBranchesOverview don't need
 * any changes - the actual branch list now lives in AuthContext (app root,
 * never remounts on navigation) instead of being fetched here on every
 * mount, which used to cause a visible hide/show flicker whenever the
 * route changed (Sidebar remounts per-page since there's no shared layout
 * route - see App.jsx).
 */
export function useMyBranches() {
  const { branches, branchesLoading, reloadBranches } = useAuth();
  return { branches, loading: branchesLoading, reload: reloadBranches };
}