import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyBranchesApi } from '../api/companies';

/**
 * Shared by the Sidebar (to decide whether "All Branches" should show at
 * all) and BranchSwitcher (to render the dropdown) so both stay in sync
 * without duplicating the fetch logic. Only owners have branches to fetch -
 * every other role gets an empty, non-loading list back immediately.
 */
export function useMyBranches() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (user?.role !== 'owner') return;
    setLoading(true);
    try {
      const { data } = await getMyBranchesApi();
      setBranches(data);
    } catch {
      /* switcher/rollup just won't populate - everything else keeps working */
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { branches, loading, reload };
}