import { Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ImpersonationBanner() {
  const { managingCompany, stopManaging } = useAuth();
  const navigate = useNavigate();

  if (!managingCompany) return null;

  const exit = () => {
    stopManaging();
    navigate('/company-master');
  };

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-2 text-[13px] font-medium text-white"
      style={{ background: managingCompany.branding?.primaryColor || '#0A84FF' }}
    >
      <span className="flex items-center gap-2 min-w-0">
        <Building2 size={15} className="shrink-0" />
        <span className="truncate">
          Platform Admin — managing <strong>{managingCompany.name}</strong> ({managingCompany.code})
        </span>
      </span>
      <button
        onClick={exit}
        className="press-feedback shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30"
      >
        <LogOut size={13} /> Exit
      </button>
    </div>
  );
}