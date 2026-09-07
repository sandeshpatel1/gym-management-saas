import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { getMembersApi, searchMembersApi } from '../../api/members';

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMembersApi({ limit: 50 });
      setMembers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        if (query.trim().length === 0) loadAll();
        return;
      }
      try {
        const { data } = await searchMembersApi(query.trim());
        setMembers(data);
      } catch {
        /* silent - keep previous results */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, loadAll]);

  return (
    <DashboardLayout title="Members">
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, email, or code"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 text-[14px] outline-none focus:border-brand"
          />
        </div>
        <Button onClick={() => navigate('/members/new')}>
          <UserPlus size={16} /> Register Member
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members found"
            description="Try a different search, or register a new member."
            action={<Button onClick={() => navigate('/members/new')}>Register Member</Button>}
          />
        ) : (
          <Table columns={['Member', 'Code', 'Phone', 'Plan', 'Status', 'Valid Till']}>
            {members.map((m) => (
              <tr
                key={m._id}
                onClick={() => navigate(`/members/${m._id}`)}
                className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] cursor-pointer"
              >
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{m.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{m.memberCode}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{m.phone}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {m.currentPlan?.name || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge status={m.status} />
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {m.membershipEnd ? new Date(m.membershipEnd).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
}
