import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { searchMembersApi } from '../../api/members';

export default function MemberSearchBar({ placeholder = 'Search members by name, phone, email, or code…' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await searchMembersApi(q);
        setResults(data);
        setOpen(true);
      } catch {
        /* silent - keep previous results */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const goTo = (member) => {
    setOpen(false);
    setQuery('');
    navigate(`/members/${member._id}`);
  };

  return (
    <div ref={boxRef} className="relative w-full sm:w-96">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[14px] outline-none focus:border-brand bg-white dark:bg-zinc-900 dark:text-zinc-100"
      />
      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] rounded-xl shadow-card-hover max-h-80 overflow-y-auto">
          {loading && <p className="px-4 py-3 text-[12px] text-ink-tertiary">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-[12px] text-ink-tertiary">No members found</p>
          )}
          {results.map((m) => (
            <button
              key={m._id}
              onClick={() => goTo(m)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] text-left press-feedback"
            >
              <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink dark:text-zinc-100 truncate">{m.fullName}</p>
                <p className="text-[11px] text-ink-tertiary truncate">
                  {m.memberCode} · {m.phone}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}