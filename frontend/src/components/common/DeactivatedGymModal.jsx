import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEACTIVATED_GYM_EVENT } from '../../utils/deactivatedGymBus';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Single global listener for the "gym deactivated" notice (see
 * utils/deactivatedGymBus.js). Fires when: an owner clicks a deactivated
 * branch in BranchSwitcher/MyBranchesOverview, or the backend rejects a
 * request mid-session because the gym it was scoped to just got
 * deactivated by superadmin (axiosClient's response interceptor). Mounted
 * once in App.jsx so it works from any page.
 */
export default function DeactivatedGymModal() {
  const { managingCompany, stopManaging, logout, user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e) => setMessage(e.detail?.message || 'This gym has been deactivated.');
    window.addEventListener(DEACTIVATED_GYM_EVENT, handler);
    return () => window.removeEventListener(DEACTIVATED_GYM_EVENT, handler);
  }, []);

  const acknowledge = () => {
    setMessage('');
    if (user?.role === 'superadmin') return; // superadmin is never blocked by this
    if (managingCompany) {
      // Was viewing a branch other than their home - drop back to it.
      stopManaging();
      navigate('/dashboard');
    } else {
      // Their own home company is the one that's deactivated - there's no
      // safe fallback to send them to, so end the session cleanly.
      logout();
      navigate('/login');
    }
  };

  return (
    <Modal open={!!message} onClose={acknowledge} title="Gym Deactivated" width="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
          <ShieldAlert size={22} />
        </div>
        <p className="text-[13.5px] text-ink-secondary dark:text-zinc-400 leading-relaxed">
          {message}
        </p>
        <Button className="w-full" onClick={acknowledge}>
          Okay
        </Button>
      </div>
    </Modal>
  );
}