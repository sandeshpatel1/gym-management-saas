/**
 * Now just the content-padding wrapper for a single page's content.
 * Sidebar/Topbar/ImpersonationBanner moved to AppLayout.jsx, which persists
 * across navigation via a shared React Router layout route - that's what
 * stops them from remounting (and flickering) on every page change.
 *
 * `title` is accepted for backward compatibility only (every existing page
 * still passes it) but is no longer used here - the Topbar now gets its
 * title from each route's `handle.title` in App.jsx instead. No page needs
 * to change because of this.
 */
export default function DashboardLayout({ children }) {
  return <main className="p-6 max-w-[1400px] mx-auto relative z-10">{children}</main>;
}