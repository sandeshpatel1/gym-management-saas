import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Download,
  IndianRupee,
  ReceiptText,
  Search,
  Eye,
  Wallet,
  RotateCcw,
  MessageCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../context/AuthContext';
import {
  getPaymentsApi,
  getDuesApi,
  collectDueApi,
  refundPaymentApi,
  logReminderApi,
  downloadPaymentInvoice,
  getPaymentInvoicePreviewUrl,
} from '../../api/payments';

const DAY_MS = 24 * 60 * 60 * 1000;

function dueMeta(dueDate) {
  if (!dueDate) return { label: '—', tone: 'text-ink-tertiary' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / DAY_MS);

  if (diffDays < 0) {
    return { label: `Overdue ${Math.abs(diffDays)}d`, tone: 'text-red-500 font-semibold' };
  }
  if (diffDays === 0) {
    return { label: 'Due today', tone: 'text-amber-600 font-semibold' };
  }
  if (diffDays <= 3) {
    return { label: `Due in ${diffDays}d`, tone: 'text-amber-600 font-medium' };
  }
  return { label: `Due in ${diffDays}d`, tone: 'text-ink-tertiary' };
}

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = `${p.member?.fullName || ''} ${p.member?.phone || ''} ${p.invoiceNumber || ''}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default function Billing() {
  const { isEffectiveOwner } = useAuth();

  const [dues, setDues] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [duesFilter, setDuesFilter] = useState('all'); // all | overdue | soon

  const [collectTarget, setCollectTarget] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('cash');
  const [collecting, setCollecting] = useState(false);

  const [refundTarget, setRefundTarget] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [duesRes, paymentsRes] = await Promise.all([getDuesApi(), getPaymentsApi({ limit: 30 })]);
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

  const filteredDues = useMemo(() => {
    let list = dues.filter((p) => matchesQuery(p, query));
    if (duesFilter === 'overdue') {
      list = list.filter((p) => p.dueDate && new Date(p.dueDate) < new Date());
    } else if (duesFilter === 'soon') {
      const in3Days = new Date(Date.now() + 3 * DAY_MS);
      list = list.filter((p) => p.dueDate && new Date(p.dueDate) >= new Date() && new Date(p.dueDate) <= in3Days);
    }
    return list;
  }, [dues, query, duesFilter]);

  const filteredRecent = useMemo(() => recent.filter((p) => matchesQuery(p, query)), [recent, query]);

  const overdueCount = useMemo(
    () => dues.filter((p) => p.dueDate && new Date(p.dueDate) < new Date()).length,
    [dues]
  );

  // --- Collect payment ---
  const openCollect = (payment) => {
    setCollectTarget(payment);
    setCollectAmount(String(payment.amountDue));
    setCollectMethod(payment.method || 'cash');
  };

  const submitCollect = async () => {
    const amt = Number(collectAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > collectTarget.amountDue) return toast.error('Amount exceeds the outstanding due');
    setCollecting(true);
    try {
      await collectDueApi(collectTarget._id, { amount: amt, method: collectMethod });
      toast.success('Payment collected');
      setCollectTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not collect payment');
    } finally {
      setCollecting(false);
    }
  };

  // --- Refund ---
  const openRefund = (payment) => {
    setRefundTarget(payment);
    setRefundAmount(String(payment.amount));
    setRefundReason('');
  };

  const submitRefund = async () => {
    const amt = Number(refundAmount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > refundTarget.amount) return toast.error('Amount exceeds what was received');
    setRefunding(true);
    try {
      await refundPaymentApi(refundTarget._id, { amount: amt, reason: refundReason });
      toast.success('Refund recorded');
      setRefundTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not process refund');
    } finally {
      setRefunding(false);
    }
  };

  // --- Reminder (WhatsApp deep link + server-side log) ---
  const sendReminder = async (payment) => {
    const phone = (payment.member?.phone || '').replace(/[^\d]/g, '');
    const dueText = payment.dueDate
      ? `by ${new Date(payment.dueDate).toLocaleDateString()}`
      : 'at your earliest convenience';
    const message = `Hi ${payment.member?.fullName || ''}, this is a reminder that ₹${payment.amountDue.toLocaleString(
      'en-IN'
    )} is pending on invoice ${payment.invoiceNumber}. Please clear it ${dueText}. Thank you!`;

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast.error('No phone number on file for this member');
      return;
    }

    try {
      await logReminderApi(payment._id);
      load();
    } catch {
      /* non-critical - the WhatsApp message still went out */
    }
  };

  // --- PDF preview ---
  const openPreview = async (payment) => {
    setPreviewLoading(true);
    setPreviewTitle(payment.invoiceNumber);
    try {
      const url = await getPaymentInvoicePreviewUrl(payment._id);
      setPreviewUrl(url);
    } catch {
      toast.error('Could not load invoice preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewTitle('');
  };

  return (
    <DashboardLayout title="Billing & GST Invoicing">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Outstanding Dues" value={`₹${totalDue.toLocaleString('en-IN')}`} icon={IndianRupee} accent />
        <StatCard label="Members with Dues" value={dues.length} icon={ReceiptText} />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          sub={overdueCount ? 'Needs a reminder' : 'All caught up'}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by member name, phone, or invoice number"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[14px] outline-none focus:border-brand bg-white dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All Dues' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'soon', label: 'Due Soon' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setDuesFilter(t.value)}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-medium press-feedback transition-colors whitespace-nowrap ${
                duesFilter === t.value
                  ? 'bg-brand text-white'
                  : 'bg-white dark:bg-zinc-900 text-ink-secondary dark:text-zinc-400 border border-black/10 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <p className="text-[14px] font-semibold text-ink dark:text-zinc-100">Pending Payments</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : filteredDues.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No pending dues" description="Every invoice is fully paid." />
        ) : (
          <Table columns={['Invoice', 'Member', 'Plan', 'Billed', 'Paid', 'Due', 'Timeline', 'Actions']}>
            {filteredDues.map((p) => {
              const meta = dueMeta(p.dueDate);
              return (
                <tr key={p._id} className="border-b border-black/[0.04] dark:border-white/[0.06] last:border-0">
                  <td className="px-4 py-3 text-[13px] text-ink-secondary dark:text-zinc-400">{p.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[14px] font-medium text-ink dark:text-zinc-100">
                    {p.member?.fullName}
                    <p className="text-[11px] text-ink-tertiary dark:text-zinc-500 font-normal">{p.member?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-secondary dark:text-zinc-400">{p.plan?.name || '—'}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-secondary dark:text-zinc-400">
                    ₹{(p.invoiceAmount ?? p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-secondary dark:text-zinc-400">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-[14px] font-semibold text-red-500">
                    ₹{p.amountDue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-[12px] ${meta.tone}`}>{meta.label}</p>
                    {p.dueDate && (
                      <p className="text-[11px] text-ink-tertiary dark:text-zinc-500">
                        {new Date(p.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {p.reminderCount > 0 && (
                      <p className="text-[10px] text-ink-tertiary dark:text-zinc-500">
                        Reminded {p.reminderCount}x
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" onClick={() => openCollect(p)}>
                        <Wallet size={13} /> Collect
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => sendReminder(p)}>
                        <MessageCircle size={13} />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openPreview(p)}>
                        <Eye size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <p className="text-[14px] font-semibold text-ink dark:text-zinc-100">Recent Invoices</p>
        </div>
        {filteredRecent.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No invoices yet" />
        ) : (
          <Table columns={['Invoice', 'Member', 'Amount', 'Status', 'Date', 'Actions']}>
            {filteredRecent.map((p) => (
              <tr key={p._id} className="border-b border-black/[0.04] dark:border-white/[0.06] last:border-0">
                <td className="px-4 py-3 text-[13px] text-ink-secondary dark:text-zinc-400">{p.invoiceNumber}</td>
                <td className="px-4 py-3 text-[14px] font-medium text-ink dark:text-zinc-100">{p.member?.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary dark:text-zinc-400">
                  ₹{(p.invoiceAmount ?? p.amount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <Badge status={p.status === 'paid' ? 'active' : p.status === 'partial' ? 'pending' : p.status === 'refunded' ? 'cancelled' : 'expired'}>
                    {p.status || 'paid'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary dark:text-zinc-500">
                  {new Date(p.paidAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => openPreview(p)}>
                      <Eye size={13} />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => downloadPaymentInvoice(p._id, p.invoiceNumber)}>
                      <Download size={13} />
                    </Button>
                    {isEffectiveOwner && p.status !== 'refunded' && p.amount > 0 && (
                      <Button variant="secondary" size="sm" onClick={() => openRefund(p)}>
                        <RotateCcw size={13} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* --- Collect Payment modal --- */}
      <Modal open={!!collectTarget} onClose={() => setCollectTarget(null)} title="Collect Payment">
        {collectTarget && (
          <div className="space-y-4">
            <div className="bg-surface-subtle dark:bg-white/[0.04] rounded-xl p-4">
              <p className="text-[13px] text-ink-secondary dark:text-zinc-400">
                {collectTarget.member?.fullName} · {collectTarget.invoiceNumber}
              </p>
              <p className="text-[20px] font-semibold text-red-500 mt-1">
                ₹{collectTarget.amountDue.toLocaleString('en-IN')} outstanding
              </p>
            </div>
            <Input
              label="Amount Received"
              type="number"
              step="0.01"
              value={collectAmount}
              onChange={(e) => setCollectAmount(e.target.value)}
            />
            <Select label="Payment Method" value={collectMethod} onChange={(e) => setCollectMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </Select>
            <Button className="w-full" loading={collecting} onClick={submitCollect}>
              Confirm Collection
            </Button>
          </div>
        )}
      </Modal>

      {/* --- Refund modal (owner only) --- */}
      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Process Refund">
        {refundTarget && (
          <div className="space-y-4">
            <div className="bg-surface-subtle dark:bg-white/[0.04] rounded-xl p-4">
              <p className="text-[13px] text-ink-secondary dark:text-zinc-400">
                {refundTarget.member?.fullName} · {refundTarget.invoiceNumber}
              </p>
              <p className="text-[13px] text-ink-tertiary dark:text-zinc-500 mt-1">
                Amount received: ₹{refundTarget.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <Input
              label="Refund Amount"
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
            <Input
              label="Reason (optional)"
              placeholder="Membership cancelled, duplicate charge, etc."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <Button variant="danger" className="w-full" loading={refunding} onClick={submitRefund}>
              Confirm Refund
            </Button>
          </div>
        )}
      </Modal>

     {/* --- PDF preview modal --- */}
<Modal
  open={!!(previewUrl || previewLoading)}
  onClose={closePreview}
  title={previewTitle || 'Invoice Preview'}
  width="max-w-3xl"
>
  {previewLoading ? (
    <div className="h-[70vh] flex items-center justify-center text-ink-tertiary text-[13px]">
      Loading preview…
    </div>
  ) : previewUrl ? (
    <div className="space-y-3">
      <iframe
        src={previewUrl}
        title="Invoice preview"
        className="w-full h-[70vh] rounded-xl border border-black/10 dark:border-white/10"
      />

      <a
        href={previewUrl}
        download={`${previewTitle || 'invoice'}.pdf`}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-brand"
      >
        <Download size={14} />
        Download this PDF
      </a>
    </div>
  ) : null}
</Modal>
    </DashboardLayout>
  );
}