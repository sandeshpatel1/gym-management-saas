import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, UserCheck, CalendarCheck, IndianRupee, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import CompanyLogo from '../../components/common/CompanyLogo';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useMyBranches } from '../../hooks/useMyBranches';
import { getDashboardStatsApi } from '../../api/reports';

export default function MyBranchesOverview() {
  const { startManaging } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [statsByBranch, setStatsByBranch] = useState({});
  const [loading, setLoading] = useState(true);

  const { branches: myBranches } = useMyBranches();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = myBranches;
        setBranches(data);
        const entries = await Promise.all(
          data.map(async (b) => {
            try {
              const res = await getDashboardStatsApi(b._id);
              return [b._id, res.data];
            } catch {
              return [b._id, null];
            }
          })
        );
        setStatsByBranch(Object.fromEntries(entries));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load your branches');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = branches.reduce(
    (acc, b) => {
      const s = statsByBranch[b._id];
      if (!s) return acc;
      acc.totalMembers += s.totalMembers || 0;
      acc.activeMembers += s.activeMembers || 0;
      acc.todaysAttendance += s.todaysAttendance || 0;
      acc.monthRevenue += s.monthRevenue || 0;
      acc.expiringSoon += s.expiringSoon || 0;
      return acc;
    },
    { totalMembers: 0, activeMembers: 0, todaysAttendance: 0, monthRevenue: 0, expiringSoon: 0 }
  );

  const goToBranch = (b) => {
    startManaging({ id: b._id, name: b.name, code: b.code, branding: b.branding });
    navigate('/dashboard');
  };

  return (
    <DashboardLayout title="All Branches">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white/60 dark:bg-zinc-900/50 rounded-xl2 border border-black/[0.06] dark:border-white/[0.08] animate-pulse"
            />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No branches yet"
          description="Ask your platform admin to set up another location for you."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total Members" value={totals.totalMembers} icon={Users} />
            <StatCard label="Active Members" value={totals.activeMembers} icon={UserCheck} accent />
            <StatCard label="Today's Attendance" value={totals.todaysAttendance} icon={CalendarCheck} />
            <StatCard
              label="This Month's Revenue"
              value={`₹${totals.monthRevenue.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              accent
            />
            <StatCard label="Expiring in 7 Days" value={totals.expiringSoon} icon={AlertTriangle} />
          </div>

          <p className="text-[13px] text-ink-tertiary dark:text-zinc-500 mb-3">
            Combined across {branches.length} branches · tap a branch to switch into it
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const s = statsByBranch[b._id];
              return (
                <Card key={b._id} className="p-5" hover>
                  <div className="flex items-center gap-3 mb-4">
                    <CompanyLogo company={b} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 truncate">
                        {b.name}
                      </p>
                      <p className="text-[11px] text-ink-tertiary dark:text-zinc-500">
                        {b.code}
                        {b.contact?.city ? ` · ${b.contact.city}` : ''}
                        {!b.isActive && <span className="text-red-500 ml-1">· inactive</span>}
                      </p>
                    </div>
                  </div>

                  {s ? (
                    <div className="grid grid-cols-2 gap-y-2 text-[12.5px] mb-4">
                      <span className="text-ink-tertiary dark:text-zinc-500">Members</span>
                      <span className="text-right font-medium text-ink dark:text-zinc-100">
                        {s.totalMembers}
                      </span>
                      <span className="text-ink-tertiary dark:text-zinc-500">Today's check-ins</span>
                      <span className="text-right font-medium text-ink dark:text-zinc-100">
                        {s.todaysAttendance}
                      </span>
                      <span className="text-ink-tertiary dark:text-zinc-500">This month's revenue</span>
                      <span className="text-right font-medium text-ink dark:text-zinc-100">
                        ₹{(s.monthRevenue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[12px] text-ink-tertiary mb-4">Stats unavailable</p>
                  )}

                  <Button variant="secondary" className="w-full" onClick={() => goToBranch(b)}>
                    Open <ArrowRight size={14} />
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}