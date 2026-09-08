import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  CalendarCheck,
  FileBarChart,
  Building2,
  UsersRound,
  QrCode,
  Receipt,
  PhoneCall,
  LogOut,
} from 'lucide-react';
import CompanyLogo from '../common/CompanyLogo';
import { useAuth } from '../../context/AuthContext';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 press-feedback ${
    isActive
      ? 'bg-brand/10 text-brand dark:bg-brand/15'
      : 'text-ink-secondary hover:bg-black/[0.04] hover:text-ink dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100'
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperadmin = user?.role === 'superadmin';
  const isOwner = user?.role === 'owner';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="glass w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-black/[0.06] dark:border-white/[0.08]">
      <div className="flex items-center gap-3 px-5 py-5">
        <CompanyLogo company={user?.company} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 truncate">
            {user?.company?.name || 'Platform Admin'}
          </p>
          <p className="text-[12px] text-ink-tertiary dark:text-zinc-500 capitalize">{user?.role}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {!isSuperadmin && (
          <>
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/members" className={linkClass}>
              <Users size={18} /> Members
            </NavLink>
            <NavLink to="/members/new" className={linkClass}>
              <UserPlus size={18} /> Register Member
            </NavLink>
            <NavLink to="/follow-ups" className={linkClass}>
              <PhoneCall size={18} /> Follow-ups
            </NavLink>
            <NavLink to="/attendance" className={linkClass}>
              <CalendarCheck size={18} /> Attendance
            </NavLink>
            <NavLink to="/attendance/qr-scan" className={linkClass}>
              <QrCode size={18} /> Scan QR
            </NavLink>
            <NavLink to="/membership-plans" className={linkClass}>
              <CreditCard size={18} /> Membership Plans
            </NavLink>
            <NavLink to="/reports" className={linkClass}>
              <FileBarChart size={18} /> Reports
            </NavLink>
            <NavLink to="/billing" className={linkClass}>
              <Receipt size={18} /> Billing
            </NavLink>
            {isOwner && (
              <NavLink to="/users" className={linkClass}>
                <UsersRound size={18} /> Staff & Users
              </NavLink>
            )}
          </>
        )}

        {isSuperadmin && (
          <>
            <NavLink to="/superadmin/dashboard" className={linkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/company-master" className={linkClass}>
              <Building2 size={18} /> Company Master
            </NavLink>
            <NavLink to="/superadmin/users" className={linkClass}>
              <UsersRound size={18} /> All Users
            </NavLink>
          </>
        )}
      </nav>

      <div className="px-6 pb-3">
        <p className="text-[11px] leading-relaxed text-ink-tertiary dark:text-zinc-600">
          {isSuperadmin
            ? 'Gym branding & plan settings live in Company Master.'
            : 'Need branding, plan, or account changes? Ask your platform admin.'}
        </p>
      </div>

      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition-colors duration-200 press-feedback"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </aside>
  );
}