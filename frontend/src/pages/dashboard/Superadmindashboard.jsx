import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Users, ShieldCheck, Plus, UsersRound } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { getPlatformStatsApi } from '../../api/reports';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getPlatformStatsApi();
        setStats(data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load platform overview');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout title="Platform Overview">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl2 border border-black/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Gyms Onboarded" value={stats?.totalCompanies ?? 0} icon={Building2} />
            <StatCard
              label="Active Gyms"
              value={stats?.activeCompanies ?? 0}
              icon={ShieldCheck}
              accent
              sub={stats?.inactiveCompanies ? `${stats.inactiveCompanies} inactive` : 'All active'}
            />
            <StatCard label="Staff Logins" value={stats?.totalStaff ?? 0} icon={UsersRound} />
            <StatCard label="Total Members" value={stats?.totalMembers ?? 0} icon={Users} accent />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 lg:col-span-1">
              <p className="text-[14px] font-semibold text-ink mb-4">Staff by Role</p>
              <div className="space-y-3">
                {['owner', 'manager', 'trainer'].map((role) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-[13px] text-ink-secondary capitalize">{role}s</span>
                    <span className="text-[14px] font-semibold text-ink">
                      {stats?.usersByRole?.[role] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-semibold text-ink">Recently Onboarded Gyms</p>
                <Button size="sm" variant="secondary" onClick={() => navigate('/company-master')}>
                  <Plus size={14} /> Onboard Gym
                </Button>
              </div>
              {!stats?.recentCompanies?.length ? (
                <EmptyState
                  icon={Building2}
                  title="No gyms yet"
                  description="Onboard the first gym to get started."
                />
              ) : (
                <div className="space-y-2">
                  {stats.recentCompanies.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between py-2.5 border-b border-black/[0.04] last:border-0"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-ink">{c.name}</p>
                        <p className="text-[12px] text-ink-tertiary">
                          {c.code} · Onboarded {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge status={c.isActive ? 'active' : 'cancelled'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 flex items-center justify-between" hover>
              <div>
                <p className="text-[14px] font-semibold text-ink">Company Master</p>
                <p className="text-[12px] text-ink-tertiary">Onboard, edit, activate/deactivate gyms</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/company-master')}>
                Open
              </Button>
            </Card>
            <Card className="p-5 flex items-center justify-between" hover>
              <div>
                <p className="text-[14px] font-semibold text-ink">All Users</p>
                <p className="text-[12px] text-ink-tertiary">Create/manage logins for any gym</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/superadmin/users')}>
                Open
              </Button>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}