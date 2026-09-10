import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ImpersonationBanner from '../common/ImpersonationBanner';

export default function DashboardLayout({ title, children }) {
  return (
    <div className="h-screen flex flex-col bg-surface-subtle dark:bg-zinc-950 transition-colors duration-300 overflow-hidden">
      <ImpersonationBanner />

      {/* Everything below the banner is a fixed-height row: sidebar + topbar
          never scroll. Only the content pane inside scrolls. */}
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

            <main className="p-6 max-w-[1400px] mx-auto relative z-10">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}