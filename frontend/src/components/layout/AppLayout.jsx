import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ImpersonationBanner from '../common/ImpersonationBanner';

/**
 * Persistent shell for every "dashboard" page - Sidebar, Topbar, and the
 * impersonation banner all live HERE, one level above the router's
 * <Outlet/>, instead of each page mounting its own copy via
 * DashboardLayout. That's what used to cause the branch switcher (and
 * everything else in the sidebar) to flicker on every navigation: each
 * page swap unmounted and remounted the whole chrome from scratch. Now
 * only the page content inside <Outlet/> changes; this shell stays put.
 *
 * Per-page titles come from matching the current path against the map
 * below - NOT route `handle`/useMatches, which only work with a data
 * router (createBrowserRouter). This app uses <BrowserRouter>/<Routes>,
 * so matchPath is the compatible equivalent.
 */
const PAGE_TITLES = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/members', title: 'Members' },
  { path: '/members/new', title: 'Register Member' },
  { path: '/members/:id/edit', title: 'Edit Member' },
  { path: '/members/:id', title: 'Member Report Card' },
  { path: '/follow-ups', title: 'Member Follow-ups' },
  { path: '/attendance', title: 'Attendance' },
  { path: '/membership-plans', title: 'Membership Plans' },
  { path: '/reports', title: 'Revenue Report' },
  { path: '/billing', title: 'Billing & GST Invoicing' },
  { path: '/users', title: 'Staff & Users' },
  { path: '/settings', title: 'Gym Settings' },
  { path: '/profile', title: 'My Profile' },
  { path: '/company-master/add-branch', title: 'Add Branch' },
  { path: '/company-master', title: 'Company Master' },
  { path: '/my-branches', title: 'All Branches' },
  { path: '/superadmin/dashboard', title: 'Platform Overview' },
  { path: '/superadmin/users', title: 'All Users' },
  { path: '/superadmin/payment-methods', title: 'Payment Methods & Gateways' },
  { path: '/superadmin/audit-log', title: 'Impersonation Audit Log' },
];

function resolveTitle(pathname) {
  const match = PAGE_TITLES.find((p) => matchPath({ path: p.path, end: true }, pathname));
  return match?.title || '';
}

export default function AppLayout() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);

  return (
    <div className="h-screen flex flex-col bg-surface-subtle dark:bg-zinc-950 transition-colors duration-300 overflow-hidden">
      <ImpersonationBanner />

      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        <div className="relative flex-1 min-w-0 flex flex-col min-h-0">
          <Topbar title={title} />

          <div className="relative flex-1 overflow-y-auto">
            {/* Apple-style soft aurora accents behind the glass panels */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="aurora-blob absolute -top-32 -left-20 h-96 w-96 rounded-full bg-brand/20 dark:bg-brand/10 blur-3xl" />
              <div
                className="aurora-blob absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-purple-300/20 dark:bg-purple-500/10 blur-3xl"
                style={{ animationDelay: '3s' }}
              />
              <div
                className="aurora-blob absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-200/20 dark:bg-blue-500/10 blur-3xl"
                style={{ animationDelay: '6s' }}
              />
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}