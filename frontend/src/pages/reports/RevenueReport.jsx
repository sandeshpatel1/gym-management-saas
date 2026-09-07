import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getRevenueReportApi, exportRevenuePdf } from '../../api/reports';
import { getPaymentsApi } from '../../api/payments';
import Table from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { FileBarChart } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function RevenueReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [byDay, setByDay] = useState([]);
  const [total, setTotal] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data }, paymentsRes] = await Promise.all([
        getRevenueReportApi(from || undefined, to || undefined),
        getPaymentsApi({ from: from || undefined, to: to || undefined, limit: 50 }),
      ]);
      setByDay(data.byDay.map((d) => ({ date: d._id.slice(5), total: d.total })));
      setTotal(data.totalRevenue);
      setPayments(paymentsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load revenue report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRevenuePdf(from || undefined, to || undefined);
    } catch {
      toast.error('Could not export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="Revenue Report">
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="secondary" onClick={load}>
            Apply Filter
          </Button>
          <Button onClick={handleExport} loading={exporting} className="ml-auto">
            <Download size={15} /> Export PDF
          </Button>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[14px] font-semibold text-ink">Revenue Trend</p>
          <p className="text-[22px] font-semibold text-brand display-text">
            ₹{total.toLocaleString('en-IN')} <span className="text-[13px] text-ink-tertiary font-normal">total</span>
          </p>
        </div>
        {loading ? (
          <div className="h-[260px] flex items-center justify-center text-ink-tertiary text-[13px]">
            Loading…
          </div>
        ) : byDay.length === 0 ? (
          <p className="text-[13px] text-ink-tertiary py-10 text-center">
            No revenue in this range.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#86868B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#86868B" />
              <Tooltip />
              <Bar dataKey="total" fill="var(--brand-color)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <p className="text-[14px] font-semibold text-ink">Transactions</p>
        </div>
        {payments.length === 0 ? (
          <EmptyState icon={FileBarChart} title="No transactions" description="Payments will appear here." />
        ) : (
          <Table columns={['Invoice', 'Member', 'Plan', 'Method', 'Amount', 'Date']}>
            {payments.map((p) => (
              <tr key={p._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{p.invoiceNumber}</td>
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{p.member?.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{p.plan?.name || '—'}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary capitalize">{p.method}</td>
                <td className="px-4 py-3 text-[14px] font-semibold text-ink">
                  ₹{p.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {new Date(p.paidAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
}
