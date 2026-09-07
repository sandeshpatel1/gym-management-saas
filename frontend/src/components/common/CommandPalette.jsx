import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CreditCard,
  FileBarChart,
  UsersRound,
  Building2,
  UserCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CommandPalette({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const isSuperadmin = user?.role === 'superadmin';
    const isOwner = user?.role === 'owner';

    if (isSuperadmin) {
      return [
        { label: 'Platform Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
        { label: 'Company Master', path: '/company-master', icon: Building2 },
        { label: 'All Users', path: '/superadmin/users', icon: UsersRound },
        { label: 'My Profile', path: '/profile', icon: UserCircle },
      ];
    }

    const base = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Members', path: '/members', icon: Users },
      { label: 'Register Member', path: '/members/new', icon: UserPlus },
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { label: 'Membership Plans', path: '/membership-plans', icon: CreditCard },
      { label: 'Reports', path: '/reports', icon: FileBarChart },
    ];
    if (isOwner) {
      base.push({ label: 'Staff & Users', path: '/users', icon: UsersRound });
    }
    base.push({ label: 'My Profile', path: '/profile', icon: UserCircle });
    return base;
  }, [user]);

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="glass relative w-full max-w-lg rounded-2xl shadow-2xl border border-black/[0.06] dark:border-white/[0.1] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <Search size={16} className="text-ink-tertiary dark:text-zinc-500 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages…"
                className="flex-1 bg-transparent outline-none text-[14px] text-ink dark:text-zinc-100 placeholder:text-ink-tertiary dark:placeholder:text-zinc-500"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-ink-tertiary dark:text-zinc-500 shrink-0">
                Esc
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-center text-[13px] text-ink-tertiary dark:text-zinc-500 py-8">
                  No matching pages
                </p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] text-ink dark:text-zinc-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] press-feedback"
                  >
                    <item.icon size={16} className="text-ink-secondary dark:text-zinc-400" />
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
