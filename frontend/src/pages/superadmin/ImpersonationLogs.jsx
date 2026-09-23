import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert, LogIn, LogOut as LogOutIcon, Pencil } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { getImpersonationLogsApi } from '../../api/impersonation';
import { getCompaniesApi } from '../../api/companies';

const actionMeta = {
  enter: { label: 'Started managing', icon: LogIn, badge: 'active' },
  exit: { label: 'Stopped managing', icon: LogOutIcon, badge: 'cancelled' },
  write: { label: 'Write', icon: Pencil, badge: 'pending' },
};

export default function ImpersonationLogs() {
  const [logs, setLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data, pagination: p } = await getImpersonationLogsApi({
        company: companyFilter || undefined,
        action: actionFilter || undefined,
        page,
        limit: 50,
      });
      setLogs(data);
      setPagination(p);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCompaniesApi()
      .then(({ data }) => setCompanies(data))
      .catch(() => {
        /* company filter just won't populate - the log itself still loads */
      });
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter, actionFilter]);

  return (
    <DashboardLayout title="Impersonation Audit Log">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="sm:w-64">
          <option value="">All gyms</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="sm:w-48">
          <option value="">All actions</option>
          <option value="enter">Started managing</option>
          <option value="write">Write actions</option>
          <option value="exit">Stopped managing</option>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No activity logged"
            description="Superadmin impersonation sessions and write actions will appear here."
          />
        ) : (
          <Table columns={['When', 'Superadmin', 'Gym', 'Action', 'Detail']}>
            {logs.map((l) => {
              const meta = actionMeta[l.action] || actionMeta.write;
              const Icon = meta.icon;
              return (
                <tr key={l._id} className="border-b border-black/[0.04] last:border-0">
                  <td className="px-4 py-3 text-[12px] text-ink-tertiary whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-ink">{l.superadminName}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-secondary">{l.companyName}</td>
                  <td className="px-4 py-3">
                    <Badge status={meta.badge}>
                      <span className="flex items-center gap-1">
                        <Icon size={11} /> {meta.label}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-tertiary font-mono">
                    {l.action === 'write' ? `${l.method} ${l.path} · ${l.statusCode}` : '—'}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {pagination.pages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-4">
          {Array.from({ length: pagination.pages })
            .slice(0, 10)
            .map((_, i) => (
              <button
                key={i}
                onClick={() => load(i + 1)}
                className={`h-8 w-8 rounded-lg text-[12px] font-medium press-feedback ${
                  pagination.page === i + 1
                    ? 'bg-brand text-white'
                    : 'bg-white text-ink-secondary border border-black/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
        </div>
      )}
    </DashboardLayout>
  );
}