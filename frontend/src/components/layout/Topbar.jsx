import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CommandPalette from '../common/CommandPalette';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="glass sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <h1 className="text-[20px] font-semibold text-ink dark:text-zinc-100 display-text">{title}</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="press-feedback flex items-center gap-2 h-9 px-3 rounded-full text-ink-secondary dark:text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] text-[13px]"
            title="Search (Ctrl+K)"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-ink-tertiary dark:text-zinc-500">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="press-feedback h-9 w-9 rounded-full flex items-center justify-center text-ink-secondary dark:text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="press-feedback flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            title="View profile"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-medium text-ink dark:text-zinc-100 leading-tight">
                {user?.name}
              </p>
              <p className="text-[12px] text-ink-tertiary dark:text-zinc-500 leading-tight">
                {user?.email}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-black/[0.06] dark:bg-white/[0.1] flex items-center justify-center text-[13px] font-semibold text-ink-secondary dark:text-zinc-300 overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                (user?.name || '?')[0]?.toUpperCase()
              )}
            </div>
          </button>

          <button
            onClick={logout}
            className="press-feedback h-9 w-9 rounded-full flex items-center justify-center text-ink-secondary dark:text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}