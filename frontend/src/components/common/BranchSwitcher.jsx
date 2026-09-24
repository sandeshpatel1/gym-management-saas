import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsUpDown, Check, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMyBranches } from '../../hooks/useMyBranches';
import { notifyDeactivatedGym } from '../../utils/deactivatedGymBus';
import CompanyLogo from './CompanyLogo';

/**
 * Lets an owner with multiple gym locations switch which branch they're
 * acting on, from the same login. Renders nothing for any other role.
 * Branches themselves are created by superadmin only (see AddBranch.jsx) -
 * this component is purely for switching between ones already granted.
 * Switching reuses the same session mechanism the superadmin's "Manage
 * this gym" flow uses (AuthContext's startManaging), so every existing
 * page automatically respects it. A deactivated branch stays visible
 * (greyed out) so the owner knows it exists, but clicking it shows the
 * "contact admin" popup instead of switching into it.
 */
export default function BranchSwitcher() {
  const { user, effectiveCompany, startManaging } = useAuth();
  const { branches, loading } = useMyBranches();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (user?.role !== 'owner' || branches.length <= 1) return null;

  const pick = (branch) => {
    if (!branch.isActive) {
      notifyDeactivatedGym(
        `${branch.name} has been deactivated. Contact your platform admin to reactivate it.`
      );
      return;
    }
    startManaging({
      id: branch._id,
      name: branch.name,
      code: branch.code,
      branding: branch.branding,
    });
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative px-3 mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] press-feedback"
      >
        <ChevronsUpDown size={14} className="text-ink-tertiary dark:text-zinc-500 shrink-0" />
        <span className="text-[12px] text-ink-secondary dark:text-zinc-400 truncate">
          {branches.length} branches
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-3 right-3 z-40 mt-1 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] rounded-xl shadow-card-hover overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto py-1">
              {loading ? (
                <p className="px-3 py-2.5 text-[12px] text-ink-tertiary">Loading…</p>
              ) : (
                branches.map((b) => {
                  const isCurrent =
                    String(effectiveCompany?.id || effectiveCompany?._id) === String(b._id);
                  return (
                    <button
                      key={b._id}
                      onClick={() => pick(b)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left press-feedback ${
                        b.isActive
                          ? 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <CompanyLogo company={b} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink dark:text-zinc-100 truncate">
                          {b.name}
                        </p>
                        <p className="text-[11px] text-ink-tertiary dark:text-zinc-500 truncate flex items-center gap-1">
                          {b.contact?.city && (
                            <>
                              <MapPin size={10} /> {b.contact.city}
                              {b.contact?.state ? `, ${b.contact.state}` : ''}
                            </>
                          )}
                          {!b.isActive && <span className="text-red-500 ml-1">· deactivated</span>}
                        </p>
                      </div>
                      {isCurrent && <Check size={14} className="text-brand shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <p className="px-3 py-2.5 text-[11px] text-ink-tertiary dark:text-zinc-500 border-t border-black/[0.06] dark:border-white/[0.08]">
              Need another branch? Ask your platform admin.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}