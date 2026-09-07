import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, IndianRupee, ReceiptText } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import { getPaymentsApi, getDuesApi, downloadPaymentInvoice } from '../../api/payments';

export default function Billing() {
  const [dues, setDues] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [duesRes, paymentsRes] = await Promise.all([getDuesApi(), getPaymentsApi({ limit: 20 })]);
      setDues(duesRes.data);
      setTotalDue(duesRes.totalDue);
      setRecent(paymentsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout title="Billing & GST Invoicing">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Outstanding Dues" value={`₹${totalDue.toLocaleString('en-IN')}`} icon={IndianRupee} accent />
        <StatCard label="Members with Dues" value={dues.length} icon={ReceiptText} />
        <StatCard label="Recent Invoices" value={recent.length} icon={ReceiptText} />
      </div>

      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <p className="text-[14px] font-semibold text-ink">Pending Payments</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : dues.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No pending dues" description="Every invoice is fully paid." />
        ) : (
          <Table columns={['Invoice', 'Member', 'Plan', 'Billed', 'Paid', 'Due', 'Due Date', '']}>
            {dues.map((p) => (
              <tr key={p._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{p.invoiceNumber}</td>
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{p.member?.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{p.plan?.name || '—'}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  ₹{(p.invoiceAmount ?? p.amount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">₹{p.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[14px] font-semibold text-red-500">
                  ₹{p.amountDue.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary">
                  {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" size="sm" onClick={() => downloadPaymentInvoice(p._id, p.invoiceNumber)}>
                    <Download size={13} /> Invoice
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <p className="text-[14px] font-semibold text-ink">Recent Invoices</p>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No invoices yet" />
        ) : (
          <Table columns={['Invoice', 'Member', 'Amount', 'Status', 'Date', '']}>
            {recent.map((p) => (
              <tr key={p._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{p.invoiceNumber}</td>
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{p.member?.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  ₹{(p.invoiceAmount ?? p.amount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <Badge status={p.status === 'paid' ? 'active' : p.status === 'partial' ? 'pending' : 'expired'}>
                    {p.status || 'paid'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary">{new Date(p.paidAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Button variant="secondary" size="sm" onClick={() => downloadPaymentInvoice(p._id, p.invoiceNumber)}>
                    <Download size={13} />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
}