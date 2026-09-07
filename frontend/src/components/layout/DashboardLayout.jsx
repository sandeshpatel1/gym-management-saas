import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ title, children }) {
  return (
    <div className="relative flex min-h-screen bg-surface-subtle dark:bg-zinc-950 overflow-hidden transition-colors duration-300">
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

      <Sidebar />
      <div className="relative flex-1 min-w-0">
        <Topbar title={title} />
        <main className="p-6 max-w-[1400px] mx-auto relative z-10">{children}</main>
      </div>
    </div>
  );
}