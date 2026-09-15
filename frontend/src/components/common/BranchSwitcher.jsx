import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsUpDown, Plus, Check, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getMyBranchesApi, createBranchApi } from '../../api/companies';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CompanyLogo from './CompanyLogo';

/**
 * Lets an owner with multiple gym locations switch which branch they're
 * acting on, and add new branches, all from the same login. Renders
 * nothing for any other role - managers/trainers stay scoped to their one
 * company as before. Switching reuses the exact same session mechanism the
 * superadmin's "Manage this gym" flow already uses (AuthContext's
 * startManaging), so every existing page automatically respects it.
 */
export default function BranchSwitcher() {
  const { user, effectiveCompany, startManaging } = useAuth();
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const boxRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMyBranchesApi();
      setBranches(data);
    } catch {
      /* switcher just won't populate - everything else keeps working */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'owner') load();
  }, [user?.role]);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (user?.role !== 'owner') return null;

  const pick = (branch) => {
    startManaging({
      id: branch._id,
      name: branch.name,
      code: branch.code,
      branding: branch.branding,
    });
    setOpen(false);
  };

  const onCreated = (branch) => {
    setBranches((prev) => [...prev, branch].sort((a, b) => a.name.localeCompare(b.name)));
    setAddOpen(false);
    pick(branch);
    toast.success(`${branch.name} added — switched to it`);
  };

  return (
    <div ref={boxRef} className="relative px-3 mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] press-feedback"
      >
        <ChevronsUpDown size={14} className="text-ink-tertiary dark:text-zinc-500 shrink-0" />
        <span className="text-[12px] text-ink-secondary dark:text-zinc-400 truncate">
          {branches.length > 1 ? `${branches.length} branches` : 'Add another branch'}
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
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left press-feedback"
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
                          {!b.isActive && <span className="text-red-500 ml-1">· inactive</span>}
                        </p>
                      </div>
                      {isCurrent && <Check size={14} className="text-brand shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setAddOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-brand border-t border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] press-feedback"
            >
              <Plus size={14} /> Add Branch
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AddBranchModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={onCreated} />
    </div>
  );
}

function AddBranchModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setCode('');
    setCity('');
    setState('');
    setAddress('');
  };

  const submit = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error('Branch name and code are required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await createBranchApi({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contact: { address, city, state },
      });
      reset();
      onCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create branch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a Branch">
      <div className="space-y-4">
        <p className="text-[12.5px] text-ink-tertiary dark:text-zinc-500">
          A branch is a fully separate location — its own name, staff, members, and settings —
          that you can switch into from this same login.
        </p>
        <Input
          label="Branch Name"
          placeholder="Fit Yard — Powai"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Branch Code"
          placeholder="FITYARDPOWAI"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
          <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button className="w-full" loading={saving} onClick={submit}>
          Create Branch
        </Button>
      </div>
    </Modal>
  );
}